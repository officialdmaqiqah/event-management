"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Calendar, Search, ArrowLeft, Clock, MapPin, AlertCircle, FileText, CheckCircle, HelpCircle, XCircle } from "lucide-react"

type Pengajuan = {
  id: string
  nomor_pengajuan: string
  status: 'draft' | 'submitted' | 'under_review' | 'revision_requested' | 'approved' | 'rejected' | 'cancelled'
  tipe_pemohon: string
  nama_pemohon: string
  nama_lembaga: string | null
  whatsapp: string
  email: string
  alamat: string
  nama_event: string
  jenis_event: string
  tujuan_peminjaman: string
  deskripsi_kegiatan: string
  estimasi_peserta: number
  tanggal_mulai: string
  tanggal_selesai: string
  area_fasilitas: string[]
  kebutuhan_tambahan: string | null
  url_surat_peminjaman: string | null
  url_proposal: string | null
  catatan_tambahan: string | null
  catatan_admin: string | null
  created_at: string
}

type TimelineItem = {
  id: string
  status_lama: string | null
  status_baru: string
  catatan: string | null
  dibuat_oleh_nama: string | null
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText },
  submitted: { label: "Submitted", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  under_review: { label: "Dalam Review", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Search },
  revision_requested: { label: "Butuh Revisi", color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle },
  approved: { label: "Disetujui", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Ditolak", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  cancelled: { label: "Dibatalkan", color: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
    hour12: false
  }).format(d).replace(/\./g, ':')
}

