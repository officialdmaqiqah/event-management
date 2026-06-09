"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Users, UserCheck, Camera, ShieldCheck, MapPin, Calendar } from "lucide-react"

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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
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
          
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
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

          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
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

        <Card className="shadow-sm border border-slate-200">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Daftar Kehadiran Live</CardTitle>
                <CardDescription>Data otomatis diperbarui jika ada yang mendaftar atau check-in</CardDescription>
              </div>
              {/* Live Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-green-700">LIVE</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {participants && participants.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-600">Nama Peserta</TableHead>
                      <TableHead className="font-semibold text-slate-600">Instansi</TableHead>
                      <TableHead className="font-semibold text-slate-600">No. WA</TableHead>
                      <TableHead className="font-semibold text-slate-600">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p) => (
                      <TableRow key={p.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">{p.full_name}</TableCell>
                        <TableCell className="text-slate-600">{p.organization || '-'}</TableCell>
                        <TableCell className="text-slate-500 font-mono text-xs">{maskWhatsapp(p.whatsapp)}</TableCell>
                        <TableCell>
                          {p.status === 'attended' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <UserCheck className="w-3.5 h-3.5 mr-1" /> Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
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
                <p className="font-medium">Belum ada peserta yang mendaftar.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
