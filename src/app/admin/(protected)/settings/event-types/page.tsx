"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"
import Link from "next/link"
import { 
  Settings, Plus, Trash2, Edit2, Layers, ShieldCheck, Check, 
  X, HelpCircle, Save, ArrowLeft, ArrowRight, User 
} from "lucide-react"

type JenisEvent = {
  id: string
  name: string
  is_active: boolean
  default_privacy: 'detail_publik' | 'umum_saja' | 'rahasia'
  needs_approval: boolean
  enable_notulen: boolean
  enable_absensi: boolean
  created_at: string
}

type WorkflowStep = {
  id: string
  jenis_event_id: string
  level: number
  jabatan: string
  user_id: string | null
  is_mandatory: boolean
  is_active: boolean
}

type UserProfile = {
  user_id: string
  email: string
  full_name: string | null
  jabatan: string | null
}

export default function EventTypesSettingsPage() {
  const supabase = createClient()
  
  // Data lists
  const [eventTypes, setEventTypes] = useState<JenisEvent[]>([])
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  
  const [selectedType, setSelectedType] = useState<JenisEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Form states for Event Type Edit/Create
  const [isEditingType, setIsEditingType] = useState(false)
  const [typeForm, setTypeForm] = useState({
    id: "",
    name: "",
    is_active: true,
    default_privacy: "umum_saja" as 'detail_publik' | 'umum_saja' | 'rahasia',
    needs_approval: true,
    enable_notulen: false,
    enable_absensi: true
  })

  // Form states for Workflow Step
  const [isAddingStep, setIsAddingStep] = useState(false)
  const [stepForm, setStepForm] = useState({
    level: 1,
    jabatan: "",
    user_id: "" as string,
    is_mandatory: true
  })

  // Dialog State
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean; type: DialogType; title: string; message: string; onConfirm?: () => void;
  }>({ isOpen: false, type: 'alert', title: '', message: '' })

  const showDialog = (type: DialogType, title: string, message: string, onConfirm?: () => void) => {
    setDialogState({ isOpen: true, type, title, message, onConfirm })
  }
  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }))

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedType) {
      fetchWorkflowSteps(selectedType.id)
    } else {
      setWorkflowSteps([])
    }
  }, [selectedType])

  const fetchInitialData = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      // Fetch Event Types
      const { data: types, error: typesError } = await supabase
        .from("jenis_event")
        .select("*")
        .order("name", { ascending: true })
      
      if (typesError) throw typesError
      setEventTypes(types || [])

      // Fetch User Profiles (for assigning specific approvers)
      const { data: profileList, error: profilesError } = await supabase
        .from("user_profiles")
        .select("user_id, email, full_name, jabatan")
        .eq("is_approved", true)
        .order("full_name", { ascending: true })

      if (profilesError) throw profilesError
      setUsers(profileList || [])

    } catch (err: any) {
      console.error(err)
      setErrorMsg("Gagal memuat data konfigurasi.")
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkflowSteps = async (typeId: string) => {
    try {
      const { data: steps, error } = await supabase
        .from("workflow_approval")
        .select("*")
        .eq("jenis_event_id", typeId)
        .order("level", { ascending: true })

      if (error) throw error
      setWorkflowSteps(steps || [])
    } catch (err: any) {
      console.error(err)
      showDialog('error', 'Gagal', 'Gagal memuat tahapan approval: ' + err.message)
    }
  }

  // Handle Event Type CRUD
  const openCreateTypeModal = () => {
    setTypeForm({
      id: "",
      name: "",
      is_active: true,
      default_privacy: "umum_saja",
      needs_approval: true,
      enable_notulen: false,
      enable_absensi: true
    })
    setIsEditingType(true)
  }

  const openEditTypeModal = (type: JenisEvent) => {
    setTypeForm({
      id: type.id,
      name: type.name,
      is_active: type.is_active,
      default_privacy: type.default_privacy,
      needs_approval: type.needs_approval,
      enable_notulen: type.enable_notulen,
      enable_absensi: type.enable_absensi
    })
    setIsEditingType(true)
  }

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeForm.name.trim()) return

    setSaving(true)
    try {
      if (typeForm.id) {
        // Edit Mode
        const { error } = await supabase
          .from("jenis_event")
          .update({
            name: typeForm.name.trim(),
            is_active: typeForm.is_active,
            default_privacy: typeForm.default_privacy,
            needs_approval: typeForm.needs_approval,
            enable_notulen: typeForm.enable_notulen,
            enable_absensi: typeForm.enable_absensi
          })
          .eq("id", typeForm.id)

        if (error) throw error
        showDialog('success', 'Berhasil', 'Jenis event berhasil diperbarui.')
      } else {
        // Create Mode
        const { error } = await supabase
          .from("jenis_event")
          .insert({
            name: typeForm.name.trim(),
            is_active: typeForm.is_active,
            default_privacy: typeForm.default_privacy,
            needs_approval: typeForm.needs_approval,
            enable_notulen: typeForm.enable_notulen,
            enable_absensi: typeForm.enable_absensi
          })

        if (error) throw error
        showDialog('success', 'Berhasil', 'Jenis event baru berhasil ditambahkan.')
      }

      setIsEditingType(false)
      fetchInitialData()
      setSelectedType(null)
    } catch (err: any) {
      console.error(err)
      showDialog('error', 'Gagal Menyimpan', err.message || 'Terjadi kesalahan.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteType = (typeId: string, typeName: string) => {
    showDialog('confirm', 'Hapus Jenis Event', `Apakah Anda yakin ingin menghapus jenis event "${typeName}"? Semua konfigurasi workflow approval jenis event ini juga akan terhapus.`, () => executeDeleteType(typeId))
  }

  const executeDeleteType = async (typeId: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("jenis_event")
        .delete()
        .eq("id", typeId)

      if (error) throw error
      showDialog('success', 'Berhasil', 'Jenis event berhasil dihapus.')
      setSelectedType(null)
      fetchInitialData()
    } catch (err: any) {
      console.error(err)
      showDialog('error', 'Gagal Menghapus', err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle Workflow Step CRUD
  const openAddStepForm = () => {
    if (!selectedType) return
    
    // Auto-resolve next level number
    const nextLevel = workflowSteps.length > 0 
      ? Math.max(...workflowSteps.map(s => s.level)) + 1 
      : 1

    setStepForm({
      level: nextLevel,
      jabatan: "",
      user_id: "",
      is_mandatory: true
    })
    setIsAddingStep(true)
  }

  const handleSaveStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !stepForm.jabatan.trim()) return

    setSaving(true)
    try {
      const payload = {
        jenis_event_id: selectedType.id,
        level: stepForm.level,
        jabatan: stepForm.jabatan.trim(),
        user_id: stepForm.user_id || null,
        is_mandatory: stepForm.is_mandatory,
        is_active: true
      }

      const { error } = await supabase
        .from("workflow_approval")
        .insert(payload)

      if (error) throw error
      showDialog('success', 'Berhasil', 'Level approval berhasil ditambahkan.')
      setIsAddingStep(false)
      fetchWorkflowSteps(selectedType.id)
    } catch (err: any) {
      console.error(err)
      showDialog('error', 'Gagal Menambah', err.message || 'Kemungkinan level/urutan ini sudah ada.')
    } finally {
      setSaving(false)
    }
  }

  const executeDeleteStep = async (stepId: string) => {
    if (!selectedType) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("workflow_approval")
        .delete()
        .eq("id", stepId)

      if (error) throw error
      showDialog('success', 'Berhasil', 'Tahap approval berhasil dihapus.')
      fetchWorkflowSteps(selectedType.id)
    } catch (err: any) {
      console.error(err)
      showDialog('error', 'Gagal Menghapus', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation and Title */}
      <div className="flex items-center gap-2.5">
        <Link href="/admin/settings">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan Jenis Event & Workflow</h1>
          <p className="text-xs sm:text-sm text-slate-500">Kelola daftar klasifikasi event beserta mekanisme approval berjenjangnya</p>
        </div>
      </div>

      {errorMsg && (
        <Card className="border-red-100 bg-red-50 text-red-950 p-4">
          <p className="text-sm font-semibold">{errorMsg}</p>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Grid: Event Types List (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Daftar Klasifikasi Event</CardTitle>
                <CardDescription className="text-xs">Klik salah satu baris untuk mengonfigurasi workflow approval</CardDescription>
              </div>
              <Button size="sm" onClick={openCreateTypeModal} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-xs gap-1 font-semibold">
                <Plus className="h-4 w-4" /> Tambah Jenis
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
                </div>
              ) : eventTypes.length === 0 ? (
                <p className="text-slate-400 text-center py-12 text-sm">Belum ada jenis event di database.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/75">
                      <TableRow>
                        <TableHead className="font-semibold text-xs text-slate-500 uppercase">Nama Jenis</TableHead>
                        <TableHead className="w-[100px] font-semibold text-xs text-slate-500 uppercase text-center">Approval</TableHead>
                        <TableHead className="w-[100px] font-semibold text-xs text-slate-500 uppercase text-center">Status</TableHead>
                        <TableHead className="w-[120px] font-semibold text-xs text-slate-500 uppercase text-right pr-6">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventTypes.map((type) => {
                        const isSelected = selectedType?.id === type.id
                        return (
                          <TableRow 
                            key={type.id} 
                            onClick={() => setSelectedType(type)}
                            className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${
                              isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''
                            }`}
                          >
                            <TableCell className="font-semibold text-slate-800">
                              {type.name}
                              <div className="text-[10px] text-slate-400 font-normal uppercase tracking-wider mt-0.5">
                                Privacy: {type.default_privacy.replace('_', ' ')}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {type.needs_approval ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">Wajib</span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">Auto-Pass</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {type.is_active ? (
                                <span className="inline-flex items-center text-green-600 font-bold text-xs"><Check className="h-4 w-4 mr-0.5" /> Aktif</span>
                              ) : (
                                <span className="inline-flex items-center text-slate-400 font-medium text-xs"><X className="h-4 w-4 mr-0.5" /> Nonaktif</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                  onClick={() => openEditTypeModal(type)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => confirmDeleteType(type.id, type.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Grid: Selected Type Workflow configuration (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedType ? (
            <Card className="border border-indigo-200 shadow-md bg-white overflow-hidden animate-fadeIn">
              <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Workflow Approval</span>
                  <h3 className="font-bold text-indigo-950 truncate text-base">{selectedType.name}</h3>
                </div>
                {selectedType.needs_approval ? (
                  <Button size="sm" onClick={openAddStepForm} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold gap-1">
                    <Plus className="h-4 w-4" /> Tambah Level
                  </Button>
                ) : null}
              </div>
              <CardContent className="p-5">
                {!selectedType.needs_approval ? (
                  <div className="p-6 text-center bg-green-50/40 rounded-xl border border-green-100/50 text-green-800 text-xs font-medium">
                    <ShieldCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    Jenis event ini diatur untuk "Auto-Pass" (tidak membutuhkan approval). 
                    Pengajuan akan langsung disetujui setelah disubmit pemohon.
                  </div>
                ) : workflowSteps.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <Layers className="h-10 w-10 text-slate-300 mx-auto" />
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">Belum Ada Workflow Approval</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Silakan klik "Tambah Level" di atas untuk menambahkan tingkat persetujuan.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-indigo-100 space-y-5 ml-2">
                    {workflowSteps.map((step) => {
                      const userObj = users.find(u => u.user_id === step.user_id)
                      return (
                        <div key={step.id} className="relative">
                          {/* Indicator Level dot */}
                          <span className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white ring-2 ring-indigo-50">
                            {step.level}
                          </span>

                          <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors">
                            <div className="min-w-0 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approver Jabatan:</span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">{step.jabatan}</span>
                              {userObj && (
                                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                  <User className="h-3 w-3 text-slate-400" />
                                  Khusus: {userObj.full_name || userObj.email}
                                </span>
                              )}
                              <div className="pt-1">
                                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 bg-slate-200/60 text-slate-600 rounded`}>
                                  {step.is_mandatory ? "Wajib" : "Opsional"}
                                </span>
                              </div>
                            </div>

                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              onClick={() => executeDeleteStep(step.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200 bg-slate-50/50 p-8 text-center text-slate-400 h-full flex flex-col items-center justify-center min-h-[200px]">
              <Layers className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700 text-xs">Konfigurasi Workflow Approval</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[250px]">Pilih salah satu klasifikasi event di sebelah kiri untuk melihat dan menyusun workflow approval berjenjang.</p>
            </Card>
          )}
        </div>

      </div>

      {/* ================= MODAL EDIT/TAMBAH EVENT TYPE ================= */}
      {isEditingType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-0 bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Settings className="h-4.5 w-4.5 text-indigo-600" />
                {typeForm.id ? "Edit Jenis Event" : "Tambah Jenis Event Baru"}
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSaveType}>
              <CardContent className="space-y-4 pt-5">
                {/* Nama */}
                <div className="space-y-1.5">
                  <Label htmlFor="type-name" className="text-xs font-semibold text-slate-700">Nama Jenis Event *</Label>
                  <Input 
                    id="type-name" 
                    value={typeForm.name} 
                    onChange={e => setTypeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Rapat Pengurus, Kajian Akbar"
                    required
                  />
                </div>

                {/* Default Privacy */}
                <div className="space-y-1.5">
                  <Label htmlFor="default-privacy" className="text-xs font-semibold text-slate-700">Default Privasi Kalender</Label>
                  <select
                    id="default-privacy"
                    value={typeForm.default_privacy}
                    onChange={e => setTypeForm(prev => ({ ...prev, default_privacy: e.target.value as any }))}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="detail_publik">Detail Publik (Tampil Penuh)</option>
                    <option value="umum_saja">Umum Saja (Tampil Anonim)</option>
                    <option value="rahasia">Rahasia (Hanya Admin)</option>
                  </select>
                </div>

                {/* Needs Approval Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Butuh Approval?</Label>
                    <p className="text-[10px] text-slate-400">Peminjaman harus disetujui pejabat</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={typeForm.needs_approval} 
                    onChange={e => setTypeForm(prev => ({ ...prev, needs_approval: e.target.checked }))}
                    className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>

                {/* Enable Notulen Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Fitur Notulen</Label>
                    <p className="text-[10px] text-slate-400">Aktifkan pencatatan notulen rapat</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={typeForm.enable_notulen} 
                    onChange={e => setTypeForm(prev => ({ ...prev, enable_notulen: e.target.checked }))}
                    className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>

                {/* Enable Absensi Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Fitur Absensi</Label>
                    <p className="text-[10px] text-slate-400">Aktifkan pendaftaran & QR check-in</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={typeForm.enable_absensi} 
                    onChange={e => setTypeForm(prev => ({ ...prev, enable_absensi: e.target.checked }))}
                    className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>

                {/* Active status */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Status Aktif</Label>
                    <p className="text-[10px] text-slate-400">Tampilkan jenis event di form pengajuan</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={typeForm.is_active} 
                    onChange={e => setTypeForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100 text-xs">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingType(false)}>Batal</Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                  {saving ? "Menyimpan..." : "Simpan Jenis Event"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ================= MODAL TAMBAH WORKFLOW STEP ================= */}
      {isAddingStep && selectedType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-0 bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-indigo-600" />
                Tambah Tingkatan Approval - {selectedType.name}
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSaveStep}>
              <CardContent className="space-y-4 pt-5">
                {/* Level / Order */}
                <div className="space-y-1.5">
                  <Label htmlFor="step-level" className="text-xs font-semibold text-slate-700">Urutan / Level Approval *</Label>
                  <Input 
                    id="step-level" 
                    type="number"
                    min="1"
                    value={stepForm.level} 
                    onChange={e => setStepForm(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>

                {/* Jabatan Approver */}
                <div className="space-y-1.5">
                  <Label htmlFor="step-jabatan" className="text-xs font-semibold text-slate-700">Jabatan Penyetuju *</Label>
                  <Input 
                    id="step-jabatan" 
                    value={stepForm.jabatan} 
                    onChange={e => setStepForm(prev => ({ ...prev, jabatan: e.target.value }))}
                    placeholder="Contoh: Sekretaris, Ketua, Kepala Divisi"
                    required
                  />
                  <p className="text-[10px] text-slate-400">Pengguna dengan Jabatan yang sama pada profilnya yang akan dapat menyetujui level ini.</p>
                </div>

                {/* Specific User Approver (Optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="step-user" className="text-xs font-semibold text-slate-700">Pengguna Spesifik (Opsional)</Label>
                  <select
                    id="step-user"
                    value={stepForm.user_id}
                    onChange={e => setStepForm(prev => ({ ...prev, user_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Semua Pengguna Dengan Jabatan Diatas --</option>
                    {users.map(u => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.full_name || u.email} {u.jabatan ? `(${u.jabatan})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mandatory Checkbox */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <Label className="text-xs font-bold text-slate-800">Level Wajib?</Label>
                    <p className="text-[10px] text-slate-400">Mencegah pelewatan tingkatan approval</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={stepForm.is_mandatory} 
                    onChange={e => setStepForm(prev => ({ ...prev, is_mandatory: e.target.checked }))}
                    className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-4 border-t border-slate-100 text-xs">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingStep(false)}>Batal</Button>
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                  {saving ? "Menyimpan..." : "Tambah Level"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Main Dialog */}
      <CustomDialog 
        isOpen={dialogState.isOpen} 
        type={dialogState.type} 
        title={dialogState.title} 
        message={dialogState.message} 
        onCancel={closeDialog} 
        onConfirm={() => { closeDialog(); dialogState.onConfirm?.(); }} 
      />
    </div>
  )
}
