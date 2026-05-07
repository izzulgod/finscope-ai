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
      ai_analyses: {
        Row: {
          created_at: string
          id: string
          model_used: string | null
          rating: number | null
          raw_ai_response: string | null
          recommendation: string | null
          recommended_actions: Json | null
          report_id: string
          risks: Json | null
          rule_flags: Json | null
          rule_score: number | null
          rule_verdict: string | null
          strengths: Json | null
          summary: string | null
          weaknesses: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_used?: string | null
          rating?: number | null
          raw_ai_response?: string | null
          recommendation?: string | null
          recommended_actions?: Json | null
          report_id: string
          risks?: Json | null
          rule_flags?: Json | null
          rule_score?: number | null
          rule_verdict?: string | null
          strengths?: Json | null
          summary?: string | null
          weaknesses?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          model_used?: string | null
          rating?: number | null
          raw_ai_response?: string | null
          recommendation?: string | null
          recommended_actions?: Json | null
          report_id?: string
          risks?: Json | null
          rule_flags?: Json | null
          rule_score?: number | null
          rule_verdict?: string | null
          strengths?: Json | null
          summary?: string | null
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          name: string
          sector: string | null
          ticker: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          name: string
          sector?: string | null
          ticker?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          name?: string
          sector?: string | null
          ticker?: string | null
        }
        Relationships: []
      }
      financial_ratios: {
        Row: {
          created_at: string
          current_ratio: number | null
          debt_ratio: number | null
          debt_to_equity: number | null
          gross_profit_margin: number | null
          id: string
          net_profit_margin: number | null
          quick_ratio: number | null
          report_id: string
          revenue_growth: number | null
          roa: number | null
          roe: number | null
        }
        Insert: {
          created_at?: string
          current_ratio?: number | null
          debt_ratio?: number | null
          debt_to_equity?: number | null
          gross_profit_margin?: number | null
          id?: string
          net_profit_margin?: number | null
          quick_ratio?: number | null
          report_id: string
          revenue_growth?: number | null
          roa?: number | null
          roe?: number | null
        }
        Update: {
          created_at?: string
          current_ratio?: number | null
          debt_ratio?: number | null
          debt_to_equity?: number | null
          gross_profit_margin?: number | null
          id?: string
          net_profit_margin?: number | null
          quick_ratio?: number | null
          report_id?: string
          revenue_growth?: number | null
          roa?: number | null
          roe?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ratios_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "financial_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          company_id: string
          cost_of_goods_sold: number | null
          created_at: string
          current_assets: number | null
          current_liabilities: number | null
          financing_cash_flow: number | null
          gross_profit: number | null
          id: string
          inventory: number | null
          investing_cash_flow: number | null
          net_income: number | null
          operating_cash_flow: number | null
          operating_expense: number | null
          quarter: number | null
          raw_json: Json | null
          revenue: number | null
          source: string
          total_assets: number | null
          total_equity: number | null
          total_liabilities: number | null
          user_id: string | null
          year: number
        }
        Insert: {
          company_id: string
          cost_of_goods_sold?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          financing_cash_flow?: number | null
          gross_profit?: number | null
          id?: string
          inventory?: number | null
          investing_cash_flow?: number | null
          net_income?: number | null
          operating_cash_flow?: number | null
          operating_expense?: number | null
          quarter?: number | null
          raw_json?: Json | null
          revenue?: number | null
          source?: string
          total_assets?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
          user_id?: string | null
          year: number
        }
        Update: {
          company_id?: string
          cost_of_goods_sold?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          financing_cash_flow?: number | null
          gross_profit?: number | null
          id?: string
          inventory?: number | null
          investing_cash_flow?: number | null
          net_income?: number | null
          operating_cash_flow?: number | null
          operating_expense?: number | null
          quarter?: number | null
          raw_json?: Json | null
          revenue?: number | null
          source?: string
          total_assets?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          added_at: string
          company_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          added_at?: string
          company_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          added_at?: string
          company_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
