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
  FileText, Image as ImageIcon, Printer, Plus, Loader2, Link as LinkIcon, ExternalLink,
  UserPlus
} from "lucide-react"
import NotulenTab from "@/app/admin/(protected)/pengajuan/[id]/NotulenTab"
import DokumentasiTab from "@/app/admin/(protected)/pengajuan/[id]/DokumentasiTab"
import LaporanTab from "@/app/admin/(protected)/pengajuan/[id]/LaporanTab"
import { guestAddParticipantAction, checkInParticipantAction } from "@/app/actions/panitiaActions"

function maskWhatsapp(wa: string) {
  if (!wa) return "-"
  return wa
}

export default function GuestDashboardPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const [event, setEvent] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'registrasi' | 'absensi' | 'notulen' | 'dokumentasi' | 'laporan'>('registrasi')

  // Form check-in manual (walk-in)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newParticipant, setNewParticipant] = useState({ full_name: "", whatsapp: "", organization: "" })
  const [addingParticipant, setAddingParticipant] = useState(false)

  // Link pendaftaran & copy state
  const [copied, setCopied] = useState(false)
  const registrationUrl = event?.registration_slug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${event.registration_slug}` 
    : ''

  const handleCopyLink = () => {
    if (registrationUrl) {
      navigator.clipboard.writeText(registrationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Action Check-in Manual untuk list pendaftar
  const [processingCheckIn, setProcessingCheckIn] = useState<string | null>(null)
  const handleCheckInManual = async (pId: string) => {
    setProcessingCheckIn(pId)
    if (!event?.id) return;
    const res = await checkInParticipantAction(event.id, pId)
    if (res.error) {
      alert("Gagal melakukan check-in: " + res.error)
    } else {
      alert("Peserta berhasil di-check-in.")
      fetchData()
    }
    setProcessingCheckIn(null)
  }

  useEffect(() => {
    fetchData()
  }, [params.slug])

  useEffect(() => {
    if (!event?.id) return;
    
    // Subscribe to real-time changes on participants table
    const subscription = supabase
      .channel('participants_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'participants',
        filter: `event_id=eq.${event.id}` 
      }, (payload) => {
        // Refresh data when there's an update (someone registered or checked in)
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [event?.id])

  const fetchData = async () => {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('registration_slug', params.slug)
      .single()

    if (eventError || !eventData) {
      setLoading(false)
      return
    }

    setEvent(eventData)

    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', eventData.id)
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
    if (!event?.id) return;
    setAddingParticipant(true)
    const res = await guestAddParticipantAction(event.id, newParticipant)
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
            <Link href={`/panitia/${params.slug}/scanner`}>
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
            onClick={() => setActiveTab('registrasi')} 
            className={`pb-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'registrasi' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserPlus className="h-4.5 w-4.5" /> Registrasi
          </button>
          <button 
            onClick={() => setActiveTab('absensi')} 
            className={`pb-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'absensi' ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserCheck className="h-4.5 w-4.5" /> Absensi & Scanner
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
        {activeTab === 'registrasi' && (
          <div className="space-y-6">
            {/* Tautan Pendaftaran & QR Code */}
            {event.registration_slug && (
              <Card className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden bg-white p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3 flex-1 w-full">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <LinkIcon className="h-4.5 w-4.5 text-indigo-600" /> Tautan Pendaftaran Peserta (Public)
                      </h4>
                      <p className="text-xs text-slate-500">Bagikan tautan ini kepada jamaah/peserta untuk melakukan pendaftaran online.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <input 
                        readOnly 
                        value={registrationUrl} 
                        className="flex-1 text-xs border border-slate-200 bg-slate-50 rounded-lg p-2.5 font-mono select-all focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCopyLink}
                          className={`h-9 text-xs font-bold ${copied ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
                        >
                          {copied ? "Tersalin!" : "Salin Link"}
                        </Button>
                        <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                          <Button variant="outline" className="w-full sm:w-auto h-9 text-xs font-semibold gap-1">
                            Buka Form <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-end">
                    <div className="text-center sm:text-left">
                      <h5 className="text-xs font-bold text-slate-700">QR Code Pendaftaran</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Scan untuk mendaftar di lokasi.</p>
                    </div>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(registrationUrl)}`} 
                      alt="QR Code Pendaftaran" 
                      className="w-20 h-20 border border-slate-200 p-1 bg-white rounded-lg shadow-sm hover:scale-105 transition-transform cursor-zoom-in"
                      onClick={() => {
                        window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(registrationUrl)}`, '_blank')
                      }}
                      title="Klik untuk memperbesar QR Code"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Stat & Table Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Stat card */}
              <div className="lg:col-span-1">
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
              </div>

              {/* Participants table */}
              <div className="lg:col-span-3">
                <Card className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b border-slate-100 pb-4">
                    <CardTitle className="text-sm font-bold text-slate-800">Daftar Pendaftar (Semua Status)</CardTitle>
                    <CardDescription className="text-xs">Berikut adalah daftar lengkap orang yang telah mengisi form pendaftaran.</CardDescription>
                  </CardHeader>
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
                              <TableHead className="font-semibold text-slate-600 text-xs py-3.5 w-[140px] text-right"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {participants.map((p) => (
                              <TableRow key={p.id} className="hover:bg-slate-50/50">
                                <TableCell className="font-semibold text-slate-900 text-xs py-3">{p.full_name}</TableCell>
                                <TableCell className="text-slate-650 text-xs py-3">{p.organization || '-'}</TableCell>
                                <TableCell className="text-slate-500 font-mono text-xs py-3">{maskWhatsapp(p.whatsapp)}</TableCell>
                                <TableCell className="py-3">
                                  {p.status === 'attended' ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-150 text-green-800">
                                      <UserCheck className="w-3 h-3 mr-1" /> Hadir
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-850 border border-amber-200">
                                      Pending
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 text-right pr-4">
                                  {p.status !== 'attended' && (
                                    <Button
                                      disabled={processingCheckIn === p.id}
                                      onClick={() => handleCheckInManual(p.id)}
                                      className="h-8 text-[10px] font-bold bg-indigo-650 hover:bg-indigo-700 text-white"
                                    >
                                      {processingCheckIn === p.id ? "Memproses..." : "Check-in"}
                                    </Button>
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
                        <p className="font-medium text-xs">Belum ada peserta yang mendaftar.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'absensi' && (
          <div className="space-y-6">
            {/* Absensi metrics (Hadir / Belum Hadir) & scanner shortcut */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="shadow-sm border border-slate-200/85 rounded-2xl overflow-hidden bg-white">
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

              <Card className="shadow-sm border border-slate-200/85 rounded-2xl overflow-hidden bg-white">
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

              <Card className="shadow-sm border border-indigo-150 rounded-2xl overflow-hidden bg-indigo-50/10 flex flex-col justify-center p-5">
                <Link href={`/panitia/${params.slug}/scanner`} className="w-full">
                  <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm">
                    <Camera className="h-4.5 w-4.5" /> Buka Scanner Tiket QR
                  </button>
                </Link>
              </Card>
            </div>

            {/* Attendance Title and Add Form toggle */}
            <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <UserCheck className="h-4.5 w-4.5 text-emerald-600" /> Peserta Telah Hadir (Checked-in)
                </h3>
                <p className="text-xs text-slate-500">Daftar jamaah/peserta yang statusnya telah dikonfirmasi hadir.</p>
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
                {participants && participants.filter(p => p.status === 'attended').length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/60">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">Nama Peserta</TableHead>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">Instansi</TableHead>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">No. WA</TableHead>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">Metode Check-in</TableHead>
                          <TableHead className="font-semibold text-slate-600 text-xs py-3.5">Waktu Check-in</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.filter(p => p.status === 'attended').map((p) => (
                          <TableRow key={p.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-semibold text-slate-900 text-xs py-3">{p.full_name}</TableCell>
                            <TableCell className="text-slate-600 text-xs py-3">{p.organization || '-'}</TableCell>
                            <TableCell className="text-slate-500 font-mono text-xs py-3">{maskWhatsapp(p.whatsapp)}</TableCell>
                            <TableCell className="py-3">
                              <span className="capitalize text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                                {p.check_in_method || 'QR Scanner'}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-500 text-xs py-3">
                              {p.checked_in_at ? new Date(p.checked_in_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false}).replace(/\./g, ':') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500">
                    <UserCheck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-xs">Belum ada peserta yang check-in/hadir.</p>
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
