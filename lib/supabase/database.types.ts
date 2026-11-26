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
    PostgrestVersion: "14.17"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      ai_chat_conversations: {
        Row: {
          apartment_code: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          summary: string | null
          user_id: string | null
        }
        Insert: {
          apartment_code?: string | null
          ended_at?: string | null
          id: string
          started_at?: string | null
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          apartment_code?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_conversations_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "ai_chat_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          conversation_id: string
          id: string
          is_fallback: boolean | null
          sender: string
          sent_at: string | null
          text: string
        }
        Insert: {
          conversation_id: string
          id: string
          is_fallback?: boolean | null
          sender: string
          sent_at?: string | null
          text: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_fallback?: boolean | null
          sender?: string
          sent_at?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      apartment_members: {
        Row: {
          apartment_code: string
          avatar_url: string | null
          created_at: string | null
          dob: string | null
          email: string | null
          face_status: string | null
          full_name: string
          gender: string | null
          id: string
          id_card: string | null
          id_date: string | null
          id_place: string | null
          license_plate: string | null
          phone: string
          pob: string | null
          relationship: string
          role: string | null
          user_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          apartment_code: string
          avatar_url?: string | null
          created_at?: string | null
          dob?: string | null
          email?: string | null
          face_status?: string | null
          full_name: string
          gender?: string | null
          id: string
          id_card?: string | null
          id_date?: string | null
          id_place?: string | null
          license_plate?: string | null
          phone: string
          pob?: string | null
          relationship: string
          role?: string | null
          user_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          apartment_code?: string
          avatar_url?: string | null
          created_at?: string | null
          dob?: string | null
          email?: string | null
          face_status?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          id_card?: string | null
          id_date?: string | null
          id_place?: string | null
          license_plate?: string | null
          phone?: string
          pob?: string | null
          relationship?: string
          role?: string | null
          user_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apartment_members_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "apartment_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      apartments: {
        Row: {
          apt_code: string
          apt_type: string
          balcony_direction: string | null
          bathrooms: number
          bedrooms: number
          block_id: number | null
          clear_area: number
          created_at: string | null
          description: string | null
          floor_number: number
          handover_date: string | null
          handover_protocol: string | null
          id: string
          legal_status: string | null
          main_door_direction: string | null
          owner_id: string | null
          price_billion: number
          price_vnd: number
          status: string
          tower_code: string
          type_label: string
          vehicles: Json | null
          wall_area: number
          wing: string | null
        }
        Insert: {
          apt_code: string
          apt_type: string
          balcony_direction?: string | null
          bathrooms?: number
          bedrooms?: number
          block_id?: number | null
          clear_area: number
          created_at?: string | null
          description?: string | null
          floor_number: number
          handover_date?: string | null
          handover_protocol?: string | null
          id: string
          legal_status?: string | null
          main_door_direction?: string | null
          owner_id?: string | null
          price_billion: number
          price_vnd: number
          status?: string
          tower_code?: string
          type_label: string
          vehicles?: Json | null
          wall_area: number
          wing?: string | null
        }
        Update: {
          apt_code?: string
          apt_type?: string
          balcony_direction?: string | null
          bathrooms?: number
          bedrooms?: number
          block_id?: number | null
          clear_area?: number
          created_at?: string | null
          description?: string | null
          floor_number?: number
          handover_date?: string | null
          handover_protocol?: string | null
          id?: string
          legal_status?: string | null
          main_door_direction?: string | null
          owner_id?: string | null
          price_billion?: number
          price_vnd?: number
          status?: string
          tower_code?: string
          type_label?: string
          vehicles?: Json | null
          wall_area?: number
          wing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apartments_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartments_floor_number_fkey"
            columns: ["floor_number"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["floor_number"]
          },
          {
            foreignKeyName: "fk_apartment_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_details: {
        Row: {
          ai_anomaly: boolean | null
          anomaly_reason: string | null
          bill_id: string
          id: string
          service_name: string
          service_type: string
          total_line_amount: number
          unit: string | null
          unit_price: number | null
          usage: number | null
        }
        Insert: {
          ai_anomaly?: boolean | null
          anomaly_reason?: string | null
          bill_id: string
          id: string
          service_name: string
          service_type: string
          total_line_amount: number
          unit?: string | null
          unit_price?: number | null
          usage?: number | null
        }
        Update: {
          ai_anomaly?: boolean | null
          anomaly_reason?: string | null
          bill_id?: string
          id?: string
          service_name?: string
          service_type?: string
          total_line_amount?: number
          unit?: string | null
          unit_price?: number | null
          usage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_details_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          apartment_code: string
          billing_month: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          due_date: string
          has_ai_anomaly: boolean | null
          id: string
          invoice_pdf_url: string | null
          last_payment_error: string | null
          owner_name: string
          paid_at: string | null
          payment_method: string | null
          payment_qr_url: string | null
          payment_status: string | null
          status: string | null
          total_amount: number
          transaction_ref: string | null
        }
        Insert: {
          apartment_code: string
          billing_month: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          due_date: string
          has_ai_anomaly?: boolean | null
          id: string
          invoice_pdf_url?: string | null
          last_payment_error?: string | null
          owner_name: string
          paid_at?: string | null
          payment_method?: string | null
          payment_qr_url?: string | null
          payment_status?: string | null
          status?: string | null
          total_amount?: number
          transaction_ref?: string | null
        }
        Update: {
          apartment_code?: string
          billing_month?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          due_date?: string
          has_ai_anomaly?: boolean | null
          id?: string
          invoice_pdf_url?: string | null
          last_payment_error?: string | null
          owner_name?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_qr_url?: string | null
          payment_status?: string | null
          status?: string | null
          total_amount?: number
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      blocks: {
        Row: {
          block_code: string
          block_name: string
          condo_id: number
          created_at: string | null
          id: number
          manager_name: string | null
          manager_phone: string | null
          total_floors: number
        }
        Insert: {
          block_code: string
          block_name: string
          condo_id: number
          created_at?: string | null
          id: number
          manager_name?: string | null
          manager_phone?: string | null
          total_floors?: number
        }
        Update: {
          block_code?: string
          block_name?: string
          condo_id?: number
          created_at?: string | null
          id?: number
          manager_name?: string | null
          manager_phone?: string | null
          total_floors?: number
        }
        Relationships: [
          {
            foreignKeyName: "blocks_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      building_devices: {
        Row: {
          category: string
          created_at: string
          health_score: number
          id: string
          last_maintenance: string | null
          location: string
          name: string
          predict_date: string | null
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          health_score?: number
          id: string
          last_maintenance?: string | null
          location: string
          name: string
          predict_date?: string | null
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          health_score?: number
          id?: string
          last_maintenance?: string | null
          location?: string
          name?: string
          predict_date?: string | null
          status?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          ai_moderation: string | null
          ai_sentiment: number | null
          apt_code: string | null
          author_id: string | null
          author_name: string
          author_role: string | null
          avatar_url: string | null
          category: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes: number | null
          tags: string[] | null
          title: string
        }
        Insert: {
          ai_moderation?: string | null
          ai_sentiment?: number | null
          apt_code?: string | null
          author_id?: string | null
          author_name: string
          author_role?: string | null
          avatar_url?: string | null
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id: string
          is_pinned?: boolean | null
          likes?: number | null
          tags?: string[] | null
          title: string
        }
        Update: {
          ai_moderation?: string | null
          ai_sentiment?: number | null
          apt_code?: string | null
          author_id?: string | null
          author_name?: string
          author_role?: string | null
          avatar_url?: string | null
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes?: number | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_apt_code_fkey"
            columns: ["apt_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      condominiums: {
        Row: {
          address: string
          basement_floors: number
          condo_code: string
          condo_name: string
          created_at: string | null
          description: string | null
          handover_year: number | null
          hotline: string | null
          id: number
          investor: string
          management_company: string
          total_apartments: number
          total_floors: number
        }
        Insert: {
          address: string
          basement_floors?: number
          condo_code?: string
          condo_name: string
          created_at?: string | null
          description?: string | null
          handover_year?: number | null
          hotline?: string | null
          id?: number
          investor: string
          management_company: string
          total_apartments?: number
          total_floors?: number
        }
        Update: {
          address?: string
          basement_floors?: number
          condo_code?: string
          condo_name?: string
          created_at?: string | null
          description?: string | null
          handover_year?: number | null
          hotline?: string | null
          id?: number
          investor?: string
          management_company?: string
          total_apartments?: number
          total_floors?: number
        }
        Relationships: []
      }
      ekyc_submissions: {
        Row: {
          algorithm: string | null
          apartment_code: string
          avatar_url: string
          dob: string | null
          email: string | null
          face_samples: Json | null
          face_score: number
          full_name: string
          id: string
          id_card_back_url: string | null
          id_card_front_url: string | null
          id_card_no: string
          id_date: string | null
          id_place: string | null
          is_simulation: boolean | null
          phone: string
          pob: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_label: string
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          algorithm?: string | null
          apartment_code: string
          avatar_url: string
          dob?: string | null
          email?: string | null
          face_samples?: Json | null
          face_score?: number
          full_name: string
          id: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          id_card_no: string
          id_date?: string | null
          id_place?: string | null
          is_simulation?: boolean | null
          phone: string
          pob?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_label: string
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          algorithm?: string | null
          apartment_code?: string
          avatar_url?: string
          dob?: string | null
          email?: string | null
          face_samples?: Json | null
          face_score?: number
          full_name?: string
          id?: string
          id_card_back_url?: string | null
          id_card_front_url?: string | null
          id_card_no?: string
          id_date?: string | null
          id_place?: string | null
          is_simulation?: boolean | null
          phone?: string
          pob?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_label?: string
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ekyc_submissions_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "ekyc_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      face_enrollments: {
        Row: {
          apartment_code: string | null
          auth_user_id: string | null
          avatar_url: string | null
          descriptor: Json
          email: string | null
          enrolled_at: string | null
          face_score: number | null
          full_name: string
          metadata: Json | null
          phone: string | null
          samples: Json | null
          status: string
          user_id: string
        }
        Insert: {
          apartment_code?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          descriptor?: Json
          email?: string | null
          enrolled_at?: string | null
          face_score?: number | null
          full_name: string
          metadata?: Json | null
          phone?: string | null
          samples?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          apartment_code?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          descriptor?: Json
          email?: string | null
          enrolled_at?: string | null
          face_score?: number | null
          full_name?: string
          metadata?: Json | null
          phone?: string | null
          samples?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "face_enrollments_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "face_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          category: string
          created_at: string | null
          current_occupancy: number | null
          floor_number: number
          hero_image_url: string | null
          id: string
          location_detail: string
          max_capacity: number | null
          max_quota_per_month: number | null
          name: string
          operating_hours: string
          pricing: string
          rating_score: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          current_occupancy?: number | null
          floor_number: number
          hero_image_url?: string | null
          id: string
          location_detail: string
          max_capacity?: number | null
          max_quota_per_month?: number | null
          name: string
          operating_hours: string
          pricing: string
          rating_score?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          current_occupancy?: number | null
          floor_number?: number
          hero_image_url?: string | null
          id?: string
          location_detail?: string
          max_capacity?: number | null
          max_quota_per_month?: number | null
          name?: string
          operating_hours?: string
          pricing?: string
          rating_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_floor_number_fkey"
            columns: ["floor_number"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["floor_number"]
          },
        ]
      }
      facility_access_logs: {
        Row: {
          apartment_code: string | null
          card_uid: string | null
          facility_id: string
          id: string
          method: string
          notes: string | null
          scanned_at: string | null
          status: string
          user_name: string
          user_role: string | null
        }
        Insert: {
          apartment_code?: string | null
          card_uid?: string | null
          facility_id: string
          id: string
          method: string
          notes?: string | null
          scanned_at?: string | null
          status: string
          user_name: string
          user_role?: string | null
        }
        Update: {
          apartment_code?: string | null
          card_uid?: string | null
          facility_id?: string
          id?: string
          method?: string
          notes?: string | null
          scanned_at?: string | null
          status?: string
          user_name?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_access_logs_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "facility_access_logs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_bookings: {
        Row: {
          apartment_code: string
          booker_id: string | null
          booker_name: string
          booking_date: string
          created_at: string | null
          deposit_amount: number | null
          duration_hours: number | null
          facility_id: string
          guest_count: number | null
          id: string
          notes: string | null
          payment_method: string | null
          pricing: string | null
          status: string | null
          ticket_code: string
          time_slot: string
        }
        Insert: {
          apartment_code: string
          booker_id?: string | null
          booker_name: string
          booking_date: string
          created_at?: string | null
          deposit_amount?: number | null
          duration_hours?: number | null
          facility_id: string
          guest_count?: number | null
          id: string
          notes?: string | null
          payment_method?: string | null
          pricing?: string | null
          status?: string | null
          ticket_code: string
          time_slot: string
        }
        Update: {
          apartment_code?: string
          booker_id?: string | null
          booker_name?: string
          booking_date?: string
          created_at?: string | null
          deposit_amount?: number | null
          duration_hours?: number | null
          facility_id?: string
          guest_count?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          pricing?: string | null
          status?: string | null
          ticket_code?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_bookings_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "facility_bookings_booker_id_fkey"
            columns: ["booker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bookings_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          condo_id: number
          created_at: string | null
          floor_code: string
          floor_function: string
          floor_name: string
          floor_number: number
          floor_type: string
          units_count: number | null
        }
        Insert: {
          condo_id: number
          created_at?: string | null
          floor_code: string
          floor_function: string
          floor_name: string
          floor_number: number
          floor_type: string
          units_count?: number | null
        }
        Update: {
          condo_id?: number
          created_at?: string | null
          floor_code?: string
          floor_function?: string
          floor_name?: string
          floor_number?: number
          floor_type?: string
          units_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "floors_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_count: number
          ip: string
          reset_at: string
        }
        Insert: {
          attempt_count?: number
          ip: string
          reset_at: string
        }
        Update: {
          attempt_count?: number
          ip?: string
          reset_at?: string
        }
        Relationships: []
      }
      meter_readings: {
        Row: {
          apartment_code: string
          confidence: number
          consumption: number | null
          id: string
          image_url: string | null
          meter_type: string
          period: string
          previous_reading: number | null
          reading: number
          recorded_at: string | null
          source: string
          status: string
          verified_by: string | null
        }
        Insert: {
          apartment_code: string
          confidence?: number
          consumption?: number | null
          id: string
          image_url?: string | null
          meter_type: string
          period: string
          previous_reading?: number | null
          reading: number
          recorded_at?: string | null
          source?: string
          status?: string
          verified_by?: string | null
        }
        Update: {
          apartment_code?: string
          confidence?: number
          consumption?: number | null
          id?: string
          image_url?: string | null
          meter_type?: string
          period?: string
          previous_reading?: number | null
          reading?: number
          recorded_at?: string | null
          source?: string
          status?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      parking_slots: {
        Row: {
          apartment_code: string | null
          assigned_license_plate: string | null
          assigned_user_id: string | null
          created_at: string | null
          floor_number: number
          id: string
          monthly_fee: number
          rfid_card_code: string | null
          slot_code: string
          status: string | null
          vehicle_type: string
        }
        Insert: {
          apartment_code?: string | null
          assigned_license_plate?: string | null
          assigned_user_id?: string | null
          created_at?: string | null
          floor_number: number
          id: string
          monthly_fee: number
          rfid_card_code?: string | null
          slot_code: string
          status?: string | null
          vehicle_type: string
        }
        Update: {
          apartment_code?: string | null
          assigned_license_plate?: string | null
          assigned_user_id?: string | null
          created_at?: string | null
          floor_number?: number
          id?: string
          monthly_fee?: number
          rfid_card_code?: string | null
          slot_code?: string
          status?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_slots_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "parking_slots_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_slots_floor_number_fkey"
            columns: ["floor_number"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["floor_number"]
          },
        ]
      }
      profiles: {
        Row: {
          apartment_code: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          legacy_user_id: string | null
          phone: string | null
          relationship: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          apartment_code?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id: string
          legacy_user_id?: string | null
          phone?: string | null
          relationship?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          apartment_code?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          legacy_user_id?: string | null
          phone?: string | null
          relationship?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      resident_service_bookings: {
        Row: {
          apt_code: string
          assigned_staff: string | null
          booking_code: string
          category: string
          created_at: string | null
          id: string
          notes: string | null
          resident_name: string
          resident_phone: string
          scheduled_time: string
          service_id: string
          service_name: string
          staff_phone: string | null
          status: string
          total_price: number
        }
        Insert: {
          apt_code: string
          assigned_staff?: string | null
          booking_code: string
          category: string
          created_at?: string | null
          id: string
          notes?: string | null
          resident_name: string
          resident_phone: string
          scheduled_time: string
          service_id: string
          service_name: string
          staff_phone?: string | null
          status?: string
          total_price?: number
        }
        Update: {
          apt_code?: string
          assigned_staff?: string | null
          booking_code?: string
          category?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          resident_name?: string
          resident_phone?: string
          scheduled_time?: string
          service_id?: string
          service_name?: string
          staff_phone?: string | null
          status?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "resident_service_bookings_apt_code_fkey"
            columns: ["apt_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      security_alerts: {
        Row: {
          alert_type: string
          camera_id: string | null
          confidence: number | null
          created_at: string
          id: string
          location: string
          snapshot_url: string | null
          status: string
          title: string
        }
        Insert: {
          alert_type: string
          camera_id?: string | null
          confidence?: number | null
          created_at?: string
          id: string
          location: string
          snapshot_url?: string | null
          status?: string
          title: string
        }
        Update: {
          alert_type?: string
          camera_id?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          location?: string
          snapshot_url?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      service_tickets: {
        Row: {
          admin_replied_at: string | null
          admin_replied_by: string | null
          admin_reply: string | null
          after_image: string | null
          ai_category: string
          ai_dispatch_reason: string | null
          ai_priority: number | null
          ai_replied_at: string | null
          ai_reply: string | null
          apartment_code: string
          assigned_technician_id: string | null
          assigned_technician_name: string | null
          assigned_technician_phone: string | null
          auto_dispatched: boolean | null
          before_image: string | null
          content: string
          created_at: string | null
          handled_by: string
          id: string
          priority_color: string | null
          rated_at: string | null
          rating: number | null
          resident_feedback: string | null
          resident_name: string
          resident_phone: string
          resolved_at: string | null
          scheduled_time: string | null
          sla_deadline: string | null
          status: string | null
          ticket_type: string
          ticket_type_label: string | null
          updated_at: string | null
        }
        Insert: {
          admin_replied_at?: string | null
          admin_replied_by?: string | null
          admin_reply?: string | null
          after_image?: string | null
          ai_category: string
          ai_dispatch_reason?: string | null
          ai_priority?: number | null
          ai_replied_at?: string | null
          ai_reply?: string | null
          apartment_code: string
          assigned_technician_id?: string | null
          assigned_technician_name?: string | null
          assigned_technician_phone?: string | null
          auto_dispatched?: boolean | null
          before_image?: string | null
          content: string
          created_at?: string | null
          handled_by?: string
          id: string
          priority_color?: string | null
          rated_at?: string | null
          rating?: number | null
          resident_feedback?: string | null
          resident_name: string
          resident_phone: string
          resolved_at?: string | null
          scheduled_time?: string | null
          sla_deadline?: string | null
          status?: string | null
          ticket_type?: string
          ticket_type_label?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_replied_at?: string | null
          admin_replied_by?: string | null
          admin_reply?: string | null
          after_image?: string | null
          ai_category?: string
          ai_dispatch_reason?: string | null
          ai_priority?: number | null
          ai_replied_at?: string | null
          ai_reply?: string | null
          apartment_code?: string
          assigned_technician_id?: string | null
          assigned_technician_name?: string | null
          assigned_technician_phone?: string | null
          auto_dispatched?: boolean | null
          before_image?: string | null
          content?: string
          created_at?: string | null
          handled_by?: string
          id?: string
          priority_color?: string | null
          rated_at?: string | null
          rating?: number | null
          resident_feedback?: string | null
          resident_name?: string
          resident_phone?: string
          resolved_at?: string | null
          scheduled_time?: string | null
          sla_deadline?: string | null
          status?: string | null
          ticket_type?: string
          ticket_type_label?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_tickets_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "service_tickets_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_tickets_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "v_technician_payroll_report"
            referencedColumns: ["technician_id"]
          },
        ]
      }
      smart_automation_rules: {
        Row: {
          action_summary: string
          apartment_code: string
          created_at: string | null
          description: string | null
          enabled: boolean | null
          icon: string | null
          id: string
          repeat_days: string | null
          title: string
          trigger_label: string
          trigger_time: string
          trigger_type: string
        }
        Insert: {
          action_summary: string
          apartment_code: string
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          icon?: string | null
          id: string
          repeat_days?: string | null
          title: string
          trigger_label: string
          trigger_time: string
          trigger_type: string
        }
        Update: {
          action_summary?: string
          apartment_code?: string
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          icon?: string | null
          id?: string
          repeat_days?: string | null
          title?: string
          trigger_label?: string
          trigger_time?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_automation_rules_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      smart_devices: {
        Row: {
          apartment_code: string
          device_type: string
          id: string
          last_active: string | null
          location_x: number | null
          location_y: number | null
          name: string
          set_value: number | null
          status: string
        }
        Insert: {
          apartment_code: string
          device_type: string
          id: string
          last_active?: string | null
          location_x?: number | null
          location_y?: number | null
          name: string
          set_value?: number | null
          status?: string
        }
        Update: {
          apartment_code?: string
          device_type?: string
          id?: string
          last_active?: string | null
          location_x?: number | null
          location_y?: number | null
          name?: string
          set_value?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_devices_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      smart_door_access_logs: {
        Row: {
          apartment_code: string
          detail: string | null
          id: string
          method: string
          role: string | null
          status: string
          timestamp: string | null
          user_name: string
        }
        Insert: {
          apartment_code: string
          detail?: string | null
          id: string
          method: string
          role?: string | null
          status: string
          timestamp?: string | null
          user_name: string
        }
        Update: {
          apartment_code?: string
          detail?: string | null
          id?: string
          method?: string
          role?: string | null
          status?: string
          timestamp?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_door_access_logs_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      smart_guest_pins: {
        Row: {
          apartment_code: string
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          label: string
          max_uses: number | null
          pin_code: string
          status: string | null
          used_count: number | null
        }
        Insert: {
          apartment_code: string
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id: string
          label: string
          max_uses?: number | null
          pin_code: string
          status?: string | null
          used_count?: number | null
        }
        Update: {
          apartment_code?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          label?: string
          max_uses?: number | null
          pin_code?: string
          status?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_guest_pins_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      survey_votes: {
        Row: {
          apartment_code: string
          id: string
          option_chosen: string
          survey_id: string
          voted_at: string | null
          voter_id: string
        }
        Insert: {
          apartment_code: string
          id: string
          option_chosen: string
          survey_id: string
          voted_at?: string | null
          voter_id: string
        }
        Update: {
          apartment_code?: string
          id?: string
          option_chosen?: string
          survey_id?: string
          voted_at?: string | null
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_votes_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string | null
          description: string
          end_date: string | null
          id: string
          legal_type: string | null
          quorum_percent: number | null
          start_date: string | null
          status: string | null
          title: string
          total_votes: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          end_date?: string | null
          id: string
          legal_type?: string | null
          quorum_percent?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          total_votes?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          end_date?: string | null
          id?: string
          legal_type?: string | null
          quorum_percent?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          total_votes?: number | null
        }
        Relationships: []
      }
      technicians: {
        Row: {
          base_salary: number
          bonus_per_fivestar: number
          created_at: string | null
          email: string | null
          id: string
          name: string
          pay_per_ticket: number
          phone: string
          specialty: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          base_salary?: number
          bonus_per_fivestar?: number
          created_at?: string | null
          email?: string | null
          id: string
          name: string
          pay_per_ticket?: number
          phone: string
          specialty: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          base_salary?: number
          bonus_per_fivestar?: number
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          pay_per_ticket?: number
          phone?: string
          specialty?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technicians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          actor_role: string | null
          created_at: string | null
          event_type: string
          id: string
          new_status: string | null
          note: string | null
          old_status: string | null
          ticket_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          event_type: string
          id: string
          new_status?: string | null
          note?: string | null
          old_status?: string | null
          ticket_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          new_status?: string | null
          note?: string | null
          old_status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          apartment_code: string | null
          avatar_url: string | null
          created_at: string | null
          dob: string | null
          ekyc_approved: boolean | null
          email: string | null
          emergency_phone: string | null
          face_vector: string | null
          full_name: string
          gender: number | null
          id: string
          id_card_no: string | null
          id_date: string | null
          id_place: string | null
          license_plate: string | null
          password_hash: string | null
          phone: string
          pob: string | null
          relationship: string | null
          role: string
          ui_language: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          apartment_code?: string | null
          avatar_url?: string | null
          created_at?: string | null
          dob?: string | null
          ekyc_approved?: boolean | null
          email?: string | null
          emergency_phone?: string | null
          face_vector?: string | null
          full_name: string
          gender?: number | null
          id: string
          id_card_no?: string | null
          id_date?: string | null
          id_place?: string | null
          license_plate?: string | null
          password_hash?: string | null
          phone: string
          pob?: string | null
          relationship?: string | null
          role: string
          ui_language?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          apartment_code?: string | null
          avatar_url?: string | null
          created_at?: string | null
          dob?: string | null
          ekyc_approved?: boolean | null
          email?: string | null
          emergency_phone?: string | null
          face_vector?: string | null
          full_name?: string
          gender?: number | null
          id?: string
          id_card_no?: string | null
          id_date?: string | null
          id_place?: string | null
          license_plate?: string | null
          password_hash?: string | null
          phone?: string
          pob?: string | null
          relationship?: string | null
          role?: string
          ui_language?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
        ]
      }
      visitor_gate_logs: {
        Row: {
          action: string
          apartment_code: string
          checkpoint: string | null
          host_name: string | null
          id: string
          license_plate: string | null
          notes: string | null
          pass_id: string | null
          result: string
          scanned_at: string | null
          visitor_name: string | null
        }
        Insert: {
          action: string
          apartment_code: string
          checkpoint?: string | null
          host_name?: string | null
          id: string
          license_plate?: string | null
          notes?: string | null
          pass_id?: string | null
          result: string
          scanned_at?: string | null
          visitor_name?: string | null
        }
        Update: {
          action?: string
          apartment_code?: string
          checkpoint?: string | null
          host_name?: string | null
          id?: string
          license_plate?: string | null
          notes?: string | null
          pass_id?: string | null
          result?: string
          scanned_at?: string | null
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_gate_logs_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "visitor_gate_logs_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "visitor_passes"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_passes: {
        Row: {
          apartment_code: string
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string | null
          entry_type: string | null
          host_name: string
          host_phone: string
          host_user_id: string | null
          id: string
          license_plate: string | null
          note: string | null
          pin_code: string
          purpose: string | null
          purpose_label: string | null
          qr_data: string
          status: string | null
          tower_name: string | null
          valid_hours: number | null
          valid_until: string
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          apartment_code: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string | null
          entry_type?: string | null
          host_name: string
          host_phone: string
          host_user_id?: string | null
          id: string
          license_plate?: string | null
          note?: string | null
          pin_code: string
          purpose?: string | null
          purpose_label?: string | null
          qr_data: string
          status?: string | null
          tower_name?: string | null
          valid_hours?: number | null
          valid_until: string
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          apartment_code?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string | null
          entry_type?: string | null
          host_name?: string
          host_phone?: string
          host_user_id?: string | null
          id?: string
          license_plate?: string | null
          note?: string | null
          pin_code?: string
          purpose?: string | null
          purpose_label?: string | null
          qr_data?: string
          status?: string | null
          tower_name?: string | null
          valid_hours?: number | null
          valid_until?: string
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_passes_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "visitor_passes_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_options: {
        Row: {
          id: string
          option_text: string
          topic_id: string
          votes_count: number | null
        }
        Insert: {
          id: string
          option_text: string
          topic_id: string
          votes_count?: number | null
        }
        Update: {
          id?: string
          option_text?: string
          topic_id?: string
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voting_options_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "voting_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_records: {
        Row: {
          apartment_code: string
          id: string
          option_id: string
          topic_id: string
          user_id: string | null
          voted_at: string | null
          voter_name: string | null
        }
        Insert: {
          apartment_code: string
          id: string
          option_id: string
          topic_id: string
          user_id?: string | null
          voted_at?: string | null
          voter_name?: string | null
        }
        Update: {
          apartment_code?: string
          id?: string
          option_id?: string
          topic_id?: string
          user_id?: string | null
          voted_at?: string | null
          voter_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voting_records_apartment_code_fkey"
            columns: ["apartment_code"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["apt_code"]
          },
          {
            foreignKeyName: "voting_records_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "voting_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voting_records_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "voting_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voting_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_topics: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          deadline: string
          description: string
          id: string
          is_owner_only: boolean | null
          legal_type: string
          status: string | null
          summary_report: string | null
          title: string
          total_eligible_apartments: number | null
          total_votes: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string
          deadline: string
          description: string
          id: string
          is_owner_only?: boolean | null
          legal_type: string
          status?: string | null
          summary_report?: string | null
          title: string
          total_eligible_apartments?: number | null
          total_votes?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          deadline?: string
          description?: string
          id?: string
          is_owner_only?: boolean | null
          legal_type?: string
          status?: string | null
          summary_report?: string | null
          title?: string
          total_eligible_apartments?: number | null
          total_votes?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      v_apartment_billing_overview: {
        Row: {
          ai_anomaly_count: number | null
          billing_month: string | null
          collected_revenue: number | null
          outstanding_revenue: number | null
          total_bills: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_technician_payroll_report: {
        Row: {
          avg_rating: number | null
          base_salary: number | null
          completed_tickets_count: number | null
          five_star_bonus_total: number | null
          five_star_count: number | null
          phone: string | null
          specialty: string | null
          technician_id: string | null
          technician_name: string | null
          ticket_bonus_total: number | null
          total_income: number | null
        }
        Relationships: []
      }
      v_ticket_classification_analytics: {
        Row: {
          avg_satisfaction_rating: number | null
          handled_by: string | null
          resolution_rate_percent: number | null
          resolved_tickets: number | null
          ticket_type: string | null
          total_tickets: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_ticket_tx: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_actor_role: string
          p_ai_dispatch_reason?: string
          p_auto_dispatched?: boolean
          p_scheduled_time: string
          p_technician_id: string
          p_ticket_id: string
        }
        Returns: undefined
      }
      check_face_login_rate_limit: {
        Args: {
          p_ip: string
          p_max_attempts?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_consume?: boolean
          p_key: string
          p_max_attempts?: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      current_apartment: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      current_technician_id: { Args: never; Returns: string }
      reject_ticket_resolution_tx: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_actor_role: string
          p_note?: string
          p_ticket_id: string
        }
        Returns: undefined
      }
      reset_rate_limit: { Args: { p_key: string }; Returns: undefined }
      resolve_ticket_tx: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_actor_role: string
          p_after_image: string
          p_note?: string
          p_ticket_id: string
        }
        Returns: undefined
      }
      start_ticket_work_tx: {
        Args: {
          p_actor_id: string
          p_actor_name: string
          p_actor_role: string
          p_ticket_id: string
        }
        Returns: undefined
      }
      transition_ekyc_and_face_tx: {
        Args: {
          p_action: string
          p_actor_apt?: string
          p_approver_name?: string
          p_ekyc_id?: string
          p_reason?: string
          p_target_user?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
