"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Users, UserCheck, Camera, ShieldCheck, MapPin, Calendar, 
  FileText, Image as ImageIcon, Printer, Plus, Loader2 
} from "lucide-react"
import NotulenTab from "@/app/admin/(protected)/pengajuan/[id]/NotulenTab"
import DokumentasiTab from "@/app/admin/(protected)/pengajuan/[id]/DokumentasiTab"
import LaporanTab from "@/app/admin/(protected)/pengajuan/[id]/LaporanTab"
import { guestAddParticipantAction } from "@/app/actions/panitiaActions"

function maskWhatsapp(wa: string) {
  if (!wa) return "-"
  if (wa.length <= 6) return wa
  return wa.substring(0, 4) + "****" + wa.substring(wa.length - 3)
}

export default function GuestDashboardPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [event, setEvent] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'absensi' | 'notulen' | 'dokumentasi' | 'laporan'>('absensi')

  // Form check-in manual
  const [showAddForm, setShowAddForm] = useState(false)
  const [newParticipant, setNewParticipant] = useState({ full_name: "", whatsapp: "", organization: "" })
  const [addingParticipant, setAddingParticipant] = useState(false)

  useEffect(() => {
    fetchData()
    
    // Subscribe to real-time changes on participants table
    const subscription = supabase
      .channel('participants_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'participants',
        filter: `event_id=eq.${params.id}` 
      }, (payload) => {
        // Refresh data when there's an update (someone registered or checked in)
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [params.id])

  const fetchData = async () => {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()

    if (eventError || !eventData) {
      setLoading(false)
      return
    }

    setEvent(eventData)

    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })

    if (participantsData) {
      setParticipants(participantsData)
    }

    setLoading(false)
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newParticipant.full_name || !newParticipant.whatsapp) {
      alert("Nama dan No. WhatsApp wajib diisi.")
      return
    }
    setAddingParticipant(true)
    const res = await guestAddParticipantAction(params.id, newParticipant)
    if (res.error) {
      alert("Gagal menambahkan peserta: " + res.error)
    } else {
      alert("Peserta berhasil didaftarkan dan check-in.")
      setNewParticipant({ full_name: "", whatsapp: "", organization: "" })
      setShowAddForm(false)
      fetchData()
    }
    setAddingParticipant(false)
  }

  if (loading) return <div className="p-10 flex min-h-screen items-center justify-center bg-slate-50"><div className="animate-pulse text-indigo-600 font-semibold text-lg">Memuat Data Live...</div></div>
  
  if (!event) return (
    <div className="p-10 flex min-h-screen items-center justify-center bg-slate-50 text-center">
      <Card className="max-w-md w-full p-8 shadow-sm">
        <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500">Event tidak valid atau akses telah dicabut.</p>
      </Card>
    </div>
  )

  const totalRegistered = participants.length
  const totalAttended = participants.filter(p => p.status === 'attended').length
  const totalPending = totalRegistered - totalAttended

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Panel */}
      <div className="bg-indigo-900 text-white pb-24 pt-8 px-4 sm:px-6 lg:px-8 border-b border-indigo-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-indigo-800/50 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-indigo-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Dasbor Panitia Luar (Guest)
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-indigo-200 text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(event.start_datetime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {event.location}</span>
              </div>
            </div>
            <Link href={`/panitia/${params.id}/scanner`}>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all">
                <Camera className="h-5 w-5" /> Buka Scanner Tiket
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 mb-6">
        <div className="flex gap-4 sm:gap-6 border-b border-indigo-200 overflow-x-auto bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-indigo-50">
          <button 
            onClick={() => setActiveTab('absensi')} 
            className={`pb-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'absensi' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="h-4.5 w-4.5" /> Absensi & Scanner
          </button>
          <button 
            onClick={() => setActiveTab('notulen')} 
            className={`pb-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'notulen' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText className="h-4.5 w-4.5" /> Notulen Rapat
          </button>
          <button 
            onClick={() => setActiveTab('dokumentasi')} 
            className={`pb-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'dokumentasi' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ImageIcon className="h-4.5 w-4.5" /> Dokumentasi Foto
          </button>
          <button 
            onClick={() => setActiveTab('laporan')} 
            className={`pb-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'laporan' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Printer className="h-4.5 w-4.5" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        {activeTab === 'absensi' && (
          <div className="space-y-6">
            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Total Pendaftar</p>
                      <h3 className="text-3xl font-bold text-slate-800">{totalRegistered}</h3>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-xl"><Users className="h-6 w-6 text-indigo-600" /></div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Telah Hadir (Check-in)</p>
                      <h3 className="text-3xl font-bold text-emerald-600">{totalAttended}</h3>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl"><UserCheck className="h-6 w-6 text-emerald-600" /></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">Belum Hadir</p>
                      <h3 className="text-3xl font-bold text-slate-700">{totalPending}</h3>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-xl"><Users className="h-6 w-6 text-slate-400" /></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Title and Add Form toggle */}
            <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-indigo-600" /> Kehadiran Peserta
                </h3>
                <p className="text-xs text-slate-500">Data terupdate secara realtime.</p>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> {showAddForm ? "Batal" : "Tambah Kehadiran Manual"}
              </button>
            </div>

            {/* Manual Attendance Registration Card */}
            {showAddForm && (
              <Card className="border border-indigo-150 bg-indigo-50/20 p-5 rounded-xl shadow-sm">
                <form onSubmit={handleAddParticipant} className="space-y-4">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-indigo-100 pb-2">
                    Input Pendaftaran & Kehadiran Manual
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-650">Nama Lengkap</Label>
                      <Input 
                        required
                        placeholder="Nama Lengkap Peserta..." 
                        className="text-xs h-9 bg-white" 
                        value={newParticipant.full_name} 
                        onChange={e => setNewParticipant({...newParticipant, full_name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-650">No. WhatsApp</Label>
                      <Input 
                        required
                        placeholder="Contoh: 081234567890" 
                        className="text-xs h-9 bg-white" 
                        value={newParticipant.whatsapp} 
                        onChange={e => setNewParticipant({...newParticipant, whatsapp: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-650">Instansi / Organisasi (Opsional)</Label>
                      <Input 
                        placeholder="Nama Instansi..." 
                        className="text-xs h-9 bg-white" 
                        value={newParticipant.organization} 
                        onChange={e => setNewParticipant({...newParticipant, organization: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setShowAddForm(false)} 
                      className="h-9 text-xs font-semibold"
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addingParticipant} 
                      className="h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {addingParticipant ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Check-in Sekarang
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Attendance Table */}
            <Card className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-0">
                {participants && participants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/60">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">Nama Peserta</TableHead>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">Instansi</TableHead>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">No. WA</TableHead>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((p) => (
                          <TableRow key={p.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-semibold text-slate-900 text-xs py-3">{p.full_name}</TableCell>
                            <TableCell className="text-slate-600 text-xs py-3">{p.organization || '-'}</TableCell>
                            <TableCell className="text-slate-500 font-mono text-xs py-3">{maskWhatsapp(p.whatsapp)}</TableCell>
                            <TableCell className="py-3">
                              {p.status === 'attended' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-150 text-green-800">
                                  <UserCheck className="w-3 h-3 mr-1" /> Hadir
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Menunggu
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500">
                    <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-xs">Belum ada peserta yang mendaftar atau check-in.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notulen' && (
          <NotulenTab 
            isGuest={true}
            eventId={event.id}
            pengajuanData={event}
          />
        )}

        {activeTab === 'dokumentasi' && (
          <DokumentasiTab 
            isGuest={true}
            eventId={event.id}
            pengajuanId={event.event_request_id}
          />
        )}

        {activeTab === 'laporan' && (
          <LaporanTab 
            isGuest={true}
            eventId={event.id}
            pengajuanData={event}
          />
        )}
      </div>
    </div>
  )
}
