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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_schedules: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          day_of_week: string
          id: string
          updated_at: string
          user_id: string
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          day_of_week: string
          id?: string
          updated_at?: string
          user_id: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          day_of_week?: string
          id?: string
          updated_at?: string
          user_id?: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shift_swap_requests: {
        Row: {
          created_at: string | null
          id: string
          payment_scheduled_for: string | null
          reason: string
          requester_id: string
          requester_schedule_id: string | null
          requester_shift_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["swap_request_status"]
          swap_date: string | null
          target_approved: boolean | null
          target_approved_at: string | null
          target_id: string
          target_schedule_id: string | null
          target_shift_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_scheduled_for?: string | null
          reason: string
          requester_id: string
          requester_schedule_id?: string | null
          requester_shift_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["swap_request_status"]
          swap_date?: string | null
          target_approved?: boolean | null
          target_approved_at?: string | null
          target_id: string
          target_schedule_id?: string | null
          target_shift_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_scheduled_for?: string | null
          reason?: string
          requester_id?: string
          requester_schedule_id?: string | null
          requester_shift_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["swap_request_status"]
          swap_date?: string | null
          target_approved?: boolean | null
          target_approved_at?: string | null
          target_id?: string
          target_schedule_id?: string | null
          target_shift_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requester_schedule_id_fkey"
            columns: ["requester_schedule_id"]
            isOneToOne: false
            referencedRelation: "agent_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_requester_shift_id_fkey"
            columns: ["requester_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_schedule_id_fkey"
            columns: ["target_schedule_id"]
            isOneToOne: false
            referencedRelation: "agent_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_shift_id_fkey"
            columns: ["target_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_time: string | null
          id: string
          notes: string | null
          shift_date: string
          shift_type: string
          start_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          shift_date: string
          shift_type: string
          start_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          shift_date?: string
          shift_type?: string
          start_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      status_changes: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          new_status: string
          old_status: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_agent_schedules_for_swaps: {
        Args: never
        Returns: {
          break_end_time: string
          break_start_time: string
          day_of_week: string
          id: string
          user_id: string
          work_end_time: string
          work_start_time: string
        }[]
      }
      list_agents_for_swaps: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      list_future_shifts_for_swaps: {
        Args: never
        Returns: {
          end_time: string
          id: string
          shift_date: string
          shift_type: string
          start_time: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "supervisor"
      payment_status: "pending" | "defined" | "completed"
      shift_status: "scheduled" | "completed" | "swapped" | "cancelled"
      shift_type: "morning" | "afternoon" | "night"
      swap_action:
        | "created"
        | "approved"
        | "rejected"
        | "payment_defined"
        | "completed"
        | "cancelled"
      swap_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
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
    Enums: {
      app_role: ["admin", "agent", "supervisor"],
      payment_status: ["pending", "defined", "completed"],
      shift_status: ["scheduled", "completed", "swapped", "cancelled"],
      shift_type: ["morning", "afternoon", "night"],
      swap_action: [
        "created",
        "approved",
        "rejected",
        "payment_defined",
        "completed",
        "cancelled",
      ],
      swap_request_status: [
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
