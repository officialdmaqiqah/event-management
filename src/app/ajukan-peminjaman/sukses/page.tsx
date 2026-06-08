"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Copy, Check, Calendar, ArrowRight, ClipboardList } from "lucide-react"

function SuksesContent() {
  const searchParams = useSearchParams()
  const nomor = searchParams.get("nomor") || "PJM-UNKNOWN"
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(nomor)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-16 px-4 flex flex-col justify-center items-center">
      {/* Header / Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xl mb-2 hover:text-indigo-800 transition-colors">
          <Calendar className="h-6 w-6" />
          Kubah Timah Events
        </Link>
      </div>

      <Card className="max-w-md w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden text-center">
        <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
        
        <CardHeader className="pt-8 pb-4 flex flex-col items-center">
          <div className="h-16 w-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50/50">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-slate-900">
            Pengajuan Berhasil Dikirim!
          </CardTitle>
          <CardDescription className="text-slate-500 px-4 mt-2">
            Pengajuan peminjaman fasilitas Anda telah diterima oleh sistem dan sedang dalam antrean review.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          {/* Reference Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 bg-indigo-500 text-[10px] text-white font-bold uppercase rounded-bl-lg tracking-wider">
              Nomor Pengajuan
            </div>
            <span className="text-xs font-semibold text-slate-400 block mt-2 uppercase tracking-widest">Nomor Referensi</span>
            <div className="flex items-center justify-center gap-2">
              <code className="text-xl font-mono font-bold text-slate-800 select-all tracking-tight">
                {nomor}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={copyToClipboard}
                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Salin Nomor Pengajuan"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              *Simpan nomor ini untuk memeriksa status pengajuan secara berkala.
            </p>
          </div>

          {/* Timeline / Next Steps info */}
          <div className="text-left bg-indigo-50/40 rounded-xl p-4 border border-indigo-100/50">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">Langkah Selanjutnya:</h4>
            <ul className="text-xs text-slate-600 space-y-2.5">
              <li className="flex gap-2">
                <span className="flex-shrink-0 h-5 w-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Pengelola akan melakukan verifikasi ketersediaan jadwal dan kelayakan dokumen (1-3 hari kerja).</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 h-5 w-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Anda dapat memantau status secara real-time di halaman <Link href="/cek-status" className="text-indigo-600 font-semibold hover:underline">Cek Status</Link>.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 h-5 w-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">3</span>
                <span>Notifikasi review/persetujuan akan diinfokan ke alamat email dan WhatsApp yang terdaftar.</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <Link href={`/cek-status?nomor=${nomor}`} className="w-full">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                Pantau Status Pengajuan <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full h-11 rounded-xl font-medium border-slate-200 hover:bg-slate-50 text-slate-700">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center text-xs text-slate-400">
        © 2026 Masjid Agung Kubah Timah. All Rights Reserved.
      </div>
    </div>
  )
}

export default function SuksesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
      </div>
    }>
      <SuksesContent />
    </Suspense>
  )
}
