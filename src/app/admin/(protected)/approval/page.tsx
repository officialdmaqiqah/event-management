"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Calendar, Clock, MapPin, Eye, ShieldCheck, AlertCircle, HelpCircle, User, Award } from "lucide-react"

type Pengajuan = {
  id: string
  nomor_pengajuan: string
  status: 'draft' | 'submitted' | 'under_review' | 'revision_requested' | 'approved' | 'rejected' | 'cancelled'
  tipe_pemohon: string
  nama_pemohon: string
  nama_lembaga: string | null
  nama_event: string
  jenis_event: string
  tanggal_mulai: string
  tanggal_selesai: string
  area_fasilitas: string[]
  current_approval_level: number
  created_at: string
}

type WorkflowStep = {
  jenis_event_id: string
  level: number
  jabatan: string
  user_id: string | null
}

type JenisEvent = {
  id: string
  name: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
    hour12: false
  }).format(d).replace(/\./g, ':')
}

export default function PejabatApprovalPage() {
  const supabase = createClient()
  
  const [pendingApprovals, setPendingApprovals] = useState<{ pengajuan: Pengajuan; step: WorkflowStep }[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      // 1. Get logged-in user and profile
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) {
        setErrorMsg("Sesi berakhir. Silakan login kembali.")
        setLoading(false)
        return
      }

      const { data: prof, error: profError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (profError) throw profError
      setProfile(prof)

      const isSuperAdmin = prof?.system_role === 'super_admin' || prof?.system_role === 'admin_makt' || user.email === 'officialsiyoyok@gmail.com' || user.email === 'yahya@example.com'

      // 2. Fetch all pending loan applications (submitted, under_review, revision_requested)
      const { data: pList, error: pError } = await supabase
        .from("pengajuan_peminjaman")
        .select("*")
        .in("status", ["submitted", "under_review", "revision_requested"])
        .order("created_at", { ascending: true })

      if (pError) throw pError

      // 3. Fetch all active workflows
      const { data: wList, error: wError } = await supabase
        .from("workflow_approval")
        .select("*")
        .eq("is_active", true)

      if (wError) throw wError

      // 4. Fetch all active event types
      const { data: eList, error: eError } = await supabase
        .from("jenis_event")
        .select("id, name")

      if (eError) throw eError

      // 5. Match and filter workflows for this user
      const matched: { pengajuan: Pengajuan; step: WorkflowStep }[] = []

      for (const p of (pList || []) as Pengajuan[]) {
        // Find matching jenis_event
        const jEvent = (eList || []).find((e: JenisEvent) => e.name.toLowerCase() === p.jenis_event.toLowerCase())
        if (!jEvent) continue

        // Find matching workflow step for the current level
        const activeStep = (wList || []).find((w: WorkflowStep) => 
          w.jenis_event_id === jEvent.id && 
          w.level === p.current_approval_level
        )

        if (!activeStep) continue

        // Check if user is authorized to approve this step:
        // A. User is Superadmin (override)
        // B. User's profile jabatan matches step's jabatan AND (step's user_id is null OR matches user's id)
        const matchesJabatan = prof.jabatan && prof.jabatan.trim().toLowerCase() === activeStep.jabatan.trim().toLowerCase()
        const matchesUserId = !activeStep.user_id || activeStep.user_id === user.id
        const isAuthorized = isSuperAdmin || (matchesJabatan && matchesUserId)

        if (isAuthorized) {
          matched.push({
            pengajuan: p,
            step: activeStep
          })
        }
      }

      setPendingApprovals(matched)

    } catch (err: any) {
      console.error(err)
      setErrorMsg("Gagal memuat persetujuan tertunda.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-600" />
            Persetujuan Peminjaman
          </h1>
          <p className="text-sm text-slate-500">Tinjau dan proses pengajuan peminjaman fasilitas yang menunggu persetujuan Anda</p>
        </div>
        
        {profile?.jabatan && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex items-center gap-2 self-start sm:self-center">
            <Award className="h-5 w-5 text-indigo-600" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Jabatan Anda</span>
              <span className="text-xs font-bold text-indigo-950 capitalize">{profile.jabatan}</span>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <Card className="border-red-100 bg-red-50 text-red-950 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-sm">{errorMsg}</span>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <ShieldCheck className="h-12 w-12 text-slate-350 mx-auto mb-3" />
              <p className="font-bold text-slate-800 text-sm">Tidak Ada Persetujuan Tertunda</p>
              <p className="text-xs mt-1">Luar biasa! Semua pengajuan pada tingkatan jabatan Anda telah selesai diproses.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    <TableHead className="w-[180px] font-bold text-xs uppercase text-slate-500">Nomor Pengajuan</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Pemohon</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Event / Kegiatan</TableHead>
                    <TableHead className="w-[180px] font-bold text-xs uppercase text-slate-500">Tingkat Approval</TableHead>
                    <TableHead className="w-[100px] text-right font-bold text-xs uppercase text-slate-500 pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map(({ pengajuan: item, step }) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono font-bold text-slate-900 text-sm tracking-tight">
                        {item.nomor_pengajuan}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800">{item.nama_pemohon}</div>
                        {item.nama_lembaga && (
                          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">{item.nama_lembaga}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-indigo-950">{item.nama_event}</div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{item.area_fasilitas.join(", ")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100/70 w-fit">
                            Level {step.level}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                            Jabatan: {step.jabatan}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Link href={`/admin/pengajuan/${item.id}`}>
                          <Button size="sm" className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
                            <Eye className="h-3.5 w-3.5 mr-1" /> Tinjau
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
