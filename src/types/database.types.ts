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
      administrative_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details: Json
          event_at: string
          id: string
          profile_name: string
          school_id: string | null
          user_identifier: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_at?: string
          id: string
          profile_name?: string
          school_id?: string | null
          user_identifier?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          event_at?: string
          id?: string
          profile_name?: string
          school_id?: string | null
          user_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "administrative_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          bonus_deadline_extended: string | null
          closing_competence: string | null
          created_at: string
          exercises: Json
          id: string
          row_version: number
          settings: Json
          updated_at: string
        }
        Insert: {
          bonus_deadline_extended?: string | null
          closing_competence?: string | null
          created_at?: string
          exercises?: Json
          id: string
          row_version?: number
          settings?: Json
          updated_at?: string
        }
        Update: {
          bonus_deadline_extended?: string | null
          closing_competence?: string | null
          created_at?: string
          exercises?: Json
          id?: string
          row_version?: number
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_config_closing_competence_fk"
            columns: ["closing_competence"]
            isOneToOne: false
            referencedRelation: "competences"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          amount: number
          competence_id: string | null
          created_at: string
          description: string
          expense_type: string
          id: string
          inventoried_at: string | null
          inventoried_by_member_id: string | null
          inventory_process: string
          invoice_number: string
          notes: string
          payload: Json
          row_version: number
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          competence_id?: string | null
          created_at?: string
          description: string
          expense_type: string
          id: string
          inventoried_at?: string | null
          inventoried_by_member_id?: string | null
          inventory_process?: string
          invoice_number?: string
          notes?: string
          payload?: Json
          row_version?: number
          school_id: string
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          competence_id?: string | null
          created_at?: string
          description?: string
          expense_type?: string
          id?: string
          inventoried_at?: string | null
          inventoried_by_member_id?: string | null
          inventory_process?: string
          invoice_number?: string
          notes?: string
          payload?: Json
          row_version?: number
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_competence_id_fkey"
            columns: ["competence_id"]
            isOneToOne: false
            referencedRelation: "competences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_inventoried_by_member_id_fkey"
            columns: ["inventoried_by_member_id"]
            isOneToOne: false
            referencedRelation: "inventory_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          changed_fields: string[]
          id: number
          new_record: Json | null
          occurred_at: string
          old_record: Json | null
          record_id: string
          request_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          changed_fields?: string[]
          id?: never
          new_record?: Json | null
          occurred_at?: string
          old_record?: Json | null
          record_id: string
          request_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          changed_fields?: string[]
          id?: never
          new_record?: Json | null
          occurred_at?: string
          old_record?: Json | null
          record_id?: string
          request_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      competences: {
        Row: {
          bonus_deadline: string | null
          closed_at: string | null
          created_at: string
          ends_on: string | null
          exercise: number
          id: string
          label: string
          row_version: number
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          bonus_deadline?: string | null
          closed_at?: string | null
          created_at?: string
          ends_on?: string | null
          exercise: number
          id: string
          label: string
          row_version?: number
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          bonus_deadline?: string | null
          closed_at?: string | null
          created_at?: string
          ends_on?: string | null
          exercise?: number
          id?: string
          label?: string
          row_version?: number
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      controllers: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          row_version: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string
          id: string
          name: string
          row_version?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          row_version?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      data_import_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          entity_counts: Json
          error_message: string
          id: string
          import_id: string
          reconciliation_report: Json
          snapshot_format: string
          snapshot_version: string
          source_label: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          entity_counts?: Json
          error_message?: string
          id?: string
          import_id: string
          reconciliation_report?: Json
          snapshot_format: string
          snapshot_version: string
          source_label?: string
          started_at?: string
          status: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          entity_counts?: Json
          error_message?: string
          id?: string
          import_id?: string
          reconciliation_report?: Json
          snapshot_format?: string
          snapshot_version?: string
          source_label?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_team_members: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          row_version: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string
          id: string
          name: string
          row_version?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          row_version?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pendencies: {
        Row: {
          canceled_at: string | null
          competence_origin: string
          created_at: string
          document_key: string
          id: string
          next_actor: string
          notes: string
          opened_at: string
          payload: Json
          program_id: string | null
          reason: string
          resolved_at: string | null
          responsible_area: string
          row_version: number
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          competence_origin: string
          created_at?: string
          document_key: string
          id: string
          next_actor?: string
          notes?: string
          opened_at?: string
          payload?: Json
          program_id?: string | null
          reason?: string
          resolved_at?: string | null
          responsible_area?: string
          row_version?: number
          school_id: string
          status: string
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          competence_origin?: string
          created_at?: string
          document_key?: string
          id?: string
          next_actor?: string
          notes?: string
          opened_at?: string
          payload?: Json
          program_id?: string | null
          reason?: string
          resolved_at?: string | null
          responsible_area?: string
          row_version?: number
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendencies_competence_origin_fkey"
            columns: ["competence_origin"]
            isOneToOne: false
            referencedRelation: "competences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencies_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencies_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      pendency_attempts: {
        Row: {
          analyzed_at: string | null
          attempt_number: number
          created_at: string
          created_by: string | null
          drive_url: string
          errors: Json
          id: string
          observation: string
          payload: Json
          pendency_id: string
          result: string | null
          row_version: number
          submitted_at: string
          updated_at: string
        }
        Insert: {
          analyzed_at?: string | null
          attempt_number: number
          created_at?: string
          created_by?: string | null
          drive_url?: string
          errors?: Json
          id: string
          observation?: string
          payload?: Json
          pendency_id: string
          result?: string | null
          row_version?: number
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          analyzed_at?: string | null
          attempt_number?: number
          created_at?: string
          created_by?: string | null
          drive_url?: string
          errors?: Json
          id?: string
          observation?: string
          payload?: Json
          pendency_id?: string
          result?: string | null
          row_version?: number
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendency_attempts_pendency_id_fkey"
            columns: ["pendency_id"]
            isOneToOne: false
            referencedRelation: "pendencies"
            referencedColumns: ["id"]
          },
        ]
      }
      pendency_contacts: {
        Row: {
          contact_date: string
          contact_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          official_charge: boolean
          payload: Json
          pendency_id: string | null
          row_version: number
          school_id: string
          updated_at: string
        }
        Insert: {
          contact_date: string
          contact_type: string
          created_at?: string
          created_by?: string | null
          description: string
          id: string
          official_charge?: boolean
          payload?: Json
          pendency_id?: string | null
          row_version?: number
          school_id: string
          updated_at?: string
        }
        Update: {
          contact_date?: string
          contact_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          official_charge?: boolean
          payload?: Json
          pendency_id?: string | null
          row_version?: number
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendency_contacts_pendency_id_fkey"
            columns: ["pendency_id"]
            isOneToOne: false
            referencedRelation: "pendencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendency_contacts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          label: string
          priority: number
          row_version: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          label: string
          priority?: number
          row_version?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          label?: string
          priority?: number
          row_version?: number
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          row_version: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id: string
          name: string
          row_version?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          row_version?: number
          updated_at?: string
        }
        Relationships: []
      }
      registered_invoices: {
        Row: {
          amount: number
          competence_id: string | null
          created_at: string
          description: string
          expense_type: string
          id: string
          invoice_number: string
          linked_asset_id: string | null
          payload: Json
          program_id: string | null
          registered_at: string | null
          row_version: number
          school_id: string
          source_context_key: string
          updated_at: string
          verification_id: string | null
        }
        Insert: {
          amount: number
          competence_id?: string | null
          created_at?: string
          description: string
          expense_type: string
          id: string
          invoice_number: string
          linked_asset_id?: string | null
          payload?: Json
          program_id?: string | null
          registered_at?: string | null
          row_version?: number
          school_id: string
          source_context_key?: string
          updated_at?: string
          verification_id?: string | null
        }
        Update: {
          amount?: number
          competence_id?: string | null
          created_at?: string
          description?: string
          expense_type?: string
          id?: string
          invoice_number?: string
          linked_asset_id?: string | null
          payload?: Json
          program_id?: string | null
          registered_at?: string | null
          row_version?: number
          school_id?: string
          source_context_key?: string
          updated_at?: string
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registered_invoices_competence_id_fkey"
            columns: ["competence_id"]
            isOneToOne: false
            referencedRelation: "competences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registered_invoices_linked_asset_id_fkey"
            columns: ["linked_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registered_invoices_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registered_invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registered_invoices_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      school_programs: {
        Row: {
          active: boolean
          created_at: string
          ends_on: string | null
          id: string
          program_id: string
          row_version: number
          school_id: string
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_on?: string | null
          id: string
          program_id: string
          row_version?: number
          school_id: string
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_on?: string | null
          id?: string
          program_id?: string
          row_version?: number
          school_id?: string
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_programs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          active: boolean
          cnpj: string
          controller_id: string | null
          cre: string
          created_at: string
          denomination: string
          deputy_director_name: string
          deputy_director_phone: string
          designation: string
          director_name: string
          director_phone: string
          email: string
          id: string
          inep: string
          initial_competence: string | null
          institutional_mobile: string
          inventory_process: string
          phone: string
          ra: string
          row_version: number
          sici: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cnpj?: string
          controller_id?: string | null
          cre: string
          created_at?: string
          denomination: string
          deputy_director_name?: string
          deputy_director_phone?: string
          designation: string
          director_name?: string
          director_phone?: string
          email?: string
          id: string
          inep?: string
          initial_competence?: string | null
          institutional_mobile?: string
          inventory_process?: string
          phone?: string
          ra?: string
          row_version?: number
          sici?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cnpj?: string
          controller_id?: string | null
          cre?: string
          created_at?: string
          denomination?: string
          deputy_director_name?: string
          deputy_director_phone?: string
          designation?: string
          director_name?: string
          director_phone?: string
          email?: string
          id?: string
          inep?: string
          initial_competence?: string | null
          institutional_mobile?: string
          inventory_process?: string
          phone?: string
          ra?: string
          row_version?: number
          sici?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_controller_id_fkey"
            columns: ["controller_id"]
            isOneToOne: false
            referencedRelation: "controllers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_initial_competence_fkey"
            columns: ["initial_competence"]
            isOneToOne: false
            referencedRelation: "competences"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active: boolean
          controller_id: string | null
          cre_scope: string | null
          created_at: string
          id: string
          inventory_member_id: string | null
          profile_id: string
          row_version: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          controller_id?: string | null
          cre_scope?: string | null
          created_at?: string
          id?: string
          inventory_member_id?: string | null
          profile_id: string
          row_version?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          controller_id?: string | null
          cre_scope?: string | null
          created_at?: string
          id?: string
          inventory_member_id?: string | null
          profile_id?: string
          row_version?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_controller_id_fkey"
            columns: ["controller_id"]
            isOneToOne: false
            referencedRelation: "controllers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_inventory_member_id_fkey"
            columns: ["inventory_member_id"]
            isOneToOne: false
            referencedRelation: "inventory_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_school_scopes: {
        Row: {
          can_write: boolean
          created_at: string
          id: string
          school_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_write?: boolean
          created_at?: string
          id?: string
          school_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_write?: boolean
          created_at?: string
          id?: string
          school_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_school_scopes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          analysis: Json
          bonification: Json
          bonus_result: string | null
          competence_id: string
          created_at: string
          id: string
          payload: Json
          program_id: string
          row_version: number
          school_id: string
          updated_at: string
        }
        Insert: {
          analysis?: Json
          bonification?: Json
          bonus_result?: string | null
          competence_id: string
          created_at?: string
          id: string
          payload?: Json
          program_id: string
          row_version?: number
          school_id: string
          updated_at?: string
        }
        Update: {
          analysis?: Json
          bonification?: Json
          bonus_result?: string | null
          competence_id?: string
          created_at?: string
          id?: string
          payload?: Json
          program_id?: string
          row_version?: number
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_competence_id_fkey"
            columns: ["competence_id"]
            isOneToOne: false
            referencedRelation: "competences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_school: { Args: { p_school_id: string }; Returns: boolean }
      can_write_school: { Args: { p_school_id: string }; Returns: boolean }
      current_app_role: { Args: never; Returns: string }
      current_controller_id: { Args: never; Returns: string }
      delete_invoice_with_effects: {
        Args: {
          p_delete_linked_asset?: boolean
          p_expected_asset_version?: number
          p_expected_invoice_version: number
          p_expected_verification_version?: number
          p_invoice_id: string
          p_verification_patch?: Json
        }
        Returns: Json
      }
      save_invoice_with_effects: {
        Args: {
          p_asset?: Json
          p_expected_asset_version?: number
          p_expected_invoice_version?: number
          p_expected_verification_version?: number
          p_invoice: Json
          p_verification_patch?: Json
        }
        Returns: Json
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

