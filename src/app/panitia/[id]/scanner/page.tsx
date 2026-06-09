"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Scanner } from '@yudiel/react-qr-scanner'
import { Camera, Search, UserCheck, CheckCircle2, ArrowLeft } from "lucide-react"

function maskWhatsapp(wa: string) {
  if (!wa) return "-"
  if (wa.length <= 6) return wa
  return wa.substring(0, 4) + "****" + wa.substring(wa.length - 3)
}

export default function GuestScannerPage({ params }: { params: { id: string } }) {
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
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()
      
    if (eventData) setEvent(eventData)

    if (!eventError && eventData) {
      const { data: participantsData } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', params.id)
        .order('created_at', { ascending: false })
        
      if (participantsData) setParticipants(participantsData)
    }

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
      
      // Auto clear text after 3 seconds
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
    p.ticket_code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <div className="p-10 flex min-h-screen items-center justify-center bg-slate-50"><div className="animate-pulse text-indigo-500 font-semibold text-lg">Memuat Scanner...</div></div>
  if (!event) return <div className="p-10 flex min-h-screen items-center justify-center bg-slate-50 text-red-500 font-bold">Akses Ditolak: Event Tidak Valid</div>

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Panel */}
      <div className="bg-indigo-900 text-white pb-20 pt-6 px-4 border-b border-indigo-800">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href={`/panitia/${params.id}`}>
            <Button variant="ghost" className="text-indigo-200 hover:text-white hover:bg-indigo-800 -ml-2">
              <ArrowLeft className="h-5 w-5 mr-1" /> Dasbor
            </Button>
          </Link>
          <div className="text-sm font-bold bg-indigo-800 px-3 py-1 rounded-full text-indigo-200">
            Scanner Mode
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Check-in Tiket</h1>
          <p className="text-indigo-300 text-sm">{event.title}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 pb-16">
        <Card className="glass shadow-xl border-t-4 border-t-emerald-500 rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/80">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Kamera Scanner</CardTitle>
                <CardDescription>Arahkan kamera ke QR Code di HP peserta</CardDescription>
              </div>
              <Button 
                onClick={() => setShowScanner(!showScanner)} 
                variant={showScanner ? "destructive" : "default"}
                className={!showScanner ? "bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200" : "shadow-md"}
              >
                <Camera className="w-4 h-4 mr-2" />
                {showScanner ? "Tutup" : "Buka Kamera"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 bg-slate-50/50">
            
            {showScanner && (
              <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center relative shadow-inner mb-4">
                <Scanner onScan={handleScan} />
                <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm font-medium drop-shadow-md">
                  Posisikan QR Code di tengah layar
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                placeholder="Atau ketik Nama / Kode Tiket..." 
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 h-14 bg-white border-slate-200 text-base shadow-sm rounded-xl"
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

            <div className="mt-6 border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-sm overflow-hidden">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map(p => (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{p.full_name}</div>
                      <div className="text-xs text-slate-500 font-medium mb-1">
                        Instansi: {p.organization || '-'} | WA: {maskWhatsapp(p.whatsapp)}
                      </div>
                      <div className="text-xs font-mono inline-block bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">Tiket: {p.ticket_code}</div>
                    </div>
                    <div>
                      {p.status === 'attended' ? (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 w-full justify-center sm:w-auto">
                          <UserCheck className="w-4 h-4 mr-1.5" />
                          Telah Hadir
                        </span>
                      ) : (
                        <Button 
                          onClick={() => handleCheckin(p.id, p.status)}
                          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 h-10 px-6 rounded-full font-medium shadow-md text-sm"
                        >
                          Check-in Manual
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-500 font-medium">
                  {searchQuery ? 'Peserta tidak ditemukan.' : 'Ketik untuk mencari peserta secara manual.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
