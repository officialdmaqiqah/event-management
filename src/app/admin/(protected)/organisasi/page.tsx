"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Building2, Users, Briefcase, UserCheck, GitBranch,
  Plus, Pencil, Trash2, X, Check, ChevronDown, AlertTriangle,
  Search, Building, Shield, Star, Eye, Lock, ShieldCheck
} from "lucide-react"
import type { Organization, OrganizationUnit, Position, OrganizationMember, OrgType, OrgUnitType } from "@/types/database"
import {
  ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS, ALL_ROLES,
  type SystemRoleType, type UserOrgRole
} from "@/lib/permissions"

// ============================================================
// TYPES
// ============================================================
type Tab = "organisasi" | "unit" | "jabatan" | "pengurus" | "workflow" | "roles"

const ORG_TYPE_LABEL: Record<OrgType, string> = {
  dkm: "DKM / Badan Pengelola",
  pemuda: "Pemuda",
  irmas: "Irmas",
  other: "Lainnya",
}

const ORG_UNIT_TYPE_LABEL: Record<OrgUnitType, string> = {
  dewan: "Dewan",
  badan_pelaksana: "Badan Pelaksana",
  bidang: "Bidang",
  divisi: "Divisi",
  pimpinan_harian: "Pimpinan Harian",
  pembina: "Pembina",
  other: "Lainnya",
}

const ORG_TYPE_COLOR: Record<OrgType, string> = {
  dkm: "bg-emerald-100 text-emerald-800",
  pemuda: "bg-blue-100 text-blue-800",
  irmas: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-700",
}

