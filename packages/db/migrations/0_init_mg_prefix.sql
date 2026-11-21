-- Baseline for menu-go on the shared gridscore Supabase project.
-- Every table carries the mg_ prefix so it cannot collide with the other
-- apps living in the same public schema (gridscore core tables, rb_*, tt_*).

-- CreateTable
CREATE TABLE "mg_account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "mg_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mg_session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mg_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mg_user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,

    CONSTRAINT "mg_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mg_verification_token" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mg_verification_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mg_config_restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "slug" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "logoUrl" TEXT,
    "cuisineType" TEXT,
    "primaryColor" TEXT DEFAULT '#4F46E5',
    "backgroundColor" TEXT DEFAULT '#FFFFFF',
    "qrCode" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mg_config_restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mg_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "configRestaurantId" TEXT,

    CONSTRAINT "mg_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mg_dishes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "configRestaurantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mg_dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mg_menu_view" (
    "id" TEXT NOT NULL,
    "configRestaurantId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mg_menu_view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mg_account_provider_providerAccountId_key" ON "mg_account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "mg_session_sessionToken_key" ON "mg_session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "mg_user_email_key" ON "mg_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mg_verification_token_token_key" ON "mg_verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "mg_verification_token_identifier_token_key" ON "mg_verification_token"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "mg_config_restaurant_slug_key" ON "mg_config_restaurant"("slug");

-- AddForeignKey
ALTER TABLE "mg_account" ADD CONSTRAINT "mg_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mg_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mg_session" ADD CONSTRAINT "mg_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mg_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mg_config_restaurant" ADD CONSTRAINT "mg_config_restaurant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mg_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mg_category" ADD CONSTRAINT "mg_category_configRestaurantId_fkey" FOREIGN KEY ("configRestaurantId") REFERENCES "mg_config_restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mg_dishes" ADD CONSTRAINT "mg_dishes_configRestaurantId_fkey" FOREIGN KEY ("configRestaurantId") REFERENCES "mg_config_restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mg_dishes" ADD CONSTRAINT "mg_dishes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "mg_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mg_menu_view" ADD CONSTRAINT "mg_menu_view_configRestaurantId_fkey" FOREIGN KEY ("configRestaurantId") REFERENCES "mg_config_restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tables live in the shared Supabase "public" schema, which PostgREST exposes
-- to anon/authenticated keys. Enable RLS with no policies so only the
-- server-side Prisma connection (postgres role, bypasses RLS) can reach them.
ALTER TABLE "mg_account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mg_session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mg_user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mg_verification_token" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mg_config_restaurant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mg_category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mg_dishes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mg_menu_view" ENABLE ROW LEVEL SECURITY;
