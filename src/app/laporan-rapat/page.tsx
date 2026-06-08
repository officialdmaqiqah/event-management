"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Search, Calendar as CalendarIcon, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LaporanRapatPublicPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("meeting_minutes")
      .select("*, pengajuan_peminjaman(nama_event, area_fasilitas)")
      .eq("privacy_level", "public")
      .eq("is_published", true)
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false })

    if (data) setReports(data)
    setLoading(false)
  }

  const filteredReports = reports.filter(r => 
    r.meeting_title?.toLowerCase().includes(search.toLowerCase()) || 
    r.meeting_type?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-indigo-600 pb-24 pt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Laporan & Hasil Kegiatan</h1>
          <p className="mt-4 max-w-xl mx-auto text-indigo-100">
            Arsip publik laporan hasil rapat, musyawarah, dan evaluasi kegiatan yang dilaksanakan di Masjid Agung Kubah Timah.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-12">
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Cari judul rapat atau jenis kegiatan..." 
                className="pl-10 h-12 w-full bg-slate-50 border-slate-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button className="h-12 w-full sm:w-32 bg-indigo-600 hover:bg-indigo-700 font-bold shrink-0">
              Cari Laporan
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Memuat data laporan...</div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Tidak ada laporan publik</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2">Belum ada laporan rapat yang dipublikasikan atau pencarian Anda tidak cocok dengan data apapun.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <Link href={`/laporan-rapat/${report.pengajuan_id}`} key={report.id}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-slate-200 group">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {report.meeting_type || 'Kegiatan'}
                      </span>
                      <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-full">
                        <CalendarIcon className="h-3 w-3 mr-1.5 text-slate-400" />
                        {formatDate(report.meeting_date)}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug mb-2">
                      {report.meeting_title}
                    </h3>
                    
                    <p className="text-sm text-slate-500 line-clamp-2 flex-grow mb-6">
                      {report.agenda || report.discussion_summary || 'Tidak ada deskripsi singkat.'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-100">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <FileText className="h-4 w-4" /> Laporan Publik
                      </span>
                      <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Baca Selengkapnya <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
