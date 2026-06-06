"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Scanner } from '@yudiel/react-qr-scanner'
import { Camera, Search, UserCheck, CheckCircle2 } from "lucide-react"

export default function CheckinPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [event, setEvent] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: eventData } = await supabase.from('events').select('*').eq('id', params.id).single()
    if (eventData) setEvent(eventData)

    const { data: participantsData } = await supabase.from('participants').select('*').eq('event_id', params.id).order('created_at', { ascending: false })
    if (participantsData) setParticipants(participantsData)

    setLoading(false)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setMessage(null)
  }

  const handleCheckin = async (participantId: string, currentStatus: string) => {
    if (currentStatus === 'attended') return

    const { error } = await supabase
      .from('participants')
      .update({ 
        status: 'attended',
        checked_in_at: new Date().toISOString()
      })
      .eq('id', participantId)

    if (error) {
      setMessage({ text: 'Gagal check-in: ' + error.message, type: 'error' })
    } else {
      const p = participants.find(p => p.id === participantId)
      setMessage({ text: `Berhasil check-in: ${p?.full_name}`, type: 'success' })
      // Update local state
      setParticipants(prev => prev.map(p => 
        p.id === participantId 
          ? { ...p, status: 'attended', checked_in_at: new Date().toISOString() } 
          : p
      ))
      
      // Auto clear scanner text after 3 seconds
      setTimeout(() => {
        setSearchQuery("")
        setMessage(null)
      }, 3000)
    }
  }

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const scannedCode = result[0].rawValue
      setSearchQuery(scannedCode)
      
      // Auto check-in if found
      const match = participants.find(p => p.ticket_code === scannedCode)
      if (match) {
        if (match.status !== 'attended') {
          handleCheckin(match.id, match.status)
        } else {
          setMessage({ text: `Peserta ${match.full_name} sudah check-in sebelumnya!`, type: 'error' })
        }
      } else {
        setMessage({ text: `Tiket ${scannedCode} tidak ditemukan!`, type: 'error' })
      }
      
      // Pause scanner momentarily by closing it
      setShowScanner(false)
    }
  }

  const filteredParticipants = participants.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.whatsapp.includes(searchQuery)
  )

  if (loading) return <div className="p-10 flex h-screen items-center justify-center"><div className="animate-pulse text-indigo-500 font-semibold">Memuat Data...</div></div>
  if (!event) return <div className="p-10 text-center text-red-500">Event tidak ditemukan</div>

  const totalRegistered = participants.length
  const totalAttended = participants.filter(p => p.status === 'attended').length

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Check-in Peserta
          </h1>
          <p className="text-slate-500 font-medium">{event.title}</p>
        </div>
        <Link href={`/admin/events/${params.id}`}>
          <Button variant="outline" className="border-indigo-200 text-indigo-700">Kembali ke Detail Event</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass shadow-xl border-t-4 border-t-blue-500 md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Cari & Verifikasi Tiket</CardTitle>
                <CardDescription>Scan QR Code tiket atau ketik manual</CardDescription>
              </div>
              <Button 
                onClick={() => setShowScanner(!showScanner)} 
                variant={showScanner ? "destructive" : "default"}
                className={!showScanner ? "bg-indigo-600 hover:bg-indigo-700" : ""}
              >
                <Camera className="w-4 h-4 mr-2" />
                {showScanner ? "Tutup Kamera" : "Scan QR"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {showScanner && (
              <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center relative shadow-inner">
                <Scanner onScan={handleScan} />
                <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
                  Arahkan QR Code ke kamera
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                placeholder="Ketik Nama, No WA, atau Kode Tiket..." 
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 h-12 bg-white/80 border-slate-200 text-lg shadow-sm"
                autoFocus
              />
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium border flex items-start gap-3 shadow-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <div className="w-5 h-5 shrink-0 bg-red-200 rounded-full flex items-center justify-center text-red-700 font-bold">!</div>}
                <span>{message.text}</span>
              </div>
            )}

            <div className="mt-6 border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white/50 shadow-sm overflow-hidden">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map(p => (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/80 transition-colors gap-4">
                    <div>
                      <div className="font-semibold text-slate-900 text-lg">{p.full_name}</div>
                      <div className="text-sm text-slate-500 font-medium">Instansi: {p.organization || '-'} | WA: {p.whatsapp}</div>
                      <div className="text-xs font-mono mt-2 inline-block bg-slate-100 px-2 py-1 rounded text-slate-600">Tiket: {p.ticket_code}</div>
                    </div>
                    <div>
                      {p.status === 'attended' ? (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-700 border border-green-200">
                          <UserCheck className="w-4 h-4 mr-2" />
                          Sudah Hadir
                        </span>
                      ) : (
                        <Button 
                          onClick={() => handleCheckin(p.id, p.status)}
                          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 h-10 px-6 rounded-full font-medium shadow-md"
                        >
                          Check-in
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 font-medium">
                  {searchQuery ? 'Peserta tidak ditemukan.' : 'Ketik untuk mencari peserta atau scan QR.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass border-t-4 border-t-indigo-500 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Statistik Kehadiran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
                <div className="text-indigo-900 font-medium">Total Pendaftar</div>
                <div className="text-2xl font-bold text-indigo-700">{totalRegistered}</div>
              </div>
              <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex justify-between items-center">
                <div className="text-green-900 font-medium">Sudah Hadir</div>
                <div className="text-2xl font-bold text-green-700">{totalAttended}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                <div className="text-slate-600 font-medium">Belum Hadir</div>
                <div className="text-2xl font-bold text-slate-700">{totalRegistered - totalAttended}</div>
              </div>
              
              <div className="pt-4">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600" 
                    style={{ width: totalRegistered > 0 ? `${(totalAttended / totalRegistered) * 100}%` : '0%' }}
                  ></div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-2 font-medium">
                  {totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0}% Kehadiran
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
