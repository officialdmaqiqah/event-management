"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Label } from "@/components/ui/label"
import { Users, UserPlus, MapPin, QrCode, ClipboardEdit, Copy, CheckCircle2 } from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'

export default function ParticipantTab({ pengajuanId }: { pengajuanId: string }) {
  const supabase = createClient()
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  
  // Modal state
  const [openModal, setOpenModal] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    full_name: "",
    whatsapp: "",
    organization: ""
  })
  const [submitting, setSubmitting] = useState(false)

  const absenLink = typeof window !== 'undefined' ? `${window.location.origin}/absen-rapat/${pengajuanId}` : `/absen-rapat/${pengajuanId}`

  useEffect(() => {
    fetchParticipants()
  }, [pengajuanId])

  const fetchParticipants = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("event_request_id", pengajuanId)
      .order("created_at", { ascending: false })
    
    if (error) {
      console.error(error)
    } else {
      setParticipants(data || [])
    }
    setLoading(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(absenLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      const { error } = await supabase.from("participants").insert({
        event_request_id: pengajuanId,
        full_name: newParticipant.full_name,
        whatsapp: newParticipant.whatsapp,
        organization: newParticipant.organization,
        ticket_quantity: 1,
        ticket_code: ticketCode,
        status: 'attended',
        checked_in_at: new Date().toISOString(),
        attendance_type: 'internal',
        check_in_method: 'manual'
      })

      if (error) throw error
      
      setOpenModal(false)
      setNewParticipant({ full_name: "", whatsapp: "", organization: "" })
      fetchParticipants()
    } catch (err) {
      console.error(err)
      alert("Gagal menambahkan peserta")
    } finally {
      setSubmitting(false)
    }
  }

  const totalHadir = participants.filter(p => p.status === 'attended').length

  return (
    <div className="space-y-6">
      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowQRModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Scan untuk Absen</h3>
            <p className="text-xs text-slate-500 mb-6 text-center">Peserta dapat melakukan scan barcode ini menggunakan kamera HP untuk membuka form kehadiran.</p>
            <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm mb-6">
              <QRCodeSVG value={absenLink} size={220} level="M" />
            </div>
            <Button onClick={() => setShowQRModal(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold">Tutup Barcode</Button>
          </div>
        </div>
      )}

      {/* Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-indigo-100 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Kehadiran</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalHadir} Orang</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm md:col-span-2">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800">Bagikan Link Absensi Rapat</p>
              <p className="text-xs text-slate-500 mt-1">Peserta dapat melakukan absen mandiri via GPS menggunakan link atau barcode.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-500 truncate max-w-[150px] sm:max-w-[200px]">
                /absen-rapat/{pengajuanId.substring(0,8)}...
              </div>
              <Button onClick={() => setShowQRModal(true)} variant="outline" className="h-9 gap-1.5 shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                <QrCode className="h-4 w-4" /> QR Code
              </Button>
              <Button onClick={handleCopyLink} variant="outline" className="h-9 gap-1.5 shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Tersalin" : "Salin Link"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Daftar Kehadiran</CardTitle>
            <CardDescription className="text-xs">Data peserta yang telah check-in ke rapat ini.</CardDescription>
          </div>
          <div>
            <Button onClick={() => setOpenModal(!openModal)} className="bg-indigo-600 hover:bg-indigo-700 h-9 text-xs font-semibold gap-1.5 shadow-sm">
              <UserPlus className="h-4 w-4" /> {openModal ? "Batal" : "Input Manual"}
            </Button>
          </div>
        </CardHeader>
        {openModal && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/80">
            <h4 className="text-sm font-bold text-slate-800 mb-4">Input Kehadiran Manual</h4>
            <form onSubmit={handleAddParticipant} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label>Nama Lengkap</Label>
                <Input required value={newParticipant.full_name} onChange={e => setNewParticipant({...newParticipant, full_name: e.target.value})} placeholder="Nama peserta" />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input required value={newParticipant.whatsapp} onChange={e => setNewParticipant({...newParticipant, whatsapp: e.target.value})} placeholder="08..." />
              </div>
              <div className="space-y-1.5">
                <Label>Organisasi (Opsional)</Label>
                <Input value={newParticipant.organization} onChange={e => setNewParticipant({...newParticipant, organization: e.target.value})} placeholder="Contoh: Divisi Acara" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </div>
        )}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-bold text-xs text-slate-500 uppercase">Peserta</TableHead>
                <TableHead className="font-bold text-xs text-slate-500 uppercase">Kontak</TableHead>
                <TableHead className="font-bold text-xs text-slate-500 uppercase">Waktu Check-in</TableHead>
                <TableHead className="font-bold text-xs text-slate-500 uppercase">Metode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-sm text-slate-500">Memuat data...</TableCell>
                </TableRow>
              ) : participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">Belum ada peserta yang hadir.</p>
                      <p className="text-xs text-slate-400">Bagikan link absensi atau input data secara manual.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-800 text-sm">{p.full_name}</div>
                      {p.organization && <div className="text-xs text-slate-500">{p.organization}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">{p.whatsapp}</div>
                    </TableCell>
                    <TableCell>
                      {p.checked_in_at ? (
                        <div className="text-sm font-medium text-slate-700">
                          {new Date(p.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum hadir</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.check_in_method === 'gps' && <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold"><MapPin className="h-3 w-3" /> GPS</span>}
                      {p.check_in_method === 'qr' && <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-semibold"><QrCode className="h-3 w-3" /> QR Code</span>}
                      {p.check_in_method === 'manual' && <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-semibold"><ClipboardEdit className="h-3 w-3" /> Manual</span>}
                      {!p.check_in_method && <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold">Unknown</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
