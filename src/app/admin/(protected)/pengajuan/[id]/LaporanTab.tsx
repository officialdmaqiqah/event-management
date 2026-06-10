"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, FileText, Globe, Shield, Lock } from "lucide-react"

export default function LaporanTab({ pengajuanId, pengajuanData, isPublic = false }: { pengajuanId: string, pengajuanData: any, isPublic?: boolean }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  
  // Data State
  const [notulen, setNotulen] = useState<any>(null)
  const [actionItems, setActionItems] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [participants, setParticipants] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [pengajuanId])

  const fetchData = async () => {
    setLoading(true)
    
    // Fetch participants
    const { data: pData } = await supabase
      .from("participants")
      .select("*")
      .eq("event_request_id", pengajuanId)
      .order("created_at", { ascending: true })
    if (pData) setParticipants(pData)

    // Fetch Notulen
    const { data: mnData } = await supabase
      .from("meeting_minutes")
      .select("*")
      .eq("pengajuan_id", pengajuanId)
      .single()

    if (mnData) {
      setNotulen(mnData)
      
      // Fetch Action Items
      const { data: aiData } = await supabase
        .from("meeting_action_items")
        .select("*")
        .eq("meeting_minutes_id", mnData.id)
        .order("created_at", { ascending: true })
      if (aiData) setActionItems(aiData)

      // Fetch Photos
      const { data: phData } = await supabase
        .from("meeting_photos")
        .select("*")
        .eq("meeting_minutes_id", mnData.id)
        .order("created_at", { ascending: true })
      
      if (phData) {
        // If public, only show public photos
        const visiblePhotos = isPublic ? phData.filter(p => p.visibility === 'public') : phData
        setPhotos(visiblePhotos)
      }
    }
    
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Menyiapkan Laporan...</div>

  if (!notulen) {
    return (
      <div className="text-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Laporan Belum Tersedia</h3>
        <p className="text-sm text-slate-500 mt-2">Silakan buat dan simpan Notulen terlebih dahulu pada tab "Notulen".</p>
      </div>
    )
  }

  const presentParticipants = participants.filter(p => p.checked_in_at)

  return (
    <div className="space-y-6">
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 font-bold gap-2">
          <Printer className="h-4 w-4" /> Cetak / Simpan PDF
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .print:hidden { display: none !important; }
        }
      `}} />

      <Card className={`print-container border-0 shadow-none sm:border sm:border-slate-200 sm:shadow-md bg-white overflow-hidden max-w-[800px] mx-auto ${isPublic ? 'mt-8' : ''}`}>
        {/* Privacy Badge */}
        {!isPublic && notulen.privacy_level && (
          <div className="print:hidden absolute top-0 right-0 m-4">
            <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
              notulen.privacy_level === 'public' ? 'bg-blue-100 text-blue-700' :
              notulen.privacy_level === 'internal' ? 'bg-indigo-100 text-indigo-700' :
              notulen.privacy_level === 'restricted' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {notulen.privacy_level === 'public' && <Globe className="h-3 w-3" />}
              {(notulen.privacy_level === 'internal' || notulen.privacy_level === 'restricted') && <Shield className="h-3 w-3" />}
              {notulen.privacy_level === 'confidential' && <Lock className="h-3 w-3" />}
              {notulen.privacy_level.toUpperCase()}
            </div>
          </div>
        )}

        <CardContent className="p-8 sm:p-12 space-y-8 text-slate-800">
          
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
            <h1 className="text-2xl font-black uppercase tracking-wider">MASJID AGUNG KUBAH TIMAH</h1>
            <p className="text-sm font-semibold mt-1">Laporan Hasil Rapat & Kegiatan</p>
          </div>

          {/* Identitas Rapat */}
          <div>
            <h2 className="text-lg font-bold uppercase mb-4 border-b border-slate-200 pb-2">I. Identitas Rapat</h2>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 w-40 font-semibold">Nama Rapat</td>
                  <td className="py-1.5 px-2 w-4">:</td>
                  <td className="py-1.5 font-bold">{notulen.meeting_title}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold">Jenis Kegiatan</td>
                  <td className="py-1.5 px-2">:</td>
                  <td className="py-1.5">{notulen.meeting_type || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold">Hari, Tanggal</td>
                  <td className="py-1.5 px-2">:</td>
                  <td className="py-1.5">{formatDateIndo(notulen.meeting_date)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold">Waktu</td>
                  <td className="py-1.5 px-2">:</td>
                  <td className="py-1.5">{notulen.start_time?.substring(0,5) || '-'} s.d. {notulen.end_time?.substring(0,5) || '-'} WIB</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold">Tempat / Lokasi</td>
                  <td className="py-1.5 px-2">:</td>
                  <td className="py-1.5">{notulen.location || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold">Pimpinan Rapat</td>
                  <td className="py-1.5 px-2">:</td>
                  <td className="py-1.5">{notulen.chairperson_name || '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold">Sekretaris / Notulis</td>
                  <td className="py-1.5 px-2">:</td>
                  <td className="py-1.5">{notulen.secretary_name || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kehadiran */}
          <div>
            <h2 className="text-lg font-bold uppercase mb-4 border-b border-slate-200 pb-2">II. Daftar Hadir</h2>
            <p className="text-sm mb-3">Jumlah Hadir: <strong>{presentParticipants.length} Orang</strong></p>
            {presentParticipants.length > 0 ? (
              <table className="w-full text-sm border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 py-2 px-3 text-left w-12 text-center">No</th>
                    <th className="border border-slate-300 py-2 px-3 text-left">Nama Lengkap</th>
                    <th className="border border-slate-300 py-2 px-3 text-left">Jabatan / Instansi</th>
                    <th className="border border-slate-300 py-2 px-3 text-center">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {presentParticipants.map((p, idx) => (
                    <tr key={p.id}>
                      <td className="border border-slate-300 py-1.5 px-3 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 py-1.5 px-3">{p.full_name}</td>
                      <td className="border border-slate-300 py-1.5 px-3">{p.organization || '-'}</td>
                      <td className="border border-slate-300 py-1.5 px-3 text-center">{new Date(p.checked_in_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', hour12: false}).replace(/\./g, ':')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-slate-500">Data kehadiran belum dimasukkan.</p>
            )}
          </div>

          {/* Notulen / Pembahasan */}
          <div>
            <h2 className="text-lg font-bold uppercase mb-4 border-b border-slate-200 pb-2">III. Pembahasan & Keputusan</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-bold mb-1">Agenda:</h3>
                <p className="whitespace-pre-wrap pl-4 border-l-2 border-slate-200">{notulen.agenda || '-'}</p>
              </div>
              <div>
                <h3 className="font-bold mb-1">Ringkasan Pembahasan:</h3>
                <p className="whitespace-pre-wrap pl-4 border-l-2 border-slate-200">{notulen.discussion_summary || '-'}</p>
              </div>
              <div>
                <h3 className="font-bold mb-1">Keputusan Rapat:</h3>
                <p className="whitespace-pre-wrap pl-4 border-l-2 border-slate-200 font-medium">{notulen.decisions || '-'}</p>
              </div>
              {!isPublic && notulen.important_notes && (
                <div>
                  <h3 className="font-bold mb-1 text-red-700">Catatan Penting (Internal):</h3>
                  <p className="whitespace-pre-wrap pl-4 border-l-2 border-red-200 italic text-slate-600 bg-red-50/30 p-2 rounded">{notulen.important_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Items */}
          {actionItems.length > 0 && (
            <div>
              <h2 className="text-lg font-bold uppercase mb-4 border-b border-slate-200 pb-2">IV. Tindak Lanjut (Action Items)</h2>
              <table className="w-full text-sm border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 py-2 px-3 text-left w-12 text-center">No</th>
                    <th className="border border-slate-300 py-2 px-3 text-left">Deskripsi Tugas</th>
                    <th className="border border-slate-300 py-2 px-3 text-left">Penanggung Jawab</th>
                    <th className="border border-slate-300 py-2 px-3 text-center">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {actionItems.map((ai, idx) => (
                    <tr key={ai.id}>
                      <td className="border border-slate-300 py-2 px-3 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 py-2 px-3">{ai.description}</td>
                      <td className="border border-slate-300 py-2 px-3">{ai.assignee_name || '-'}</td>
                      <td className="border border-slate-300 py-2 px-3 text-center">{ai.deadline || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Dokumentasi */}
          {photos.length > 0 && (
            <div className="break-before-page pt-8">
              <h2 className="text-lg font-bold uppercase mb-4 border-b border-slate-200 pb-2">V. Lampiran Dokumentasi</h2>
              <div className="grid grid-cols-2 gap-6 mt-6">
                {photos.map((photo, idx) => (
                  <div key={photo.id} className="text-center">
                    <img src={photo.photo_url} alt={`Dokumentasi ${idx+1}`} className="w-full h-auto object-cover max-h-[300px] border border-slate-300 p-1 bg-white shadow-sm" />
                    <p className="text-xs font-medium mt-2 italic">{photo.caption || `Dokumentasi Rapat ${idx+1}`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="pt-16 mt-16 flex justify-between text-sm pb-10">
            <div className="text-center">
              <p className="mb-20">Pimpinan Rapat,</p>
              <p className="font-bold underline">{notulen.chairperson_name || '........................'}</p>
            </div>
            <div className="text-center">
              <p className="mb-20">Notulis,</p>
              <p className="font-bold underline">{notulen.secretary_name || '........................'}</p>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
