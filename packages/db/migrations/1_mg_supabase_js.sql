-- menu-go: move data access from Prisma to supabase-js.
-- Shared gridscore project: touch mg_ objects only (plus menu-go's own
-- _prisma_migrations bookkeeping table, which is dropped).

-- 1. Database-owned ids and timestamps (Prisma generated them client-side).
ALTER TABLE "mg_user"              ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "mg_account"           ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "mg_config_restaurant" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "mg_category"          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "mg_dishes"            ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "mg_menu_view"         ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

ALTER TABLE "mg_config_restaurant" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "mg_dishes"            ALTER COLUMN "updatedAt" SET DEFAULT now();

CREATE OR REPLACE FUNCTION public.mg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER mg_config_restaurant_set_updated_at
  BEFORE UPDATE ON "mg_config_restaurant"
  FOR EACH ROW EXECUTE FUNCTION public.mg_set_updated_at();

CREATE TRIGGER mg_dishes_set_updated_at
  BEFORE UPDATE ON "mg_dishes"
  FOR EACH ROW EXECUTE FUNCTION public.mg_set_updated_at();

-- 2. Atomic catalog import. A function body runs in one transaction, so a
-- failure anywhere rolls back every category and dish from the call.
-- p_categories: [{ "name": text, "dishes": [{ "name", "description", "price", "tags": [text] }] }]
CREATE OR REPLACE FUNCTION public.mg_import_catalog(
  p_config_restaurant_id text,
  p_categories jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  cat jsonb;
  dish jsonb;
  v_category_id text;
BEGIN
  FOR cat IN SELECT * FROM jsonb_array_elements(coalesce(p_categories, '[]'::jsonb)) LOOP
    -- Reuse a same-name category of this restaurant, else create it.
    SELECT c."id" INTO v_category_id
      FROM "mg_category" c
     WHERE c."name" = cat->>'name'
       AND c."configRestaurantId" = p_config_restaurant_id
     LIMIT 1;

    IF v_category_id IS NULL THEN
      INSERT INTO "mg_category" ("name", "description", "configRestaurantId")
      VALUES (cat->>'name', cat->>'name', p_config_restaurant_id)
      RETURNING "id" INTO v_category_id;
    END IF;

    FOR dish IN SELECT * FROM jsonb_array_elements(coalesce(cat->'dishes', '[]'::jsonb)) LOOP
      INSERT INTO "mg_dishes" ("name", "description", "price", "tags", "configRestaurantId", "categoryId")
      VALUES (
        dish->>'name',
        coalesce(dish->>'description', ''),
        coalesce(nullif(dish->>'price', '')::double precision, 0),
        coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(dish->'tags', '[]'::jsonb))), '{}'),
        p_config_restaurant_id,
        v_category_id
      );
    END LOOP;
  END LOOP;
END;
$$;

-- First publish: create the restaurant and import its catalog atomically.
CREATE OR REPLACE FUNCTION public.mg_publish_new_catalog(
  p_user_id text,
  p_name text,
  p_address text,
  p_phone text,
  p_slug text,
  p_qr_code text,
  p_categories jsonb
)
RETURNS "mg_config_restaurant"
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_restaurant "mg_config_restaurant";
BEGIN
  INSERT INTO "mg_config_restaurant" ("name", "userId", "address", "phone", "slug", "qrCode")
  VALUES (p_name, p_user_id, coalesce(p_address, ''), coalesce(p_phone, ''), p_slug, p_qr_code)
  RETURNING * INTO v_restaurant;

  PERFORM public.mg_import_catalog(v_restaurant."id", p_categories);

  RETURN v_restaurant;
END;
$$;

-- 3. Only the server (service_role) may reach menu-go objects. RLS with no
-- policies already blocks anon/authenticated; revoking grants is a second
-- barrier in case a future table forgets RLS.
REVOKE ALL ON TABLE "mg_user", "mg_account", "mg_config_restaurant",
  "mg_category", "mg_dishes", "mg_menu_view"
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.mg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mg_import_catalog(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mg_publish_new_catalog(text, text, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mg_import_catalog(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.mg_publish_new_catalog(text, text, text, text, text, text, jsonb) TO service_role;
