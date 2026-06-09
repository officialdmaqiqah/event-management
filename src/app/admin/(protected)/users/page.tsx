"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"
import {
  ShieldAlert, ShieldCheck, User, Shield,
  Building2, Plus, X, Check, ChevronDown
} from "lucide-react"
import {
  ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS, ALL_ROLES,
  isSuperAdmin, type SystemRoleType, type UserOrgRole
} from "@/lib/permissions"

interface UserProfile {
  user_id: string
  email: string | null
  full_name: string | null
  whatsapp: string | null
  is_approved: boolean
  is_premium: boolean
  jabatan: string | null
  system_role: SystemRoleType | null
  primary_organization_id: string | null
  created_at: string
}

interface Organization {
  id: string
  name: string
  short_name: string | null
}

// ─── Modal: Assign Org Role ───────────────────────────────────
function OrgRoleModal({
  user,
  orgs,
  orgRoles,
  onClose,
  onSaved,
}: {
  user: UserProfile
  orgs: Organization[]
  orgRoles: UserOrgRole[]
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ organization_id: "", role: "pengurus" as SystemRoleType })
  const [error, setError] = useState<string | null>(null)

  const myOrgRoles = orgRoles.filter(r => r.user_id === user.user_id)

  const handleAdd = async () => {
    if (!form.organization_id) { setError("Pilih organisasi dulu"); return }
    setSaving(true); setError(null)
    const { error: err } = await supabase.from("user_org_roles").upsert({
      user_id: user.user_id,
      organization_id: form.organization_id,
      role: form.role,
      is_active: true,
    }, { onConflict: "user_id,organization_id" })
    if (err) setError(err.message)
    else { onSaved(); setForm({ organization_id: "", role: "pengurus" }) }
    setSaving(false)
  }

  const handleRevoke = async (roleId: string) => {
    setSaving(true)
    await supabase.from("user_org_roles").update({ is_active: false }).eq("id", roleId)
    onSaved()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Role Organisasi</h2>
            <p className="text-xs text-gray-500">{user.full_name || user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Existing org roles */}
          {myOrgRoles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role Saat Ini</p>
              {myOrgRoles.filter(r => r.is_active).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.organizations?.name || r.organization_id}</p>
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[r.role]}`}>
                      {ROLE_LABELS[r.role]}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 h-8 px-2"
                    onClick={() => handleRevoke(r.id)} disabled={saving}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new org role */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tambah Role Organisasi</p>
            {error && <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">{error}</div>}
            <div className="space-y-2">
              <Label className="text-xs">Organisasi</Label>
              <select
                value={form.organization_id}
                onChange={e => setForm(p => ({ ...p, organization_id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="">-- Pilih Organisasi --</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Role</Label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value as SystemRoleType }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {ALL_ROLES.filter(r => r !== 'super_admin').map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              {form.role && (
                <p className="text-xs text-gray-400">{ROLE_DESCRIPTIONS[form.role]}</p>
              )}
            </div>
            <Button onClick={handleAdd} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="w-4 h-4" /> {saving ? "Menyimpan..." : "Assign Role"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function UsersManagementPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [orgRoles, setOrgRoles] = useState<UserOrgRole[]>([])
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean; type: DialogType; title: string; message: string; onConfirm?: () => void
  }>({ isOpen: false, type: "alert", title: "", message: "" })

  const showDialog = (type: DialogType, title: string, message: string, onConfirm?: () => void) =>
    setDialogState({ isOpen: true, type, title, message, onConfirm })
  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }))

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserEmail(user?.email ?? null)

    const [{ data: usersData }, { data: orgsData }, { data: rolesData }] = await Promise.all([
      supabase.from("user_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("organizations").select("id, name, short_name").eq("is_active", true),
      supabase.from("user_org_roles").select("*, organizations(name, short_name)").eq("is_active", true),
    ])

    setUsers(usersData || [])
    setOrgs(orgsData || [])
    setOrgRoles(rolesData || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const togglePremium = async (userId: string, cur: boolean) => {
    const { error } = await supabase.from("user_profiles").update({ is_premium: !cur }).eq("user_id", userId)
    if (!error) setUsers(u => u.map(x => x.user_id === userId ? { ...x, is_premium: !cur } : x))
    else showDialog("error", "Gagal", error.message)
  }

  const toggleApproval = async (userId: string, cur: boolean) => {
    const { error } = await supabase.from("user_profiles").update({ is_approved: !cur }).eq("user_id", userId)
    if (!error) setUsers(u => u.map(x => x.user_id === userId ? { ...x, is_approved: !cur } : x))
    else showDialog("error", "Gagal", error.message)
  }

  const saveJabatan = async (userId: string, jabatan: string) => {
    const { error } = await supabase.from("user_profiles").update({ jabatan: jabatan.trim() || null }).eq("user_id", userId)
    if (!error) showDialog("success", "Berhasil", "Jabatan berhasil diperbarui.")
    else showDialog("error", "Gagal", error.message)
  }

  const saveFullName = async (userId: string, name: string) => {
    // Auto capitalize first letter of each word
    const formattedName = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    const { error } = await supabase.from("user_profiles").update({ full_name: formattedName.trim() || null }).eq("user_id", userId)
    if (!error) {
      setUsers(u => u.map(x => x.user_id === userId ? { ...x, full_name: formattedName.trim() } : x))
      showDialog("success", "Berhasil", "Nama pengguna berhasil diperbarui.")
    } else showDialog("error", "Gagal", error.message)
  }

  const saveWhatsApp = async (userId: string, rawWa: string) => {
    let formattedWA = rawWa.replace(/\D/g, '')
    if (formattedWA.startsWith('0')) {
      formattedWA = '62' + formattedWA.substring(1)
    }
    const { error } = await supabase.from("user_profiles").update({ whatsapp: formattedWA || null }).eq("user_id", userId)
    if (!error) {
      setUsers(u => u.map(x => x.user_id === userId ? { ...x, whatsapp: formattedWA } : x))
      showDialog("success", "Berhasil", "Nomor WhatsApp berhasil diperbarui.")
    }
    else showDialog("error", "Gagal", error.message)
  }

  const saveSystemRole = async (userId: string, role: SystemRoleType | "") => {
    const { error } = await supabase.from("user_profiles")
      .update({ system_role: role || null })
      .eq("user_id", userId)
    if (!error) {
      setUsers(u => u.map(x => x.user_id === userId ? { ...x, system_role: role || null } : x))
      showDialog("success", "Berhasil", "System role berhasil diperbarui.")
    } else showDialog("error", "Gagal", error.message)
  }

  const deleteUser = async (userId: string) => {
    setLoading(true)
    const { error } = await supabase.rpc("delete_user_by_admin", { target_user_id: userId })
    if (!error) {
      setUsers(u => u.filter(x => x.user_id !== userId))
      showDialog("success", "Berhasil", "Akun berhasil dihapus.")
    } else showDialog("error", "Gagal", error.message)
    setLoading(false)
  }

  const getUserOrgRoles = (userId: string) =>
    orgRoles.filter(r => r.user_id === userId && r.is_active)

  if (loading) return (
    <div className="p-10 flex items-center justify-center">
      <div className="animate-pulse text-indigo-500 font-semibold">Memuat Data Pengguna...</div>
    </div>
  )

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} pengguna terdaftar</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map(user => {
          const isMe = user.email === currentUserEmail
          const superAdmin = isSuperAdmin(user, user.email)
          const myOrgRoles = getUserOrgRoles(user.user_id)
          const showRoleExpand = expandedRole === user.user_id

          return (
            <Card key={user.user_id} className={`shadow-sm border-t-4 transition-shadow hover:shadow-md ${
              superAdmin ? "border-t-red-400 bg-red-50/20"
              : user.is_premium ? "border-t-amber-500 bg-amber-50/10"
              : "border-t-slate-200"
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate text-slate-800">
                    <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{user.full_name || "Tanpa Nama"}</span>
                    {isMe && <span className="text-xs text-indigo-500 font-normal">(saya)</span>}
                  </span>
                  {superAdmin ? (
                    <Shield className="h-5 w-5 text-red-400 flex-shrink-0" />
                  ) : user.is_premium ? (
                    <ShieldCheck className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-slate-300 flex-shrink-0" />
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-slate-500">{user.email}</p>

                {/* System Role Badge */}
                {user.system_role && (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[user.system_role]}`}>
                      {ROLE_LABELS[user.system_role]}
                    </span>
                  </div>
                )}

                {/* Org Roles badges */}
                {myOrgRoles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {myOrgRoles.map(r => (
                      <span key={r.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Building2 className="w-2.5 h-2.5" />
                        {r.organizations?.short_name || "Org"}
                      </span>
                    ))}
                  </div>
                )}

                {/* Nama Pengguna */}
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${user.user_id}`} className="text-xs font-semibold text-slate-500">
                    Nama Pengguna
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`name-${user.user_id}`}
                      value={user.full_name || ""}
                      onChange={e => setUsers(u => u.map(x => x.user_id === user.user_id ? { ...x, full_name: e.target.value } : x))}
                      placeholder="Contoh: Budi Santoso"
                      className="h-8 text-xs bg-white/50"
                    />
                    <Button size="sm" className="h-8 text-xs px-2.5 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => saveFullName(user.user_id, user.full_name || "")}>
                      Simpan
                    </Button>
                  </div>
                </div>

                {/* System Role Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">System Role</Label>
                  <select
                    value={user.system_role || ""}
                    onChange={e => saveSystemRole(user.user_id, e.target.value as SystemRoleType | "")}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    <option value="">-- Tidak ada role global --</option>
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>

                {/* Jabatan (backward compat) */}
                <div className="space-y-1.5">
                  <Label htmlFor={`jabatan-${user.user_id}`} className="text-xs font-semibold text-slate-500">
                    Jabatan (Approval Workflow)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`jabatan-${user.user_id}`}
                      value={user.jabatan || ""}
                      onChange={e => setUsers(u => u.map(x => x.user_id === user.user_id ? { ...x, jabatan: e.target.value } : x))}
                      placeholder="Contoh: Ketua DKM"
                      className="h-8 text-xs bg-white/50"
                    />
                    <Button size="sm" className="h-8 text-xs px-2.5 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => saveJabatan(user.user_id, user.jabatan || "")}>
                      Simpan
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">Dipakai untuk matching approval workflow</p>
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Label htmlFor={`wa-${user.user_id}`} className="text-xs font-semibold text-slate-500">
                    Nomor WhatsApp
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`wa-${user.user_id}`}
                      value={user.whatsapp || ""}
                      onChange={e => setUsers(u => u.map(x => x.user_id === user.user_id ? { ...x, whatsapp: e.target.value } : x))}
                      placeholder="Contoh: 0812..."
                      className="h-8 text-xs bg-white/50"
                    />
                    <Button size="sm" className="h-8 text-xs px-2.5 bg-green-600 hover:bg-green-700"
                      onClick={() => saveWhatsApp(user.user_id, user.whatsapp || "")}>
                      Simpan
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">Otomatis diformat menjadi 62</p>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  {/* Akses Sistem */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Akses Sistem</span>
                    <Button size="sm" variant={user.is_approved ? "outline" : "default"}
                      className={user.is_approved ? "border-green-200 text-green-700 hover:bg-green-50 h-7 text-xs" : "bg-blue-600 hover:bg-blue-700 h-7 text-xs"}
                      onClick={() => toggleApproval(user.user_id, user.is_approved)}>
                      {user.is_approved ? "Cabut Akses" : "Setujui Akses"}
                    </Button>
                  </div>

                  {/* Premium */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status Premium</span>
                    <Button size="sm" variant={user.is_premium ? "outline" : "default"}
                      className={user.is_premium ? "border-amber-200 text-amber-700 hover:bg-amber-50 h-7 text-xs" : "bg-indigo-600 hover:bg-indigo-700 h-7 text-xs"}
                      onClick={() => togglePremium(user.user_id, user.is_premium)}>
                      {user.is_premium ? "Cabut Premium" : "Aktifkan Premium"}
                    </Button>
                  </div>

                  {/* Role Organisasi */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role Organisasi</span>
                    <Button size="sm" variant="outline"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 h-7 text-xs gap-1"
                      onClick={() => setSelectedUser(user)}>
                      <Building2 className="w-3 h-3" />
                      Atur ({myOrgRoles.length})
                    </Button>
                  </div>

                  {/* Hapus */}
                  <div className="pt-2 border-t border-slate-50">
                    <Button size="sm" variant="destructive" className="w-full text-xs"
                      onClick={() => showDialog("confirm", "Hapus Akun",
                        `Hapus akun "${user.full_name || user.email}" secara permanen?\nSemua data terkait akan terhapus.`,
                        () => deleteUser(user.user_id))}>
                      Hapus Akun
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {users.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-500 rounded-xl border bg-gray-50">
            Belum ada pengguna terdaftar.
          </div>
        )}
      </div>

      {/* Modal Org Role */}
      {selectedUser && (
        <OrgRoleModal
          user={selectedUser}
          orgs={orgs}
          orgRoles={orgRoles}
          onClose={() => setSelectedUser(null)}
          onSaved={() => { fetchAll(); }}
        />
      )}

      <CustomDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onCancel={closeDialog}
        onConfirm={dialogState.onConfirm ? () => { closeDialog(); dialogState.onConfirm!() } : undefined}
      />
    </div>
  )
}
