export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// Org enums
// ============================================================
export type OrgType = 'dkm' | 'pemuda' | 'irmas' | 'other'
export type OrgUnitType = 'dewan' | 'badan_pelaksana' | 'bidang' | 'divisi' | 'pimpinan_harian' | 'pembina' | 'other'
export type ApprovalDecision = 'approve' | 'reject' | 'request_revision'
export type PrivacyLevelType = 'detail_publik' | 'umum_saja' | 'rahasia'
export type PrivacyScopeType = 'public' | 'organization_internal' | 'makt_internal' | 'restricted' | 'confidential'
export type MinutesStatus = 'draft' | 'finalized'
export type NotifChannel = 'whatsapp' | 'email' | 'in_app'
export type NotifStatus = 'pending' | 'sent' | 'failed'
export type EventRequestStatus = 'draft' | 'submitted' | 'under_review' | 'revision_requested' | 'approved' | 'rejected' | 'cancelled'
export type RequesterType = 'pribadi' | 'lembaga' | 'komunitas' | 'instansi' | 'internal'
export type AttendanceType = 'internal' | 'event' | 'public'

// ============================================================
// Helper row types (tidak tergantung Database interface)
// ============================================================
export interface Organization {
  id: string
  name: string
  short_name: string | null
  description: string | null
  type: OrgType
  parent_organization_id: string | null
  active_period_start: string | null
  active_period_end: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationUnit {
  id: string
  organization_id: string
  name: string
  type: OrgUnitType
  parent_unit_id: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  organizations?: { name: string; short_name: string | null } | null
}

export interface Position {
  id: string
  organization_id: string
  organization_unit_id: string | null
  name: string
  level_order: number
  is_approver: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  organizations?: { name: string; short_name: string | null } | null
  organization_units?: { name: string } | null
}

export interface OrganizationMember {
  id: string
  organization_id: string
  organization_unit_id: string | null
  position_id: string | null
  user_id: string | null
  full_name: string
  whatsapp: string | null
  email: string | null
  active_period_start: string | null
  active_period_end: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  organizations?: { name: string; short_name: string | null } | null
  organization_units?: { name: string } | null
  positions?: { name: string } | null
}

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
          event_request_id: string | null
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
          event_request_id?: string | null
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
          event_request_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          event_id: string | null
          full_name: string
          whatsapp: string
          email: string | null
          organization: string | null
          ticket_quantity: number
          ticket_code: string
          status: 'registered' | 'attended' | 'cancelled'
          checked_in_at: string | null
          event_request_id: string | null
          attendance_type: AttendanceType | null
          check_in_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          full_name: string
          whatsapp: string
          email?: string | null
          organization?: string | null
          ticket_quantity?: number
          ticket_code: string
          status?: 'registered' | 'attended' | 'cancelled'
          checked_in_at?: string | null
          event_request_id?: string | null
          attendance_type?: AttendanceType | null
          check_in_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          full_name?: string
          whatsapp?: string
          email?: string | null
          organization?: string | null
          ticket_quantity?: number
          ticket_code?: string
          status?: 'registered' | 'attended' | 'cancelled'
          checked_in_at?: string | null
          event_request_id?: string | null
          attendance_type?: AttendanceType | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Organization>
      }
      organization_units: {
        Row: OrganizationUnit
        Insert: Omit<OrganizationUnit, 'id' | 'created_at' | 'updated_at' | 'organizations'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<OrganizationUnit, 'organizations'>>
      }
      positions: {
        Row: Position
        Insert: Omit<Position, 'id' | 'created_at' | 'updated_at' | 'organizations' | 'organization_units'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Position, 'organizations' | 'organization_units'>>
      }
      organization_members: {
        Row: OrganizationMember
        Insert: Omit<OrganizationMember, 'id' | 'created_at' | 'updated_at' | 'organizations' | 'organization_units' | 'positions'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<OrganizationMember, 'organizations' | 'organization_units' | 'positions'>>
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
      org_type: OrgType
      org_unit_type: OrgUnitType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
