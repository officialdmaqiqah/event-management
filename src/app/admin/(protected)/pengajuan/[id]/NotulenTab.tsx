"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TimeInput } from "@/components/ui/time-input"

import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MeetingMinutes, MeetingActionItem } from "@/types/notulen"
import { FileText, Save, CheckCircle, Plus, Trash2, Globe, Lock, ShieldAlert, EyeOff } from "lucide-react"
import { 
  fetchMeetingMinutesAction, 
  saveMeetingMinutesAction, 
  togglePublishAction, 
  addActionItemAction, 
  deleteActionItemAction 
} from "@/app/actions/panitiaActions"

export default function NotulenTab({ 
  pengajuanId, 
  pengajuanData,
  isGuest = false,
  eventId
}: { 
  pengajuanId?: string, 
  pengajuanData?: any,
  isGuest?: boolean,
  eventId?: string
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notulen, setNotulen] = useState<MeetingMinutes | null>(null)
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([])

  // Form State
  const [form, setForm] = useState<Partial<MeetingMinutes>>({
    meeting_title: pengajuanData?.nama_event || pengajuanData?.title || "",
    meeting_type: pengajuanData?.jenis_event || "",
    meeting_date: pengajuanData?.tanggal_mulai || pengajuanData?.start_datetime 
      ? new Date(pengajuanData.tanggal_mulai || pengajuanData.start_datetime).toISOString().split('T')[0] 
      : "",
    start_time: pengajuanData?.tanggal_mulai || pengajuanData?.start_datetime 
      ? new Date(pengajuanData.tanggal_mulai || pengajuanData.start_datetime).toTimeString().substring(0,5) 
      : "",
    end_time: pengajuanData?.tanggal_selesai || pengajuanData?.end_datetime 
      ? new Date(pengajuanData.tanggal_selesai || pengajuanData.end_datetime).toTimeString().substring(0,5) 
      : "",
    location: Array.isArray(pengajuanData?.area_fasilitas) 
      ? pengajuanData.area_fasilitas.join(", ") 
      : (pengajuanData?.location || ""),
    chairperson_name: pengajuanData?.nama_pemohon || "",
    secretary_name: "",
    agenda: pengajuanData?.deskripsi_kegiatan || pengajuanData?.description || "",
    discussion_summary: "",
    decisions: "",
    important_notes: "",
    status: 'draft',
    privacy_level: 'internal',
    is_published: false
  })

  useEffect(() => {
    fetchNotulen()
  }, [pengajuanId, eventId])

  const fetchNotulen = async () => {
    setLoading(true)
    if (isGuest && eventId) {
      const res = await fetchMeetingMinutesAction(eventId)
      if (res.error) {
        console.error("Gagal memuat notulen:", res.error)
      } else {
        if (res.minutes) {
          setNotulen(res.minutes)
          setForm(res.minutes)
        } else {
          // Initialize defaults
          setForm({
            meeting_title: pengajuanData?.nama_event || pengajuanData?.title || "",
            meeting_type: pengajuanData?.jenis_event || "",
            meeting_date: pengajuanData?.tanggal_mulai || pengajuanData?.start_datetime 
              ? new Date(pengajuanData.tanggal_mulai || pengajuanData.start_datetime).toISOString().split('T')[0] 
              : "",
            start_time: pengajuanData?.tanggal_mulai || pengajuanData?.start_datetime 
              ? new Date(pengajuanData.tanggal_mulai || pengajuanData.start_datetime).toTimeString().substring(0,5) 
              : "",
            end_time: pengajuanData?.tanggal_selesai || pengajuanData?.end_datetime 
              ? new Date(pengajuanData.tanggal_selesai || pengajuanData.end_datetime).toTimeString().substring(0,5) 
              : "",
            location: Array.isArray(pengajuanData?.area_fasilitas) 
              ? pengajuanData.area_fasilitas.join(", ") 
              : (pengajuanData?.location || ""),
            chairperson_name: pengajuanData?.nama_pemohon || "",
            secretary_name: "",
            agenda: pengajuanData?.deskripsi_kegiatan || pengajuanData?.description || "",
            discussion_summary: "",
            decisions: "",
            important_notes: "",
            status: 'draft',
            privacy_level: 'internal',
            is_published: false
          })
        }
        if (res.actionItems) {
          setActionItems(res.actionItems)
        }
      }
    } else if (pengajuanId) {
      const { data: mnData } = await supabase
        .from("meeting_minutes")
        .select("*")
        .eq("pengajuan_id", pengajuanId)
        .maybeSingle()

      if (mnData) {
        setNotulen(mnData)
        setForm(mnData)
        
        const { data: aiData } = await supabase
          .from("meeting_action_items")
          .select("*")
          .eq("meeting_minutes_id", mnData.id)
          .order("created_at", { ascending: true })
          
        if (aiData) setActionItems(aiData)
      } else {
        setForm({
          meeting_title: pengajuanData?.nama_event || "",
          meeting_type: pengajuanData?.jenis_event || "",
          meeting_date: pengajuanData?.tanggal_mulai ? new Date(pengajuanData.tanggal_mulai).toISOString().split('T')[0] : "",
          start_time: pengajuanData?.tanggal_mulai ? new Date(pengajuanData.tanggal_mulai).toTimeString().substring(0,5) : "",
          end_time: pengajuanData?.tanggal_selesai ? new Date(pengajuanData.tanggal_selesai).toTimeString().substring(0,5) : "",
          location: pengajuanData?.area_fasilitas?.join(", ") || "",
          chairperson_name: pengajuanData?.nama_pemohon || "",
          secretary_name: "",
          agenda: pengajuanData?.deskripsi_kegiatan || "",
          discussion_summary: "",
          decisions: "",
          important_notes: "",
          status: 'draft',
          privacy_level: 'internal',
          is_published: false
        })
      }
    }
    setLoading(false)
  }

  const handleSave = async (isFinal: boolean = false) => {
    setSaving(true)
    if (isGuest && eventId) {
      const res = await saveMeetingMinutesAction(eventId, form, isFinal)
      if (res.error) {
        alert("Gagal menyimpan: " + res.error)
      } else if (res.minutes) {
        setNotulen(res.minutes)
        setForm(res.minutes)
        alert(isFinal ? "Laporan difinalisasi!" : "Draft berhasil disimpan.")
      }
    } else {
      const payload = {
        pengajuan_id: pengajuanId,
        ...form,
        status: isFinal ? 'finalized' : 'draft',
        updated_at: new Date().toISOString()
      }

      if (notulen?.id) {
        const { error } = await supabase.from("meeting_minutes").update(payload).eq("id", notulen.id)
        if (!error) {
          setNotulen({ ...notulen, ...payload } as MeetingMinutes)
          alert(isFinal ? "Laporan difinalisasi!" : "Draft berhasil disimpan.")
        } else {
          alert("Gagal memperbarui draft.")
        }
      } else {
        const { data, error } = await supabase.from("meeting_minutes").insert(payload).select().single()
        if (data) {
          setNotulen(data)
          alert("Draft notulen berhasil dibuat.")
        } else {
          alert("Gagal membuat draft.")
        }
      }
    }
    setSaving(false)
  }

  const handlePublishToggle = async () => {
    if (!notulen?.id) return
    if (notulen.status !== 'finalized') return alert("Laporan harus difinalisasi terlebih dahulu sebelum bisa di-publish.")
    if (form.privacy_level !== 'public') return alert("Tingkat privasi harus diatur ke 'Publik' untuk mem-publish laporan ke website umum.")
    
    setSaving(true)
    const newPublishStatus = !form.is_published

    if (isGuest && eventId) {
      const res = await togglePublishAction(eventId, notulen.id, newPublishStatus)
      if (res.error) {
        alert("Gagal memperbarui status publikasi: " + res.error)
      } else if (res.minutes) {
        setNotulen(res.minutes)
        setForm(res.minutes)
        alert(newPublishStatus ? "Laporan berhasil dipublikasikan ke publik!" : "Laporan ditarik dari publik (Unpublished).")
      }
    } else {
      const payload = {
        is_published: newPublishStatus,
        published_at: newPublishStatus ? new Date().toISOString() : null
      }

      const { error } = await supabase.from("meeting_minutes").update(payload).eq("id", notulen.id)
      if (!error) {
        setNotulen({ ...notulen, ...payload } as MeetingMinutes)
        setForm({ ...form, ...payload })
        alert(newPublishStatus ? "Laporan berhasil dipublikasikan ke publik!" : "Laporan ditarik dari publik (Unpublished).")
      } else {
        alert("Gagal memperbarui status publikasi.")
      }
    }
    setSaving(false)
  }

  // Action Items State
  const [newAi, setNewAi] = useState({ description: "", assignee_name: "", deadline: "", status: 'pending', notes: "" })
  const [addingAi, setAddingAi] = useState(false)

  const handleAddActionItem = async () => {
    if (!notulen?.id) return alert("Simpan draft notulen terlebih dahulu sebelum menambah Action Item!")
    
    setAddingAi(true)
    if (isGuest && eventId) {
      const res = await addActionItemAction(eventId, notulen.id, newAi)
      if (res.error) {
        alert("Gagal menambah Action Item: " + res.error)
      } else if (res.actionItem) {
        setActionItems([...actionItems, res.actionItem])
        setNewAi({ description: "", assignee_name: "", deadline: "", status: 'pending', notes: "" })
      }
    } else {
      const { data, error } = await supabase.from("meeting_action_items").insert({
        meeting_minutes_id: notulen.id,
        ...newAi
      }).select().single()

      if (data) {
        setActionItems([...actionItems, data])
        setNewAi({ description: "", assignee_name: "", deadline: "", status: 'pending', notes: "" })
      } else {
        alert("Gagal menambah Action Item.")
      }
    }
    setAddingAi(false)
  }

  const handleDeleteAi = async (id: string) => {
    if (confirm("Hapus action item ini?")) {
      if (isGuest && eventId) {
        const res = await deleteActionItemAction(eventId, id)
        if (res.error) {
          alert("Gagal menghapus: " + res.error)
        } else {
          setActionItems(actionItems.filter(ai => ai.id !== id))
        }
      } else {
        const { error } = await supabase.from("meeting_action_items").delete().eq("id", id)
        if (!error) {
          setActionItems(actionItems.filter(ai => ai.id !== id))
        } else {
          alert("Gagal menghapus Action Item.")
        }
      }
    }
  }

  const isFinalized = notulen?.status === 'finalized'

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat Notulen...</div>

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-indigo-600" /> Informasi & Hasil Rapat
              </CardTitle>
              <CardDescription className="text-xs">Catat hasil diskusi dan keputusan rapat secara lengkap.</CardDescription>
            </div>
            {isFinalized && (
              <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Finalized
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Privacy & Publish Section */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="space-y-1.5 flex-1 w-full">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                Privasi Hasil Rapat
              </Label>
              <select 
                disabled={isFinalized}
                className="w-full text-xs border border-slate-300 rounded-md p-2 bg-white"
                value={form.privacy_level || 'internal'}
                onChange={e => setForm({...form, privacy_level: e.target.value as any})}
              >
                <option value="public">🌍 Publik (Tampil di website publik)</option>
                <option value="internal">🏢 Internal (Hanya user MAKT)</option>
                <option value="restricted">🛡️ Terbatas (Role/Jabatan tertentu saja)</option>
                <option value="confidential">🔒 Rahasia (Hanya Super Admin)</option>
              </select>
            </div>
            
            <div className="flex-shrink-0 pt-2 md:pt-0">
              {isFinalized && form.privacy_level === 'public' && (
                <Button 
                  onClick={handlePublishToggle}
                  disabled={saving}
                  variant={form.is_published ? "destructive" : "default"} 
                  className={`h-9 text-xs font-bold ${form.is_published ? '' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  <Globe className="h-3.5 w-3.5 mr-1.5" /> 
                  {form.is_published ? "Tarik dari Publik (Unpublish)" : "Publish ke Publik"}
                </Button>
              )}
            </div>
          </div>

          {form.privacy_level === 'restricted' && !isFinalized && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong>Akses Terbatas:</strong> Anda akan dapat memilih Jabatan atau User yang diizinkan mengakses laporan ini melalui pengaturan Lanjutan setelah form ini disimpan.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Judul Rapat</Label>
              <Input disabled={isFinalized} value={form.meeting_title || ""} onChange={e => setForm({...form, meeting_title: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Jenis Rapat</Label>
              <Input disabled={isFinalized} value={form.meeting_type || ""} onChange={e => setForm({...form, meeting_type: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Tanggal Rapat</Label>
              <Input type="date" disabled={isFinalized} value={form.meeting_date || ""} onChange={e => setForm({...form, meeting_date: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Jam Mulai</Label>
                <TimeInput disabled={isFinalized} value={form.start_time || ""} onChange={e => setForm({...form, start_time: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Jam Selesai</Label>
                <TimeInput disabled={isFinalized} value={form.end_time || ""} onChange={e => setForm({...form, end_time: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Pimpinan Rapat</Label>
              <Input disabled={isFinalized} value={form.chairperson_name || ""} onChange={e => setForm({...form, chairperson_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Sekretaris / Notulis</Label>
              <Input disabled={isFinalized} value={form.secretary_name || ""} onChange={e => setForm({...form, secretary_name: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Agenda Rapat</Label>
              <textarea disabled={isFinalized} className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50" value={form.agenda || ""} onChange={e => setForm({...form, agenda: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Ringkasan Pembahasan</Label>
              <textarea disabled={isFinalized} className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50" value={form.discussion_summary || ""} onChange={e => setForm({...form, discussion_summary: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Keputusan Rapat</Label>
              <textarea disabled={isFinalized} className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50" value={form.decisions || ""} onChange={e => setForm({...form, decisions: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Catatan Penting (Opsional)</Label>
              <textarea disabled={isFinalized} className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50" value={form.important_notes || ""} onChange={e => setForm({...form, important_notes: e.target.value})} />
            </div>
          </div>

          {!isFinalized && (
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold h-10">
                <Save className="h-4 w-4 mr-2" /> Simpan Draft
              </Button>
              <Button onClick={() => { if(confirm("Yakin finalisasi? Setelah ini notulen tidak dapat diedit.")) handleSave(true) }} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white font-bold h-10">
                <CheckCircle className="h-4 w-4 mr-2" /> Finalisasi Laporan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items Section */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">Tindak Lanjut / Action Items</CardTitle>
          <CardDescription className="text-xs">Daftar tugas yang harus diselesaikan pasca rapat.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 text-xs">
                <TableHead>Deskripsi Tugas</TableHead>
                <TableHead>Penanggung Jawab</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                {!isFinalized && <TableHead className="w-[80px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionItems.map(ai => (
                <TableRow key={ai.id} className="text-xs">
                  <TableCell className="font-medium text-slate-700">{ai.description}</TableCell>
                  <TableCell>{ai.assignee_name || '-'}</TableCell>
                  <TableCell>{ai.deadline || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${ai.status==='done' ? 'bg-green-100 text-green-700' : ai.status==='in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {ai.status.replace("_", " ").toUpperCase()}
                    </span>
                  </TableCell>
                  {!isFinalized && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleDeleteAi(ai.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {actionItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-400 text-xs">Belum ada action items.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {!isFinalized && notulen?.id && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Tambah Action Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input className="sm:col-span-2 text-xs h-9" placeholder="Deskripsi Tugas..." value={newAi.description} onChange={e => setNewAi({...newAi, description: e.target.value})} />
                <Input className="text-xs h-9" placeholder="Penanggung Jawab..." value={newAi.assignee_name} onChange={e => setNewAi({...newAi, assignee_name: e.target.value})} />
                <Input type="date" className="text-xs h-9" value={newAi.deadline} onChange={e => setNewAi({...newAi, deadline: e.target.value})} />
              </div>
              <div className="flex justify-end">
                <Button disabled={!newAi.description || addingAi} onClick={handleAddActionItem} className="h-8 text-xs font-semibold bg-slate-800 hover:bg-slate-900">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