// ============================================================
// HELPERS
// ============================================================
function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function OrganisasiPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>("organisasi")
  const [loading, setLoading] = useState(true)

  // Data state
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [units, setUnits] = useState<(OrganizationUnit & { organizations?: { name: string; short_name: string | null } | null })[]>([])
  const [positions, setPositions] = useState<(Position & { organizations?: any; organization_units?: any })[]>([])
  const [members, setMembers] = useState<(OrganizationMember & { organizations?: any; organization_units?: any; positions?: any })[]>([])
  const [users, setUsers] = useState<{ user_id: string; full_name: string | null; email: string | null; system_role?: string | null }[]>([])
  const [orgRoles, setOrgRoles] = useState<(UserOrgRole & { organizations?: any })[]>([])

  // Filter state
  const [filterOrgId, setFilterOrgId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // Modal state
  const [modal, setModal] = useState<{
    type: "org" | "unit" | "position" | "member"
    mode: "add" | "edit"
    data?: any
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // ============================================================
  // FETCH
  // ============================================================
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: orgsData }, { data: unitsData }, { data: posData }, { data: membersData }, { data: usersData }, { data: orgRolesData }] = await Promise.all([
      supabase.from("organizations").select("*").order("type").order("name"),
      supabase.from("organization_units").select("*, organizations(name, short_name)").order("organization_id").order("name"),
      supabase.from("positions").select("*, organizations(name, short_name), organization_units(name)").order("organization_id").order("level_order"),
      supabase.from("organization_members").select("*, organizations(name, short_name), organization_units(name), positions(name)").order("organization_id").order("full_name"),
      supabase.from("user_profiles").select("user_id, full_name, email, system_role"),
      supabase.from("user_org_roles").select("*, organizations(name, short_name)").eq("is_active", true).order("organization_id"),
    ])
    setOrgs(orgsData || [])
    setUnits(unitsData || [])
    setPositions(posData || [])
    setMembers(membersData || [])
    setUsers(usersData || [])
    setOrgRoles(orgRolesData || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ============================================================
  // FILTER HELPERS
  // ============================================================
  const filteredUnits = units.filter(u =>
    (!filterOrgId || u.organization_id === filterOrgId) &&
    (!searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const filteredPositions = positions.filter(p =>
    (!filterOrgId || p.organization_id === filterOrgId) &&
    (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const filteredMembers = members.filter(m =>
    (!filterOrgId || m.organization_id === filterOrgId) &&
    (!searchQuery || m.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // ============================================================
  // SAVE HANDLERS
  // ============================================================
  const handleSave = async (formData: any) => {
    setSaving(true)
    setFormError(null)
    try {
      if (modal?.type === "org") {
        const payload = {
          name: formData.name,
          short_name: formData.short_name || null,
          description: formData.description || null,
          type: formData.type as OrgType,
          active_period_start: formData.active_period_start || null,
          active_period_end: formData.active_period_end || null,
          is_active: formData.is_active === "true" || formData.is_active === true,
        }
        if (modal.mode === "add") {
          const { error } = await supabase.from("organizations").insert(payload)
          if (error) throw error
        } else {
          const { error } = await supabase.from("organizations").update(payload).eq("id", modal.data.id)
          if (error) throw error
        }
      } else if (modal?.type === "unit") {
        const payload = {
          organization_id: formData.organization_id,
          name: formData.name,
          type: formData.type as OrgUnitType,
          parent_unit_id: formData.parent_unit_id || null,
          description: formData.description || null,
          is_active: formData.is_active === "true" || formData.is_active === true,
        }
        if (modal.mode === "add") {
          const { error } = await supabase.from("organization_units").insert(payload)
          if (error) throw error
        } else {
          const { error } = await supabase.from("organization_units").update(payload).eq("id", modal.data.id)
          if (error) throw error
        }
      } else if (modal?.type === "position") {
        const payload = {
          organization_id: formData.organization_id,
          organization_unit_id: formData.organization_unit_id || null,
          name: formData.name,
          level_order: parseInt(formData.level_order) || 0,
          is_approver: formData.is_approver === "true" || formData.is_approver === true,
          is_active: formData.is_active === "true" || formData.is_active === true,
        }
        if (modal.mode === "add") {
          const { error } = await supabase.from("positions").insert(payload)
          if (error) throw error
        } else {
          const { error } = await supabase.from("positions").update(payload).eq("id", modal.data.id)
          if (error) throw error
        }
      } else if (modal?.type === "member") {
        const payload = {
          organization_id: formData.organization_id,
          organization_unit_id: formData.organization_unit_id || null,
          position_id: formData.position_id || null,
          user_id: formData.user_id || null,
          full_name: formData.full_name,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          active_period_start: formData.active_period_start || null,
          active_period_end: formData.active_period_end || null,
          is_active: formData.is_active === "true" || formData.is_active === true,
        }
        if (modal.mode === "add") {
          const { error } = await supabase.from("organization_members").insert(payload)
          if (error) throw error
        } else {
          const { error } = await supabase.from("organization_members").update(payload).eq("id", modal.data.id)
          if (error) throw error
        }
      }
      setModal(null)
      await fetchAll()
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan data")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setSaving(true)
    try {
      const table = deleteConfirm.type === "org" ? "organizations"
        : deleteConfirm.type === "unit" ? "organization_units"
        : deleteConfirm.type === "position" ? "positions"
        : "organization_members"
      // Soft delete: set is_active = false
      const { error } = await supabase.from(table).update({ is_active: false }).eq("id", deleteConfirm.id)
      if (error) throw error
      setDeleteConfirm(null)
      await fetchAll()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // TAB CONFIG
  // ============================================================
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "organisasi", label: "Organisasi", icon: Building2 },
    { id: "unit", label: "Unit / Bidang", icon: GitBranch },
    { id: "jabatan", label: "Jabatan", icon: Briefcase },
    { id: "pengurus", label: "Pengurus", icon: UserCheck },
    { id: "workflow", label: "Workflow", icon: Shield },
    { id: "roles", label: "Role & Akses", icon: Lock },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Memuat data organisasi...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Struktur Organisasi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola organisasi, unit, jabatan, dan pengurus MAKT</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "organisasi" && (
            <Button onClick={() => { setModal({ type: "org", mode: "add" }); setFormError(null) }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="w-4 h-4" /> Tambah Organisasi
            </Button>
          )}
          {activeTab === "unit" && (
            <Button onClick={() => { setModal({ type: "unit", mode: "add" }); setFormError(null) }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="w-4 h-4" /> Tambah Unit
            </Button>
          )}
          {activeTab === "jabatan" && (
            <Button onClick={() => { setModal({ type: "position", mode: "add" }); setFormError(null) }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="w-4 h-4" /> Tambah Jabatan
            </Button>
          )}
          {activeTab === "pengurus" && (
            <Button onClick={() => { setModal({ type: "member", mode: "add" }); setFormError(null) }} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
              <Plus className="w-4 h-4" /> Tambah Pengurus
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Organisasi", value: orgs.filter(o => o.is_active).length, icon: Building2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Unit/Bidang", value: units.filter(u => u.is_active).length, icon: GitBranch, color: "text-blue-600 bg-blue-50" },
          { label: "Jabatan", value: positions.filter(p => p.is_active).length, icon: Briefcase, color: "text-violet-600 bg-violet-50" },
          { label: "Pengurus", value: members.filter(m => m.is_active).length, icon: Users, color: "text-amber-600 bg-amber-50" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(""); setFilterOrgId("") }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filter bar (for tabs that need it) */}
      {(activeTab === "unit" || activeTab === "jabatan" || activeTab === "pengurus" || activeTab === "roles") && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <select
            value={filterOrgId}
            onChange={e => setFilterOrgId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            <option value="">Semua Organisasi</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.short_name || o.name}</option>)}
          </select>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: ORGANISASI                                               */}
      {/* ============================================================ */}
      {activeTab === "organisasi" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.length === 0 && <EmptyState icon={Building2} message="Belum ada organisasi" />}
          {orgs.map(org => (
            <Card key={org.id} className={`border shadow-sm transition-all hover:shadow-md ${!org.is_active ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge label={ORG_TYPE_LABEL[org.type]} color={ORG_TYPE_COLOR[org.type]} />
                      {!org.is_active && <Badge label="Nonaktif" color="bg-gray-100 text-gray-500" />}
                    </div>
                    <CardTitle className="text-base leading-tight">{org.name}</CardTitle>
                    {org.short_name && <p className="text-xs text-gray-500 mt-0.5">{org.short_name}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {org.description && <p className="text-xs text-gray-600 line-clamp-2">{org.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{units.filter(u => u.organization_id === org.id).length} unit</span>
                  <span>{members.filter(m => m.organization_id === org.id).length} pengurus</span>
                </div>
                {(org.active_period_start || org.active_period_end) && (
                  <p className="text-xs text-gray-400">
                    Periode: {org.active_period_start || "–"} s/d {org.active_period_end || "sekarang"}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline" size="sm" className="flex-1 gap-1 text-xs"
                    onClick={() => { setModal({ type: "org", mode: "edit", data: org }); setFormError(null) }}
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <Button
                    variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteConfirm({ type: "org", id: org.id, name: org.name })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: UNIT / BIDANG                                            */}
      {/* ============================================================ */}
      {activeTab === "unit" && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {filteredUnits.length === 0 ? (
              <EmptyState icon={GitBranch} message="Belum ada unit/bidang. Tambahkan unit baru atau jalankan migration 14." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Unit</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Tipe</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Organisasi</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUnits.map(unit => (
                      <tr key={unit.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {unit.name}
                          {unit.description && <p className="text-xs text-gray-400 font-normal line-clamp-1">{unit.description}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={ORG_UNIT_TYPE_LABEL[unit.type]} color="bg-blue-50 text-blue-700" />
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {unit.organizations?.short_name || unit.organizations?.name || "–"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={unit.is_active ? "Aktif" : "Nonaktif"} color={unit.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                              onClick={() => { setModal({ type: "unit", mode: "edit", data: unit }); setFormError(null) }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteConfirm({ type: "unit", id: unit.id, name: unit.name })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB: JABATAN                                                  */}
      {/* ============================================================ */}
      {activeTab === "jabatan" && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {filteredPositions.length === 0 ? (
              <EmptyState icon={Briefcase} message="Belum ada jabatan. Tambahkan jabatan baru." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Jabatan</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Organisasi</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Unit/Bidang</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Level</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Approver</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPositions.map(pos => (
                      <tr key={pos.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{pos.name}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {pos.organizations?.short_name || pos.organizations?.name || "–"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {pos.organization_units?.name || <span className="italic text-gray-300">Semua unit</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                            {pos.level_order}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pos.is_approver
                            ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                            : <X className="w-4 h-4 text-gray-300 mx-auto" />}
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={pos.is_active ? "Aktif" : "Nonaktif"} color={pos.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                              onClick={() => { setModal({ type: "position", mode: "edit", data: pos }); setFormError(null) }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteConfirm({ type: "position", id: pos.id, name: pos.name })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB: PENGURUS / ANGGOTA                                       */}
      {/* ============================================================ */}
      {activeTab === "pengurus" && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {filteredMembers.length === 0 ? (
              <EmptyState icon={UserCheck} message="Belum ada pengurus. Tambahkan pengurus baru." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Organisasi</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Bidang</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Jabatan</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">WhatsApp</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Akun</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{m.full_name}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {m.organizations?.short_name || m.organizations?.name || "–"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px]">
                          <span className="line-clamp-1">{m.organization_units?.name || <span className="italic text-gray-300">–</span>}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                          {m.positions?.name || <span className="italic text-gray-300">–</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {m.whatsapp
                            ? <a href={`https://wa.me/${m.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">{m.whatsapp}</a>
                            : "–"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.user_id
                            ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100"><Check className="w-3.5 h-3.5 text-indigo-600" /></span>
                            : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100"><X className="w-3.5 h-3.5 text-gray-400" /></span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={m.is_active ? "Aktif" : "Nonaktif"} color={m.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                              onClick={() => { setModal({ type: "member", mode: "edit", data: m }); setFormError(null) }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteConfirm({ type: "member", id: m.id, name: m.full_name })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB: WORKFLOW                                                 */}
      {/* ============================================================ */}
      {activeTab === "workflow" && (
        <div className="space-y-4">
          <Card className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" /> Workflow Approval per Organisasi
              </CardTitle>
              <CardDescription>
                Workflow approval diatur berdasarkan jenis event dan organisasi. Setiap organisasi bisa memiliki rantai approval yang berbeda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orgs.filter(o => o.is_active).map(org => (
                  <div key={org.id} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${org.type === "dkm" ? "bg-emerald-500" : org.type === "pemuda" ? "bg-blue-500" : "bg-purple-500"}`} />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{org.name}</p>
                        <p className="text-xs text-gray-500">{org.short_name || ORG_TYPE_LABEL[org.type]}</p>
                      </div>
                    </div>
                    <a
                      href="/admin/settings/event-types"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" /> Atur Workflow
                    </a>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-800">
                <p className="font-medium mb-1">💡 Cara mengatur workflow:</p>
                <ol className="list-decimal ml-4 space-y-1 text-xs text-amber-700">
                  <li>Buka menu <strong>Pengaturan → Jenis Event</strong></li>
                  <li>Pilih jenis event yang ingin diatur approval-nya</li>
                  <li>Tambahkan level approval dengan memilih jabatan dari organisasi terkait</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Privacy scope info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-500" /> Level Privasi Data
              </CardTitle>
              <CardDescription>Hak akses data berdasarkan privacy scope</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { scope: "public", label: "Public", desc: "Dapat dilihat semua orang termasuk publik", color: "bg-green-100 text-green-800" },
                  { scope: "organization_internal", label: "Internal Organisasi", desc: "Hanya anggota organisasi terkait", color: "bg-blue-100 text-blue-800" },
                  { scope: "makt_internal", label: "Internal MAKT", desc: "Semua pengurus MAKT (DKM, Pemuda, Irmas)", color: "bg-indigo-100 text-indigo-800" },
                  { scope: "restricted", label: "Terbatas", desc: "Hanya role/jabatan/user yang diberi akses khusus", color: "bg-amber-100 text-amber-800" },
                  { scope: "confidential", label: "Rahasia", desc: "Hanya Super Admin atau user yang ditunjuk", color: "bg-red-100 text-red-800" },
                ].map(item => (
                  <div key={item.scope} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                    <Badge label={item.label} color={item.color} />
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: ROLE & AKSES                                             */}
      {/* ============================================================ */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          {/* Legend */}
          <Card className="border-l-4 border-l-violet-500 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-violet-500" /> Role & Hak Akses per Organisasi
              </CardTitle>
              <CardDescription>
                Kelola siapa yang memiliki role di tiap organisasi. Untuk assign role ke user, buka <a href="/admin/users" className="text-indigo-600 underline">Kelola Pengguna</a>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Role legend */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_ROLES.map(role => (
                  <div key={role} className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50">
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                    <p className="text-xs text-gray-500 line-clamp-1">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Per-org user roles table */}
          {orgs.filter(o => !filterOrgId || o.id === filterOrgId).map(org => {
            const thisOrgRoles = orgRoles.filter(r =>
              r.organization_id === org.id &&
              (!searchQuery || (users.find(u => u.user_id === r.user_id)?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()))
            )
            return (
              <Card key={org.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        org.type === "dkm" ? "bg-emerald-500" :
                        org.type === "pemuda" ? "bg-blue-500" : "bg-purple-500"
                      }`} />
                      <CardTitle className="text-sm">{org.name}</CardTitle>
                      <Badge label={`${thisOrgRoles.length} user`} color="bg-gray-100 text-gray-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {thisOrgRoles.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">
                      Belum ada user dengan role di organisasi ini.
                      <br />
                      <a href="/admin/users" className="text-indigo-500 underline">Assign role di halaman Kelola Pengguna</a>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-y">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Nama</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Email</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Role</th>
                            <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Diberikan</th>
                            <th className="text-right px-4 py-2 font-medium text-gray-600 text-xs">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {thisOrgRoles.map(r => {
                            const u = users.find(u => u.user_id === r.user_id)
                            return (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-medium text-gray-900 text-xs whitespace-nowrap">
                                  {u?.full_name || <span className="italic text-gray-400">User dihapus</span>}
                                </td>
                                <td className="px-4 py-2.5 text-gray-500 text-xs">{u?.email || "–"}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[r.role]}`}>
                                    {ROLE_LABELS[r.role]}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                                  {new Date(r.granted_at).toLocaleDateString("id-ID")}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-7 px-2 text-xs text-red-500 hover:bg-red-50"
                                    onClick={async () => {
                                      await supabase.from("user_org_roles").update({ is_active: false }).eq("id", r.id)
                                      fetchAll()
                                    }}
                                  >
                                    <X className="w-3 h-3 mr-1" /> Cabut
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT ORGANISASI                               */}
      {/* ============================================================ */}
      <Modal
        open={modal?.type === "org"}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Tambah Organisasi" : "Edit Organisasi"}
      >
        <OrgForm
          initial={modal?.data}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          saving={saving}
          error={formError}
        />
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT UNIT                                     */}
      {/* ============================================================ */}
      <Modal
        open={modal?.type === "unit"}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Tambah Unit/Bidang" : "Edit Unit/Bidang"}
      >
        <UnitForm
          initial={modal?.data}
          orgs={orgs}
          units={units}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          saving={saving}
          error={formError}
        />
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT JABATAN                                  */}
      {/* ============================================================ */}
      <Modal
        open={modal?.type === "position"}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Tambah Jabatan" : "Edit Jabatan"}
      >
        <PositionForm
          initial={modal?.data}
          orgs={orgs}
          units={units}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          saving={saving}
          error={formError}
        />
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT PENGURUS                                 */}
      {/* ============================================================ */}
      <Modal
        open={modal?.type === "member"}
        onClose={() => setModal(null)}
        title={modal?.mode === "add" ? "Tambah Pengurus" : "Edit Pengurus"}
      >
        <MemberForm
          initial={modal?.data}
          orgs={orgs}
          units={units}
          positions={positions}
          users={users}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          saving={saving}
          error={formError}
        />
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS                                       */}
      {/* ============================================================ */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Nonaktifkan">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Data tidak akan dihapus permanen</p>
              <p className="text-xs text-amber-700 mt-1">
                <strong>"{deleteConfirm?.name}"</strong> akan dinonaktifkan (is_active = false). Data tetap tersimpan di database dan bisa diaktifkan kembali.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Memproses..." : "Nonaktifkan"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================================
// FORM: ORGANISASI
// ============================================================
function OrgForm({ initial, onSave, onCancel, saving, error }: any) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    short_name: initial?.short_name || "",
    type: initial?.type || "other",
    description: initial?.description || "",
    active_period_start: initial?.active_period_start || "",
    active_period_end: initial?.active_period_end || "",
    is_active: initial?.is_active !== undefined ? String(initial.is_active) : "true",
  })

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="org-name">Nama Organisasi *</Label>
        <Input id="org-name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Badan Pengelola MAKT" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-short">Singkatan</Label>
        <Input id="org-short" value={form.short_name} onChange={e => setForm(p => ({ ...p, short_name: e.target.value }))} placeholder="Contoh: DKM MAKT" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-type">Tipe *</Label>
        <select id="org-type" required value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="dkm">DKM / Badan Pengelola</option>
          <option value="pemuda">Pemuda</option>
          <option value="irmas">Irmas</option>
          <option value="other">Lainnya</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-desc">Deskripsi</Label>
        <textarea id="org-desc" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Deskripsi singkat organisasi" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="org-start">Periode Mulai</Label>
          <Input id="org-start" type="date" value={form.active_period_start} onChange={e => setForm(p => ({ ...p, active_period_start: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-end">Periode Selesai</Label>
          <Input id="org-end" type="date" value={form.active_period_end} onChange={e => setForm(p => ({ ...p, active_period_end: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <select value={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Batal</Button>
        <Button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  )
}

// ============================================================
// FORM: UNIT / BIDANG
// ============================================================
function UnitForm({ initial, orgs, units, onSave, onCancel, saving, error }: any) {
  const [form, setForm] = useState({
    organization_id: initial?.organization_id || "",
    name: initial?.name || "",
    type: initial?.type || "bidang",
    parent_unit_id: initial?.parent_unit_id || "",
    description: initial?.description || "",
    is_active: initial?.is_active !== undefined ? String(initial.is_active) : "true",
  })

  const sameOrgUnits = units.filter((u: OrganizationUnit) => u.organization_id === form.organization_id && u.id !== initial?.id)

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <div className="space-y-2">
        <Label>Organisasi *</Label>
        <select required value={form.organization_id} onChange={e => setForm(p => ({ ...p, organization_id: e.target.value, parent_unit_id: "" }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="">-- Pilih Organisasi --</option>
          {orgs.map((o: Organization) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Nama Unit/Bidang *</Label>
        <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Bidang Idarah" />
      </div>
      <div className="space-y-2">
        <Label>Tipe *</Label>
        <select required value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="dewan">Dewan</option>
          <option value="badan_pelaksana">Badan Pelaksana</option>
          <option value="bidang">Bidang</option>
          <option value="divisi">Divisi</option>
          <option value="pimpinan_harian">Pimpinan Harian</option>
          <option value="pembina">Pembina</option>
          <option value="other">Lainnya</option>
        </select>
      </div>
      {sameOrgUnits.length > 0 && (
        <div className="space-y-2">
          <Label>Unit Induk (opsional)</Label>
          <select value={form.parent_unit_id} onChange={e => setForm(p => ({ ...p, parent_unit_id: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="">-- Tidak ada (unit utama) --</option>
            {sameOrgUnits.map((u: OrganizationUnit) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Deskripsi unit/bidang" />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <select value={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Batal</Button>
        <Button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  )
}

// ============================================================
// FORM: JABATAN / POSISI
// ============================================================
function PositionForm({ initial, orgs, units, onSave, onCancel, saving, error }: any) {
  const [form, setForm] = useState({
    organization_id: initial?.organization_id || "",
    organization_unit_id: initial?.organization_unit_id || "",
    name: initial?.name || "",
    level_order: initial?.level_order ?? 1,
    is_approver: initial?.is_approver !== undefined ? String(initial.is_approver) : "false",
    is_active: initial?.is_active !== undefined ? String(initial.is_active) : "true",
  })

  const filteredUnits = units.filter((u: OrganizationUnit) => u.organization_id === form.organization_id)

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <div className="space-y-2">
        <Label>Organisasi *</Label>
        <select required value={form.organization_id} onChange={e => setForm(p => ({ ...p, organization_id: e.target.value, organization_unit_id: "" }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="">-- Pilih Organisasi --</option>
          {orgs.map((o: Organization) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Unit/Bidang (opsional)</Label>
        <select value={form.organization_unit_id} onChange={e => setForm(p => ({ ...p, organization_unit_id: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="">-- Semua unit (jabatan umum) --</option>
          {filteredUnits.map((u: OrganizationUnit) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Nama Jabatan *</Label>
        <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Ketua Umum" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Level Order</Label>
          <Input type="number" min={0} value={form.level_order} onChange={e => setForm(p => ({ ...p, level_order: e.target.value }))}
            placeholder="1 = tertinggi" />
        </div>
        <div className="space-y-2">
          <Label>Bisa Approve?</Label>
          <select value={form.is_approver} onChange={e => setForm(p => ({ ...p, is_approver: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="true">Ya</option>
            <option value="false">Tidak</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <select value={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Batal</Button>
        <Button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  )
}

// ============================================================
// FORM: PENGURUS / ANGGOTA
// ============================================================
function MemberForm({ initial, orgs, units, positions, users, onSave, onCancel, saving, error }: any) {
  const [form, setForm] = useState({
    organization_id: initial?.organization_id || "",
    organization_unit_id: initial?.organization_unit_id || "",
    position_id: initial?.position_id || "",
    user_id: initial?.user_id || "",
    full_name: initial?.full_name || "",
    whatsapp: initial?.whatsapp || "",
    email: initial?.email || "",
    active_period_start: initial?.active_period_start || "",
    active_period_end: initial?.active_period_end || "",
    is_active: initial?.is_active !== undefined ? String(initial.is_active) : "true",
  })

  const filteredUnits = units.filter((u: OrganizationUnit) => u.organization_id === form.organization_id)
  const filteredPositions = positions.filter((p: Position) => p.organization_id === form.organization_id)

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <div className="space-y-2">
        <Label>Organisasi *</Label>
        <select required value={form.organization_id} onChange={e => setForm(p => ({ ...p, organization_id: e.target.value, organization_unit_id: "", position_id: "" }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="">-- Pilih Organisasi --</option>
          {orgs.map((o: Organization) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Unit/Bidang</Label>
          <select value={form.organization_unit_id} onChange={e => setForm(p => ({ ...p, organization_unit_id: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="">-- Pilih Unit --</option>
            {filteredUnits.map((u: OrganizationUnit) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Jabatan</Label>
          <select value={form.position_id} onChange={e => setForm(p => ({ ...p, position_id: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
            <option value="">-- Pilih Jabatan --</option>
            {filteredPositions.map((pos: Position) => <option key={pos.id} value={pos.id}>{pos.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nama Lengkap *</Label>
        <Input required value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Nama lengkap pengurus" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="628123456789" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@contoh.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Akun Login (opsional)</Label>
        <select value={form.user_id} onChange={e => setForm(p => ({ ...p, user_id: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="">-- Tidak terhubung ke akun --</option>
          {users.map((u: any) => <option key={u.user_id} value={u.user_id}>{u.full_name || u.email}</option>)}
        </select>
        <p className="text-xs text-gray-400">Hubungkan ke akun login jika pengurus ini punya akun di sistem.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Periode Mulai</Label>
          <Input type="date" value={form.active_period_start} onChange={e => setForm(p => ({ ...p, active_period_start: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Periode Selesai</Label>
          <Input type="date" value={form.active_period_end} onChange={e => setForm(p => ({ ...p, active_period_end: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <select value={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.value }))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Batal</Button>
        <Button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  )
}
