// Supabase types for menu-go, generated from the shared gridscore project and
// filtered to mg_* objects (the project also hosts other apps' tables).
// Regenerate after every migration: Supabase MCP `generate_typescript_types`
// or `supabase gen types typescript --project-id dfllsojtcwryhkvoetfh`, then
// keep only the mg_ tables and functions below.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type MgConfigRestaurantRow = {
  address: string | null;
  backgroundColor: string | null;
  createdAt: string;
  cuisineType: string | null;
  id: string;
  image: string | null;
  logoUrl: string | null;
  name: string | null;
  phone: string | null;
  primaryColor: string | null;
  qrCode: string | null;
  slug: string | null;
  updatedAt: string;
  userId: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.17';
  };
  public: {
    Tables: {
      mg_account: {
        Row: {
          access_token: string | null;
          expires_at: number | null;
          id: string;
          id_token: string | null;
          provider: string;
          providerAccountId: string;
          refresh_token: string | null;
          scope: string | null;
          session_state: string | null;
          token_type: string | null;
          type: string;
          userId: string;
        };
        Insert: {
          access_token?: string | null;
          expires_at?: number | null;
          id?: string;
          id_token?: string | null;
          provider: string;
          providerAccountId: string;
          refresh_token?: string | null;
          scope?: string | null;
          session_state?: string | null;
          token_type?: string | null;
          type: string;
          userId: string;
        };
        Update: {
          access_token?: string | null;
          expires_at?: number | null;
          id?: string;
          id_token?: string | null;
          provider?: string;
          providerAccountId?: string;
          refresh_token?: string | null;
          scope?: string | null;
          session_state?: string | null;
          token_type?: string | null;
          type?: string;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mg_account_userId_fkey';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'mg_user';
            referencedColumns: ['id'];
          },
        ];
      };
      mg_category: {
        Row: {
          configRestaurantId: string | null;
          description: string;
          id: string;
          image: string | null;
          name: string;
        };
        Insert: {
          configRestaurantId?: string | null;
          description: string;
          id?: string;
          image?: string | null;
          name: string;
        };
        Update: {
          configRestaurantId?: string | null;
          description?: string;
          id?: string;
          image?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mg_category_configRestaurantId_fkey';
            columns: ['configRestaurantId'];
            isOneToOne: false;
            referencedRelation: 'mg_config_restaurant';
            referencedColumns: ['id'];
          },
        ];
      };
      mg_config_restaurant: {
        Row: MgConfigRestaurantRow;
        Insert: {
          address?: string | null;
          backgroundColor?: string | null;
          createdAt?: string;
          cuisineType?: string | null;
          id?: string;
          image?: string | null;
          logoUrl?: string | null;
          name?: string | null;
          phone?: string | null;
          primaryColor?: string | null;
          qrCode?: string | null;
          slug?: string | null;
          updatedAt?: string;
          userId: string;
        };
        Update: {
          address?: string | null;
          backgroundColor?: string | null;
          createdAt?: string;
          cuisineType?: string | null;
          id?: string;
          image?: string | null;
          logoUrl?: string | null;
          name?: string | null;
          phone?: string | null;
          primaryColor?: string | null;
          qrCode?: string | null;
          slug?: string | null;
          updatedAt?: string;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mg_config_restaurant_userId_fkey';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'mg_user';
            referencedColumns: ['id'];
          },
        ];
      };
      mg_dishes: {
        Row: {
          categoryId: string;
          configRestaurantId: string;
          createdAt: string;
          description: string | null;
          id: string;
          image: string | null;
          isAvailable: boolean;
          name: string;
          price: number;
          tags: string[] | null;
          updatedAt: string;
        };
        Insert: {
          categoryId: string;
          configRestaurantId: string;
          createdAt?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          isAvailable?: boolean;
          name: string;
          price: number;
          tags?: string[] | null;
          updatedAt?: string;
        };
        Update: {
          categoryId?: string;
          configRestaurantId?: string;
          createdAt?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          isAvailable?: boolean;
          name?: string;
          price?: number;
          tags?: string[] | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mg_dishes_categoryId_fkey';
            columns: ['categoryId'];
            isOneToOne: false;
            referencedRelation: 'mg_category';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mg_dishes_configRestaurantId_fkey';
            columns: ['configRestaurantId'];
            isOneToOne: false;
            referencedRelation: 'mg_config_restaurant';
            referencedColumns: ['id'];
          },
        ];
      };
      mg_menu_view: {
        Row: {
          configRestaurantId: string;
          createdAt: string;
          id: string;
          source: string;
        };
        Insert: {
          configRestaurantId: string;
          createdAt?: string;
          id?: string;
          source?: string;
        };
        Update: {
          configRestaurantId?: string;
          createdAt?: string;
          id?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mg_menu_view_configRestaurantId_fkey';
            columns: ['configRestaurantId'];
            isOneToOne: false;
            referencedRelation: 'mg_config_restaurant';
            referencedColumns: ['id'];
          },
        ];
      };
      mg_user: {
        Row: {
          email: string | null;
          emailVerified: string | null;
          failedLoginCount: number;
          id: string;
          image: string | null;
          lockedUntil: string | null;
          name: string | null;
          password: string | null;
        };
        Insert: {
          email?: string | null;
          emailVerified?: string | null;
          failedLoginCount?: number;
          id?: string;
          image?: string | null;
          lockedUntil?: string | null;
          name?: string | null;
          password?: string | null;
        };
        Update: {
          email?: string | null;
          emailVerified?: string | null;
          failedLoginCount?: number;
          id?: string;
          image?: string | null;
          lockedUntil?: string | null;
          name?: string | null;
          password?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      mg_import_catalog: {
        Args: { p_categories: Json; p_config_restaurant_id: string };
        Returns: undefined;
      };
      mg_publish_new_catalog: {
        Args: {
          p_address: string;
          p_categories: Json;
          p_name: string;
          p_phone: string;
          p_qr_code: string;
          p_slug: string;
          p_user_id: string;
        };
        Returns: MgConfigRestaurantRow;
        SetofOptions: {
          from: '*';
          to: 'mg_config_restaurant';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];

// Row aliases used across the app (same names the Prisma client exported).
export type User = Tables<'mg_user'>;
export type Account = Tables<'mg_account'>;
export type ConfigRestaurant = Tables<'mg_config_restaurant'>;
export type Category = Tables<'mg_category'>;
export type Dishes = Tables<'mg_dishes'>;
export type MenuView = Tables<'mg_menu_view'>;
