// ============================================================
// permissions.ts — Frontend role & permission helper
// Digunakan di komponen React untuk cek hak akses user
// ============================================================

export type SystemRoleType =
  | 'super_admin'
  | 'admin_makt'
  | 'admin_organisasi'
  | 'admin_event'
  | 'admin_absensi'
  | 'sekretaris'
  | 'approver'
  | 'ketua_rapat'
  | 'pengurus'
  | 'viewer'

export type PrivacyScopeType =
  | 'public'
  | 'organization_internal'
  | 'makt_internal'
  | 'restricted'
  | 'confidential'

// ============================================================
// Role metadata
// ============================================================
export const ROLE_LABELS: Record<SystemRoleType, string> = {
  super_admin:       'Super Admin',
  admin_makt:        'Admin MAKT',
  admin_organisasi:  'Admin Organisasi',
  admin_event:       'Admin Event',
  admin_absensi:     'Admin Absensi',
  sekretaris:        'Sekretaris / Notulis',
  approver:          'Approver / Pejabat',
  ketua_rapat:       'Ketua Rapat',
  pengurus:          'Pengurus / Anggota',
  viewer:            'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<SystemRoleType, string> = {
  super_admin:       'Akses penuh ke semua data dan fitur',
  admin_makt:        'Kelola event, pengajuan, kalender, organisasi, dan laporan',
  admin_organisasi:  'Kelola data organisasi sendiri saja',
  admin_event:       'Kelola pengajuan dan event',
  admin_absensi:     'Kelola absensi internal',
  sekretaris:        'Buat/edit notulen, upload dokumentasi, generate laporan',
  approver:          'Approve/reject pengajuan di level jabatannya',
  ketua_rapat:       'Pimpin rapat dan finalisasi notulen',
  pengurus:          'Lihat data internal organisasi sesuai akses',
  viewer:            'Read-only sesuai akses yang diberikan',
}

export const ROLE_COLORS: Record<SystemRoleType, string> = {
  super_admin:       'bg-red-100 text-red-800 border-red-200',
  admin_makt:        'bg-purple-100 text-purple-800 border-purple-200',
  admin_organisasi:  'bg-indigo-100 text-indigo-800 border-indigo-200',
  admin_event:       'bg-blue-100 text-blue-800 border-blue-200',
  admin_absensi:     'bg-cyan-100 text-cyan-800 border-cyan-200',
  sekretaris:        'bg-teal-100 text-teal-800 border-teal-200',
  approver:          'bg-amber-100 text-amber-800 border-amber-200',
  ketua_rapat:       'bg-orange-100 text-orange-800 border-orange-200',
  pengurus:          'bg-green-100 text-green-800 border-green-200',
  viewer:            'bg-gray-100 text-gray-600 border-gray-200',
}

export const ALL_ROLES = Object.keys(ROLE_LABELS) as SystemRoleType[]

// ============================================================
// Profile type (subset of user_profiles yang relevan)
// ============================================================
export interface UserPermissionProfile {
  user_id: string
  email?: string | null
  system_role?: SystemRoleType | null
  is_approved?: boolean
  jabatan?: string | null
  primary_organization_id?: string | null
}

export interface UserOrgRole {
  id: string
  user_id: string
  organization_id: string
  role: SystemRoleType
  is_active: boolean
  granted_at: string
  notes?: string | null
  // joined
  organizations?: { name: string; short_name: string | null } | null
}

// ============================================================
// Hardcoded super admin emails (backward compatibility)
// ============================================================
const SUPER_ADMIN_EMAILS = ['officialsiyoyok@gmail.com', 'yahya@example.com']

// ============================================================
// Permission check functions (client-side, based on profile)
// ============================================================

/** Apakah user adalah Super Admin? */
export function isSuperAdmin(profile: UserPermissionProfile | null, email?: string | null): boolean {
  if (!profile) return false
  if (profile.system_role === 'super_admin') return true
  if (email && SUPER_ADMIN_EMAILS.includes(email)) return true
  return false
}

