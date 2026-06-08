"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import LaporanTab from "@/app/admin/(protected)/pengajuan/[id]/LaporanTab"
import { ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LaporanRapatPublicDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [pengajuanData, setPengajuanData] = useState<any>(null)

  useEffect(() => {
    checkValidity()
  }, [id])

  const checkValidity = async () => {
    setLoading(true)
    
    // Check if meeting minutes exists and is public + published
    const { data: mnData } = await supabase
      .from("meeting_minutes")
      .select("id, status, privacy_level, is_published")
      .eq("pengajuan_id", id)
      .single()

    if (mnData && mnData.privacy_level === 'public' && mnData.is_published && mnData.status === 'finalized') {
      const { data: pData } = await supabase
        .from("pengajuan_peminjaman")
        .select("*")
        .eq("id", id)
        .single()
      
      if (pData) {
        setPengajuanData(pData)
        setValid(true)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">Memverifikasi akses laporan...</div>
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
          <p className="text-sm text-slate-500 mb-6">Laporan ini bersifat internal, rahasia, atau belum dipublikasikan oleh pihak MAKT.</p>
          <Link href="/laporan-rapat">
            <Button variant="outline" className="w-full h-10 font-bold text-slate-600">
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Daftar Laporan
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header Print Hidden */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 mb-8 print:hidden sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/laporan-rapat">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-800 font-medium">
              <ArrowLeft className="h-4 w-4 mr-2" /> Daftar Laporan
            </Button>
          </Link>
          <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Arsip Publik MAKT
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-lg mb-6 print:hidden flex items-center">
          <span className="font-bold mr-2">Informasi:</span> Laporan ini telah disensor untuk melindungi privasi peserta dan informasi internal.
        </div>
        
        <LaporanTab pengajuanId={id} pengajuanData={pengajuanData} isPublic={true} />
      </div>
    </div>
  )
}
