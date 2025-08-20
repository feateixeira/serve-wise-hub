export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      establishments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          email: string;
          phone: string | null;
          address: string | null;
          logo_url: string | null;
          settings: Json;
          subscription_plan: string;
          subscription_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          settings?: Json;
          subscription_plan?: string;
          subscription_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          settings?: Json;
          subscription_plan?: string;
          subscription_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          establishment_id: string | null;
          role: string;
          name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          establishment_id?: string | null;
          role?: string;
          name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          establishment_id?: string | null;
          role?: string;
          name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          establishment_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          sku: string | null;
          ingredients: Json;
          tags: Json;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          sku?: string | null;
          ingredients?: Json;
          tags?: Json;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          sku?: string | null;
          ingredients?: Json;
          tags?: Json;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          establishment_id: string;
          order_number: string;
          customer_name: string | null;
          customer_phone: string | null;
          order_type: string;
          table_number: string | null;
          status: string;
          payment_method: string | null;
          payment_status: string;
          subtotal: number;
          tax_amount: number;
          discount_amount: number;
          total_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          order_number: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          order_type?: string;
          table_number?: string | null;
          status?: string;
          payment_method?: string | null;
          payment_status?: string;
          subtotal: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          order_number?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          order_type?: string;
          table_number?: string | null;
          status?: string;
          payment_method?: string | null;
          payment_status?: string;
          subtotal?: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          customizations: Json;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          customizations?: Json;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          customizations?: Json;
          notes?: string | null;
          created_at?: string;
        };
      };
      fixed_costs: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          description: string | null;
          amount: number;
          start_date: string;
          recurrence: 'monthly' | 'annual' | 'one_time';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          description?: string | null;
          amount: number;
          start_date: string;
          recurrence: 'monthly' | 'annual' | 'one_time';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          description?: string | null;
          amount?: number;
          start_date?: string;
          recurrence?: 'monthly' | 'annual' | 'one_time';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      variable_costs: {
        Row: {
          id: string;
          establishment_id: string;
          name: string;
          description: string | null;
          quantity: number;
          total_cost: number;
          unit_cost: number;
          unit_measure: string;
          supplier: string | null;
          purchase_date: string;
          expiry_date: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          name: string;
          description?: string | null;
          quantity: number;
          total_cost: number;
          unit_cost?: number;
          unit_measure: string;
          supplier?: string | null;
          purchase_date: string;
          expiry_date?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          name?: string;
          description?: string | null;
          quantity?: number;
          total_cost?: number;
          unit_cost?: number;
          unit_measure?: string;
          supplier?: string | null;
          purchase_date?: string;
          expiry_date?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_ingredients: {
        Row: {
          id: string;
          product_id: string;
          variable_cost_id: string;
          quantity_used: number;
          unit_cost_at_time: number;
          total_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variable_cost_id: string;
          quantity_used: number;
          unit_cost_at_time: number;
          total_cost?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variable_cost_id?: string;
          quantity_used?: number;
          unit_cost_at_time?: number;
          total_cost?: number;
          created_at?: string;
        };
      };
      cost_analysis: {
        Row: {
          id: string;
          establishment_id: string;
          period_start: string;
          period_end: string;
          total_fixed_costs: number;
          total_variable_costs: number;
          total_products_sold: number;
          average_cost_per_product: number;
          profit_margin_percentage: number;
          suggested_price_multiplier: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          establishment_id: string;
          period_start: string;
          period_end: string;
          total_fixed_costs: number;
          total_variable_costs: number;
          total_products_sold: number;
          average_cost_per_product: number;
          profit_margin_percentage: number;
          suggested_price_multiplier?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          establishment_id?: string;
          period_start?: string;
          period_end?: string;
          total_fixed_costs?: number;
          total_variable_costs?: number;
          total_products_sold?: number;
          average_cost_per_product?: number;
          profit_margin_percentage?: number;
          suggested_price_multiplier?: number;
          created_at?: string;
        };
      };
      customer_groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          discount_percentage: number;
          discount_amount: number;
          establishment_id: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          discount_percentage: number;
          discount_amount: number;
          establishment_id: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          discount_percentage?: number;
          discount_amount?: number;
          establishment_id?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
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
