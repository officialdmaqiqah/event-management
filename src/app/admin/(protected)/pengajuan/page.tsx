"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Calendar, Search, Filter, Clock, MapPin, Eye, AlertCircle, FileText, CheckCircle, HelpCircle, XCircle } from "lucide-react"

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
  estimasi_peserta: number
  tanggal_mulai: string
  tanggal_selesai: string
  area_fasilitas: string[]
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
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(d)
}

export default function AdminPengajuanPage() {
  const supabase = createClient()
  const [data, setData] = useState<Pengajuan[]>([])
  const [filteredData, setFilteredData] = useState<Pengajuan[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")

  const [jenisEventOptions, setJenisEventOptions] = useState<string[]>([
    "Kajian / Pengajian",
    "Seminar / Workshop",
    "Rapat / Musyawarah",
    "Nikah / Akad",
    "Sosial / Bakti Sosial",
    "Olahraga / Lomba",
    "Pendidikan / Pelatihan",
    "Kebudayaan / Seni",
    "Lainnya",
  ])

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("jenis_event")
          .select("name")
          .order("name", { ascending: true })

        if (!error && data && data.length > 0) {
          setJenisEventOptions(data.map(d => d.name))
        }
      } catch (err) {
        console.error("Gagal load jenis event filter:", err)
      }
    }
    fetchEventTypes()
  }, [])

  // Filter states
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [jenisFilter, setJenisFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    fetchPengajuan()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [data, search, statusFilter, jenisFilter, startDate, endDate])

  const fetchPengajuan = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      const { data: list, error } = await supabase
        .from("pengajuan_peminjaman")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setData(list || [])
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Gagal mengambil data pengajuan dari database.")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let temp = [...data]

    // Search by nomor, nama pemohon, nama event
    if (search.trim()) {
      const query = search.toLowerCase()
      temp = temp.filter(p => 
        p.nomor_pengajuan.toLowerCase().includes(query) ||
        p.nama_pemohon.toLowerCase().includes(query) ||
        (p.nama_lembaga && p.nama_lembaga.toLowerCase().includes(query)) ||
        p.nama_event.toLowerCase().includes(query)
      )
    }

    // Status Filter
    if (statusFilter) {
      temp = temp.filter(p => p.status === statusFilter)
    }

    // Jenis Event Filter
    if (jenisFilter) {
      temp = temp.filter(p => p.jenis_event === jenisFilter)
    }

    // Date Range (filters by event start date)
    if (startDate) {
      const sDate = new Date(startDate + "T00:00:00")
      temp = temp.filter(p => new Date(p.tanggal_mulai) >= sDate)
    }
    if (endDate) {
      const eDate = new Date(endDate + "T23:59:59")
      temp = temp.filter(p => new Date(p.tanggal_mulai) <= eDate)
    }

    setFilteredData(temp)
  }

  const resetFilters = () => {
    setSearch("")
    setStatusFilter("")
    setJenisFilter("")
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Pengajuan Peminjaman</h1>
          <p className="text-sm text-slate-500">Review, setujui, dan kelola semua izin peminjaman fasilitas Masjid Kubah Timah</p>
        </div>
        <Link href="/ajukan-peminjaman" target="_blank">
          <Button className="bg-indigo-600 hover:bg-indigo-700">Form Pengajuan Publik ↗</Button>
        </Link>
      </div>

      {/* Filters Card */}
      <Card className="border border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-600" />
          <div>
            <CardTitle className="text-base font-bold">Filter Pencarian</CardTitle>
            <CardDescription className="text-xs">Saring pengajuan berdasarkan kriteria tertentu</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-1.5">
              <Label htmlFor="search-input" className="text-xs font-semibold text-slate-600">Cari Data</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  id="search-input" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Nomor / Pemohon / Event" 
                  className="pl-8 h-9 text-xs" 
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status-select" className="text-xs font-semibold text-slate-600">Status</Label>
              <select 
                id="status-select" 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Jenis Event */}
            <div className="space-y-1.5">
              <Label htmlFor="jenis-select" className="text-xs font-semibold text-slate-600">Jenis Event</Label>
              <select 
                id="jenis-select" 
                value={jenisFilter} 
                onChange={e => setJenisFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua Jenis</option>
                {jenisEventOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Tanggal Mulai */}
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs font-semibold text-slate-600">Tanggal Mulai Event</Label>
              <Input 
                id="start-date" 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="h-9 text-xs" 
              />
            </div>

            {/* Tanggal Selesai */}
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs font-semibold text-slate-600">Tanggal Selesai Event</Label>
              <Input 
                id="end-date" 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="h-9 text-xs" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs h-8">Reset Filter</Button>
            <Button variant="indigo" size="sm" onClick={fetchPengajuan} className="text-xs h-8 bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">Refresh Data</Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {errorMsg && (
        <Card className="border-red-100 bg-red-50 text-red-950 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-sm">{errorMsg}</span>
          </div>
        </Card>
      )}

      {/* Table Data Card */}
      <Card className="border border-slate-200/80 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-800 text-sm">Tidak Ada Pengajuan</p>
              <p className="text-xs mt-1">Belum ada pengajuan masuk, atau tidak ada yang sesuai dengan filter pencarian.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    <TableHead className="w-[180px] font-bold text-xs uppercase text-slate-500">Nomor Pengajuan</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Pemohon</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Event / Kegiatan</TableHead>
                    <TableHead className="w-[200px] font-bold text-xs uppercase text-slate-500">Waktu Mulai</TableHead>
                    <TableHead className="w-[140px] font-bold text-xs uppercase text-slate-500">Status</TableHead>
                    <TableHead className="w-[100px] text-right font-bold text-xs uppercase text-slate-500 pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => {
                    const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: "bg-slate-100 text-slate-600", icon: HelpCircle }
                    const StatusIcon = cfg.icon

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-mono font-bold text-slate-900 text-sm tracking-tight">
                          {item.nomor_pengajuan}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800">{item.nama_pemohon}</div>
                          {item.nama_lembaga ? (
                            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">{item.nama_lembaga}</div>
                          ) : (
                            <div className="text-slate-400 text-[10px] capitalize mt-0.5">{item.tipe_pemohon}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-indigo-950">{item.nama_event}</div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[180px]">{item.area_fasilitas.join(", ")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(item.tanggal_mulai)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${cfg.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Link href={`/admin/pengajuan/${item.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1 hover:text-indigo-600 hover:border-indigo-200">
                              <Eye className="h-3.5 w-3.5" /> Detail
                            </Button>
                          </Link>
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
  )
}