function CekStatusContent() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const initialNomor = searchParams.get("nomor") || ""
  const [nomor, setNomor] = useState(initialNomor)
  const [kontak, setKontak] = useState("")
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [pengajuan, setPengajuan] = useState<Pengajuan | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (initialNomor) {
      handleSearch(initialNomor)
    }
  }, [initialNomor])

  const handleSearch = async (searchNum: string, searchKontak: string) => {
    // Bersihkan # dan spasi dari nomor pengajuan
    const cleanNum = searchNum.replace(/^#\s*/, '').trim().toUpperCase()
    
    // Format WA agar sama dengan format di database (628...)
    let cleanKontak = searchKontak.trim()
    let formattedWA = cleanKontak.replace(/\D/g, '')
    if (formattedWA.startsWith('0')) {
      formattedWA = '62' + formattedWA.substring(1)
    } else if (formattedWA.startsWith('8')) {
      formattedWA = '62' + formattedWA
    }

    if (!cleanNum || !cleanKontak) {
      setErrorMsg("Mohon isi nomor pengajuan dan nomor WA / Email Anda.")
      return
    }

    setLoading(true)
    setErrorMsg("")
    setSearched(true)
    setPengajuan(null)
    setTimeline([])

    // Update query params in URL
    router.replace(`/cek-status?nomor=${cleanNum}`)

    try {
      const { data: pData, error: pError } = await supabase
        .from("pengajuan_peminjaman")
        .select("*")
        .eq("nomor_pengajuan", cleanNum)
        .maybeSingle()

      if (pError) throw pError

      if (!pData) {
        setErrorMsg("Pengajuan dengan nomor tersebut tidak ditemukan.")
        setLoading(false)
        return
      }

      // Verifikasi WA / Email
      const waMatch = pData.whatsapp === formattedWA || pData.whatsapp === cleanKontak
      const emailMatch = pData.email && pData.email.toLowerCase() === cleanKontak.toLowerCase()
      
      if (!waMatch && !emailMatch) {
        setErrorMsg("Data pengajuan tidak ditemukan. Pastikan Nomor Pengajuan dan WA/Email sudah benar.")
        setLoading(false)
        return
      }

      setPengajuan(pData as Pengajuan)

      // Fetch Timeline
      const { data: tData, error: tError } = await supabase
        .from("pengajuan_timeline")
        .select("*")
        .eq("pengajuan_id", pData.id)
        .order("created_at", { ascending: false })

      if (tError) throw tError
      setTimeline(tData || [])
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Terjadi kesalahan koneksi database. Silakan coba beberapa saat lagi.")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(nomor, kontak)
  }

  const activeStatus = pengajuan ? STATUS_CONFIG[pengajuan.status] || { label: pengajuan.status, color: "bg-slate-100 text-slate-600 border-slate-200", icon: HelpCircle } : null
  const StatusIcon = activeStatus ? activeStatus.icon : HelpCircle

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-10 px-4">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex flex-col sm:flex-row items-center gap-2">
            <Search className="h-7 w-7 text-indigo-600 hidden sm:inline-block" />
            Cek Status Pengajuan Peminjaman
          </h1>
          <p className="text-slate-500 mt-2">Masukkan nomor pengajuan Anda untuk memantau status secara langsung.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Search Box */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-[2] space-y-2">
                <Label htmlFor="nomor" className="sr-only">Nomor Pengajuan</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">#</span>
                  <Input 
                    id="nomor"
                    value={nomor} 
                    onChange={e => setNomor(e.target.value)} 
                    placeholder="PJM-YYYYMMDD-XXXX" 
                    className="pl-8 h-12 text-base font-mono font-bold uppercase tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:font-normal"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="flex-[2] space-y-2">
                <Label htmlFor="kontak" className="sr-only">WA / Email</Label>
                <Input 
                  id="kontak"
                  value={kontak} 
                  onChange={e => setKontak(e.target.value)} 
                  placeholder="Nomor WA atau Email pemohon" 
                  className="h-12 text-base"
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl font-semibold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 flex-1">
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <><Search className="h-4 w-4" /> Cari Pengajuan</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {/* Error message */}
        {searched && !loading && errorMsg && (
          <Card className="border-red-100 bg-red-50/50 shadow-sm">
            <CardContent className="p-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-950 text-sm">Pengajuan Tidak Ditemukan</h4>
                <p className="text-xs text-red-800 mt-1">{errorMsg}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searched && !loading && pengajuan && activeStatus && (
          <div className="space-y-6 animate-fadeIn">
            {/* Status overview card */}
            <Card className="border-0 shadow-xl overflow-hidden bg-white/95">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">Nomor Pengajuan</span>
                    <span className="text-2xl font-mono font-extrabold text-slate-900 tracking-tight">{pengajuan.nomor_pengajuan}</span>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${activeStatus.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {activeStatus.label}
                    </span>
                  </div>
                </div>

                {/* Event summary info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Kegiatan</h4>
                      <p className="font-bold text-slate-800 text-lg mt-0.5 capitalize">{pengajuan.nama_event}</p>
                      <p className="text-xs text-indigo-600 font-semibold">{pengajuan.jenis_event}</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="text-xs font-semibold text-slate-500">Waktu Pelaksanaan</h5>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">Mulai: {formatDate(pengajuan.tanggal_mulai)}</p>
                        <p className="text-sm font-semibold text-slate-700">Selesai: {formatDate(pengajuan.tanggal_selesai)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="text-xs font-semibold text-slate-500">Area & Fasilitas</h5>
                        <p className="text-sm font-semibold text-slate-700 mt-0.5">{pengajuan.area_fasilitas.join(", ")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-100 md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pemohon</h4>
                      <p className="font-bold text-slate-800 mt-0.5 capitalize">{pengajuan.nama_pemohon}</p>
                      {pengajuan.nama_lembaga && (
                        <p className="text-xs text-slate-500 font-medium capitalize">Tipe: {pengajuan.tipe_pemohon} ({pengajuan.nama_lembaga})</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catatan Pengelola</h4>
                      <p className="text-sm italic text-slate-600 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                        {pengajuan.catatan_admin || "Belum ada catatan dari pengelola."}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Progress */}
            <Card className="border-0 shadow-lg bg-white/95">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800">📋 Riwayat Proses Pengajuan</CardTitle>
                <CardDescription>Perkembangan status pengajuan peminjaman Anda</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-8">
                {timeline.length === 0 ? (
                  <p className="text-slate-400 text-center text-sm py-4">Belum ada riwayat update status.</p>
                ) : (
                  <div className="relative pl-6 border-l-2 border-slate-150 space-y-6 ml-2">
                    {timeline.map((item, idx) => {
                      const cfg = STATUS_CONFIG[item.status_baru as keyof typeof STATUS_CONFIG] || { label: item.status_baru, color: "bg-slate-100 text-slate-700", icon: HelpCircle }
                      const Icon = cfg.icon
                      const isFirst = idx === 0

                      return (
                        <div key={item.id} className="relative">
                          {/* Timeline dot */}
                          <span className={`absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 ${
                            isFirst ? 'bg-indigo-600 border-indigo-200 ring-4 ring-indigo-50' : 'bg-white border-slate-300'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isFirst ? 'bg-white' : 'bg-slate-400'}`} />
                          </span>

                          <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-4 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${cfg.color}`}>
                                  <Icon className="h-3 w-3" />
                                  {cfg.label}
                                </span>
                                {item.status_lama && (
                                  <span className="text-[10px] text-slate-400">
                                    (dari {STATUS_CONFIG[item.status_lama as keyof typeof STATUS_CONFIG]?.label || item.status_lama})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 font-medium">
                                {formatDate(item.created_at)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-slate-700 mt-2 font-medium">
                              {item.catatan || "Status pengajuan diupdate"}
                            </p>
                            
                            {item.dibuat_oleh_nama && (
                              <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                                Diupdate oleh: {item.dibuat_oleh_nama}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="mt-12 text-center text-xs text-slate-400">
        © 2026 Masjid Agung Kubah Timah. All Rights Reserved.
      </div>
    </div>
  )
}

export default function CekStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
      </div>
    }>
      <CekStatusContent />
    </Suspense>
  )
}
