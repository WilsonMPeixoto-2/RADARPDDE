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
          error_report: Json
          id: string
          metrics: Json
          requested_by: string
          rollback_at: string | null
          source_hash: string
          source_payload: Json
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_report?: Json
          id: string
          metrics?: Json
          requested_by: string
          rollback_at?: string | null
          source_hash?: string
          source_payload?: Json
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_report?: Json
          id?: string
          metrics?: Json
          requested_by?: string
          rollback_at?: string | null
          source_hash?: string
          source_payload?: Json
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      data_import_staging: {
        Row: {
          batch_index: number
          created_at: string
          entity: string
          id: string
          import_id: string
          normalized_id: string
          payload: Json
          record_index: number
          source_hash: string
        }
        Insert: {
          batch_index: number
          created_at?: string
          entity: string
          id: string
          import_id: string
          normalized_id: string
          payload: Json
          record_index: number
          source_hash: string
        }
        Update: {
          batch_index?: number
          created_at?: string
          entity?: string
          id?: string
          import_id?: string
          normalized_id?: string
          payload?: Json
          record_index?: number
          source_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_import_staging_import_id_fkey",
            columns: ["import_id"],
            isOneToOne: false,
            referencedRelation: "data_import_runs",
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_team_members: {
        Row: {
          active: boolean
          cre: string
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
          cre?: string
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
          cre?: string
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
          operation_id: string
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
          operation_id: string
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
          operation_id?: string
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
          description: string
          drive_url: string
          errors: Json
          id: string
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
          description?: string
          drive_url?: string
          errors?: Json
          id: string
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
          description?: string
          drive_url?: string
          errors?: Json
          id?: string
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
          description: string
          id: string
          official_charge: boolean
          operation_id: string
          payload: Json
          pendency_id: string | null
          row_version: number
          school_id: string
          updated_at: string
        }
        Insert: {
          contact_date: string
          contact_type?: string
          created_at?: string
          description?: string
          id: string
          official_charge?: boolean
          operation_id: string
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
          description?: string
          id?: string
          official_charge?: boolean
          operation_id?: string
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
            foreignKeyName: "pendency_contacts_school_id_fkey",
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          can_edit_programs: boolean
          created_at: string
          description: string
          id: string
          label: string
          permissions: Json
          protected: boolean
          updated_at: string
        }
        Insert: {
          can_edit_programs_?: boolean
          created_at?: string
          description?: string
          id: string
          label: string
          permissions?: Json
          protected?: boolean
          updated_at?: string
        }
        Update: {
          can_edit_programs_?: boolean
          created_at?: string
          description?: string
          id?: string
          label?: string
          permissions?: Json
          protected?: boolean
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
          invoice_number: string | null
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
          invoice_number?: string | null
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
          invoice_number?: string | null
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
            foreignKeyName: "registered_invoices_competence_id_fkey",
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
          