export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string | null
          detail_address: string
          district: string
          id: string
          is_default: boolean | null
          name: string
          phone: string
          province: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string | null
          detail_address: string
          district: string
          id?: string
          is_default?: boolean | null
          name: string
          phone: string
          province: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string | null
          detail_address?: string
          district?: string
          id?: string
          is_default?: boolean | null
          name?: string
          phone?: string
          province?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          role: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          role?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          role?: string | null
          username?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          position: string | null
          sort_order: number | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          position?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          position?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          order_number: string
          payment_method: string | null
          payment_status: string | null
          shipping_address: string
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          shipping_address: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          api_key: string | null
          api_secret: string | null
          code: string
          created_at: string | null
          fee_fixed: number | null
          fee_percent: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          test_mode: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          code: string
          created_at?: string | null
          fee_fixed?: number | null
          fee_percent?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          test_mode?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          code?: string
          created_at?: string | null
          fee_fixed?: number | null
          fee_percent?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          test_mode?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_detail_pages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          layout: Json | null
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout?: Json | null
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          layout?: Json | null
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_detail_pages_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_likes: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_likes_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_shares: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          product_id: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          product_id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          product_id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_shares_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          created_at: string | null
          id: string
          last_viewed_at: string | null
          product_id: string
          session_id: string | null
          user_id: string | null
          view_count: number | null
          view_date: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_viewed_at?: string | null
          product_id: string
          session_id?: string | null
          user_id?: string | null
          view_count?: number | null
          view_date?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_viewed_at?: string | null
          product_id?: string
          session_id?: string | null
          user_id?: string | null
          view_count?: number | null
          view_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          box_contents: string[] | null
          category_id: string | null
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          likes_count: number | null
          name: string
          original_price: number | null
          price: number
          sales_count: number | null
          shares_count: number | null
          short_description: string | null
          slug: string
          specifications: Json | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          box_contents?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          name: string
          original_price?: number | null
          price: number
          sales_count?: number | null
          shares_count?: number | null
          short_description?: string | null
          slug: string
          specifications?: Json | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          box_contents?: string[] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          name?: string
          original_price?: number | null
          price?: number
          sales_count?: number | null
          shares_count?: number | null
          short_description?: string | null
          slug?: string
          specifications?: Json | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          created_at: string | null
          customer_name: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          rating: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          customer_name: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          rating?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          customer_name?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          rating?: number | null
        }
        Relationships: []
      }
      traffic_sources: {
        Row: {
          created_at: string | null
          id: string
          source_name: string
          stat_date: string
          visitors: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_name: string
          stat_date: string
          visitors?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          source_name?: string
          stat_date?: string
          visitors?: number | null
        }
        Relationships: []
      }
      traffic_stats: {
        Row: {
          avg_pages_per_session: number | null
          created_at: string | null
          hour: number | null
          id: string
          new_visitors: number | null
          orders_count: number | null
          page_views: number | null
          paying_customers: number | null
          product_views: number | null
          returning_visitors: number | null
          stat_date: string
          unique_visitors: number | null
          updated_at: string | null
        }
        Insert: {
          avg_pages_per_session?: number | null
          created_at?: string | null
          hour?: number | null
          id?: string
          new_visitors?: number | null
          orders_count?: number | null
          page_views?: number | null
          paying_customers?: number | null
          product_views?: number | null
          returning_visitors?: number | null
          stat_date: string
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_pages_per_session?: number | null
          created_at?: string | null
          hour?: number | null
          id?: string
          new_visitors?: number | null
          orders_count?: number | null
          page_views?: number | null
          paying_customers?: number | null
          product_views?: number | null
          returning_visitors?: number | null
          stat_date?: string
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activity_stats: {
        Row: {
          created_at: string | null
          id: string
          last_active_at: string | null
          login_count: number | null
          total_session_time: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_active_at?: string | null
          login_count?: number | null
          total_session_time?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_active_at?: string | null
          login_count?: number | null
          total_session_time?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_stats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_channel_stats: {
        Row: {
          channel: string
          conversion_rate: number | null
          id: string
          updated_at: string | null
          user_count: number | null
        }
        Insert: {
          channel: string
          conversion_rate?: number | null
          id?: string
          updated_at?: string | null
          user_count?: number | null
        }
        Update: {
          channel?: string
          conversion_rate?: number | null
          id?: string
          updated_at?: string | null
          user_count?: number | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_geo_distribution: {
        Row: {
          city: string | null
          id: string
          province: string | null
          updated_at: string | null
          user_count: number | null
        }
        Insert: {
          city?: string | null
          id?: string
          province?: string | null
          updated_at?: string | null
          user_count?: number | null
        }
        Update: {
          city?: string | null
          id?: string
          province?: string | null
          updated_at?: string | null
          user_count?: number | null
        }
        Relationships: []
      }
      user_registration_stats: {
        Row: {
          created_at: string | null
          daily_count: number | null
          date: string
          id: string
          monthly_count: number | null
          weekly_count: number | null
        }
        Insert: {
          created_at?: string | null
          daily_count?: number | null
          date: string
          id?: string
          monthly_count?: number | null
          weekly_count?: number | null
        }
        Update: {
          created_at?: string | null
          daily_count?: number | null
          date?: string
          id?: string
          monthly_count?: number | null
          weekly_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_product_view_stats: {
        Args: { p_time_range?: string }
        Returns: {
          product_id: string
          product_name: string
          product_image: string
          view_count: number
          unique_visitors: number
          rank: number
        }[]
      }
      get_traffic_overview: {
        Args: { p_time_range?: string }
        Returns: {
          metric_name: string
          current_value: number
          previous_value: number
          change_percent: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_rdsvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfrabitq_vector_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      rds_float_normalize_i16: {
        Args: { "": unknown }
        Returns: unknown
      }
      rds_vector_norm: {
        Args: { "": string }
        Returns: number
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
