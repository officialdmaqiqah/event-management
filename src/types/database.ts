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
      events: {
        Row: {
          id: string
          title: string
          type: string
          description: string | null
          agenda: string | null
          location: string
          start_datetime: string
          end_datetime: string | null
          quota: number | null
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          registration_slug: string
          requires_registration: boolean
          latitude: number | null
          longitude: number | null
          radius_meters: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          type: string
          description?: string | null
          agenda?: string | null
          location: string
          start_datetime: string
          end_datetime?: string | null
          quota?: number | null
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          registration_slug: string
          requires_registration?: boolean
          latitude?: number | null
          longitude?: number | null
          radius_meters?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: string
          description?: string | null
          agenda?: string | null
          location?: string
          start_datetime?: string
          end_datetime?: string | null
          quota?: number | null
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          registration_slug?: string
          requires_registration?: boolean
          latitude?: number | null
          longitude?: number | null
          radius_meters?: number
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          event_id: string
          full_name: string
          whatsapp: string
          email: string | null
          organization: string | null
          ticket_quantity: number
          ticket_code: string
          status: 'registered' | 'attended' | 'cancelled'
          checked_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          full_name: string
          whatsapp: string
          email?: string | null
          organization?: string | null
          ticket_quantity?: number
          ticket_code: string
          status?: 'registered' | 'attended' | 'cancelled'
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          full_name?: string
          whatsapp?: string
          email?: string | null
          organization?: string | null
          ticket_quantity?: number
          ticket_code?: string
          status?: 'registered' | 'attended' | 'cancelled'
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_status: 'draft' | 'published' | 'cancelled' | 'completed'
      participant_status: 'registered' | 'attended' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