/** Apakah user memiliki role global tertentu? */
export function hasSystemRole(
  profile: UserPermissionProfile | null,
  email: string | null | undefined,
  role: SystemRoleType
): boolean {
  if (isSuperAdmin(profile, email)) return true
  return profile?.system_role === role
}

/** Apakah user bisa mengelola organisasi tertentu? */
export function canManageOrg(
  profile: UserPermissionProfile | null,
  email: string | null | undefined,
  orgId: string,
  orgRoles: UserOrgRole[]
): boolean {
  if (isSuperAdmin(profile, email)) return true
  if (profile?.system_role === 'admin_makt') return true
  // Cek via org roles
  const myOrgRole = orgRoles.find(r => r.organization_id === orgId && r.is_active)
  if (myOrgRole && ['admin_organisasi', 'admin_makt'].includes(myOrgRole.role)) return true
  return false
}

/** Apakah user bisa approve pengajuan? */
export function canApprove(
  profile: UserPermissionProfile | null,
  email: string | null | undefined,
  orgRoles: UserOrgRole[]
): boolean {
  if (isSuperAdmin(profile, email)) return true
  if (profile?.system_role === 'admin_makt') return true
  if (profile?.system_role === 'approver') return true
  // Cek jabatan lama (backward compat)
  if (profile?.jabatan) return true
  // Cek org role
  return orgRoles.some(r => r.role === 'approver' && r.is_active)
}

/** Apakah user bisa melihat notulen berdasarkan privacy scope? */
export function canViewMinutes(
  profile: UserPermissionProfile | null,
  email: string | null | undefined,
  orgRoles: UserOrgRole[],
  privacyScope: PrivacyScopeType,
  ownerOrgId: string
): boolean {
  if (privacyScope === 'public') return true
  if (!profile) return false
  if (isSuperAdmin(profile, email)) return true
  if (profile.system_role === 'admin_makt') return true

  if (privacyScope === 'organization_internal') {
    // Hanya anggota org pemilik
    return orgRoles.some(r => r.organization_id === ownerOrgId && r.is_active)
  }
  if (privacyScope === 'makt_internal') {
    // Semua yang punya role di org manapun
    return orgRoles.some(r => r.is_active)
  }
  if (privacyScope === 'confidential') return false
  if (privacyScope === 'restricted') return false // harus cek meeting_minutes_access
  return false
}

/** Daftar privacy scope yang bisa dilihat user */
export function getAccessibleScopes(
  profile: UserPermissionProfile | null,
  email: string | null | undefined,
  orgRoles: UserOrgRole[]
): PrivacyScopeType[] {
  const scopes: PrivacyScopeType[] = ['public']
  if (!profile) return scopes

  if (isSuperAdmin(profile, email)) {
    return ['public', 'organization_internal', 'makt_internal', 'restricted', 'confidential']
  }
  if (orgRoles.some(r => r.is_active)) {
    scopes.push('makt_internal')
    scopes.push('organization_internal')
  }
  return scopes
}

/** Privacy scope label */
export const PRIVACY_SCOPE_LABELS: Record<PrivacyScopeType, string> = {
  public:                  '🌐 Publik',
  organization_internal:   '🏢 Internal Organisasi',
  makt_internal:           '🕌 Internal MAKT',
  restricted:              '🔒 Terbatas',
  confidential:            '🔐 Rahasia',
}

export const PRIVACY_SCOPE_COLORS: Record<PrivacyScopeType, string> = {
  public:                  'bg-green-100 text-green-800',
  organization_internal:   'bg-blue-100 text-blue-800',
  makt_internal:           'bg-indigo-100 text-indigo-800',
  restricted:              'bg-amber-100 text-amber-800',
  confidential:            'bg-red-100 text-red-800',
}
