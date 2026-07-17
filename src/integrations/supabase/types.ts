export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _t_committed: {
        Row: {
          id: number | null
        }
        Insert: {
          id?: number | null
        }
        Update: {
          id?: number | null
        }
        Relationships: []
      }
      abandoned_carts: {
        Row: {
          cart_items: Json | null
          created_at: string
          email: string | null
          id: string
          last_active_at: string
          name: string | null
          phone: string | null
          recovery_email_sent_at: string | null
          status: string | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          cart_items?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          last_active_at?: string
          name?: string | null
          phone?: string | null
          recovery_email_sent_at?: string | null
          status?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          cart_items?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          last_active_at?: string
          name?: string | null
          phone?: string | null
          recovery_email_sent_at?: string | null
          status?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          discount_percentage: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order_amount: number | null
          times_used: number
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number | null
          times_used?: number
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number | null
          times_used?: number
        }
        Relationships: []
      }
      mp_marketplace_credentials: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: boolean
          mp_user_id: string
          public_key: string | null
          refresh_token: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: boolean
          mp_user_id: string
          public_key?: string | null
          refresh_token: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: boolean
          mp_user_id?: string
          public_key?: string | null
          refresh_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      mp_oauth_state: {
        Row: {
          created_at: string
          state: string
        }
        Insert: {
          created_at?: string
          state: string
        }
        Update: {
          created_at?: string
          state?: string
        }
        Relationships: []
      }
      newsletter: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          created_at: string
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          payment_intent_id: string | null
          payment_method: string
          pix_qr_code: string | null
          pix_qr_code_text: string | null
          platform_fee_amount: number | null
          shipping_address: string | null
          status: string | null
          total_amount: number
          tracking_code: string | null
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          payment_intent_id?: string | null
          payment_method?: string
          pix_qr_code?: string | null
          pix_qr_code_text?: string | null
          platform_fee_amount?: number | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number
          tracking_code?: string | null
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          payment_intent_id?: string | null
          payment_method?: string
          pix_qr_code?: string | null
          pix_qr_code_text?: string | null
          platform_fee_amount?: number | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number
          tracking_code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          description: string | null
          detailed_description: string | null
          height: number
          id: string
          image: string | null
          images: string[] | null
          is_featured: boolean | null
          length: number
          name: string
          price: number
          stock: number | null
          updated_at: string
          weight: number
          width: number
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          detailed_description?: string | null
          height?: number
          id?: string
          image?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          length?: number
          name: string
          price: number
          stock?: number | null
          updated_at?: string
          weight?: number
          width?: number
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          detailed_description?: string | null
          height?: number
          id?: string
          image?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          length?: number
          name?: string
          price?: number
          stock?: number | null
          updated_at?: string
          weight?: number
          width?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          manual_tags: string[] | null
          phone: string | null
          total_spent: number | null
          vip_level: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          manual_tags?: string[] | null
          phone?: string | null
          total_spent?: number | null
          vip_level?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          manual_tags?: string[] | null
          phone?: string | null
          total_spent?: number | null
          vip_level?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          category: string | null
          cost_at_sale: number | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          responsible_user_id: string | null
          sale_date: string
          sale_type: string
          total_price: number
          unit_price: number
        }
        Insert: {
          category?: string | null
          cost_at_sale?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          responsible_user_id?: string | null
          sale_date?: string
          sale_type?: string
          total_price: number
          unit_price: number
        }
        Update: {
          category?: string | null
          cost_at_sale?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          responsible_user_id?: string | null
          sale_date?: string
          sale_type?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      shipping_config: {
        Row: {
          base_fee: number
          free_shipping_threshold: number
          id: string
          is_active: boolean
          melhor_envio_enabled: boolean
          melhor_envio_token: string | null
          origin_zip: string
          per_km_rate: number
          sedex_multiplier: number
          updated_at: string
        }
        Insert: {
          base_fee?: number
          free_shipping_threshold?: number
          id?: string
          is_active?: boolean
          melhor_envio_enabled?: boolean
          melhor_envio_token?: string | null
          origin_zip?: string
          per_km_rate?: number
          sedex_multiplier?: number
          updated_at?: string
        }
        Update: {
          base_fee?: number
          free_shipping_threshold?: number
          id?: string
          is_active?: boolean
          melhor_envio_enabled?: boolean
          melhor_envio_token?: string | null
          origin_zip?: string
          per_km_rate?: number
          sedex_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      shipping_quotes: {
        Row: {
          city: string | null
          created_at: string
          id: string
          product_value: number
          result_json: Json | null
          source: string
          state: string | null
          zip_code: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          product_value?: number
          result_json?: Json | null
          source?: string
          state?: string | null
          zip_code: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          product_value?: number
          result_json?: Json | null
          source?: string
          state?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      site_errors: {
        Row: {
          component_stack: string | null
          created_at: string
          error_message: string | null
          error_stack: string | null
          id: string
          url: string | null
          user_agent: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string
          error_message?: string | null
          error_stack?: string | null
          id?: string
          url?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          id: string
          page_visited: string | null
          visited_at: string
          visitor_ip: string | null
        }
        Insert: {
          id?: string
          page_visited?: string | null
          visited_at?: string
          visitor_ip?: string | null
        }
        Update: {
          id?: string
          page_visited?: string | null
          visited_at?: string
          visitor_ip?: string | null
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean | null
          neighborhood: string
          number: string
          state: string
          street: string
          user_id: string
          zip_code: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          neighborhood: string
          number: string
          state: string
          street: string
          user_id: string
          zip_code: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          user_id?: string
          zip_code?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_coupon: {
        Args: { p_code: string }
        Returns: {
          discount_percentage: number
          message: string
          valid: boolean
        }[]
      }
      create_order: {
        Args: {
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_payment_method: string
          p_shipping_address: string
          p_total_amount: number
        }
        Returns: string
      }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      get_guest_order_summary: { Args: { p_order_id: string }; Returns: Json }
      get_order_status: { Args: { p_order_id: string }; Returns: string }
      get_platform_commissions: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          card_fee_total: number
          card_orders_count: number
          pix_fee_total: number
          pix_orders_count: number
          total_fee: number
        }[]
      }
      get_product_ratings: {
        Args: never
        Returns: {
          avg_rating: number
          product_id: string
          review_count: number
        }[]
      }
      get_sales_summary:
        | {
            Args: {
              category_filter?: string
              end_date?: string
              product_filter?: string
              start_date?: string
            }
            Returns: {
              best_selling_product_id: string
              best_selling_product_name: string
              best_selling_quantity: number
              most_profitable_product_id: string
              most_profitable_product_name: string
              most_profitable_profit: number
              total_quantity_sold: number
              total_sales_value: number
              total_transactions: number
            }[]
          }
        | {
            Args: {
              category_filter?: string
              end_date?: string
              product_filter?: string
              sale_type_filter?: string
              start_date?: string
            }
            Returns: {
              best_selling_product_id: string
              best_selling_product_name: string
              best_selling_quantity: number
              most_profitable_product_id: string
              most_profitable_product_name: string
              most_profitable_profit: number
              total_quantity_sold: number
              total_sales_value: number
              total_transactions: number
            }[]
          }
      get_total_profit:
        | { Args: { end_date?: string; start_date?: string }; Returns: number }
        | {
            Args: {
              end_date?: string
              sale_type_filter?: string
              start_date?: string
            }
            Returns: number
          }
      is_admin: { Args: never; Returns: boolean }
      mp_marketplace_status: {
        Args: never
        Returns: {
          connected: boolean
          connected_at: string
          mp_user_id: string
        }[]
      }
      restore_stock: { Args: { p_order_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
