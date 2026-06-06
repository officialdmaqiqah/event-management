"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import QRCode from "react-qr-code"
import { MapPin, Navigation, Calendar, CheckCircle2 } from "lucide-react"

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.floor(R * c);
}

export default function TicketPage({ params }: { params: { slug: string, ticket_code: string } }) {
  const supabase = createClient()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

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

    const { data: participantData, error: partError } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', eventData.id)
      .eq('ticket_code', params.ticket_code)
      .single()

    if (partError || !participantData) {
      setLoading(false)
      return
    }

    setData({ event: eventData, participant: participantData })
    setLoading(false)
  }

  const handleSelfCheckin = () => {
    setCheckingIn(true)
    setError(null)

    if (!data.event.latitude || !data.event.longitude) {
      setError("Event ini tidak mengaktifkan fitur Geotagging GPS.")
      setCheckingIn(false)
      return
    }

    const now = new Date()
    if (data.event.checkin_start_datetime && now < new Date(data.event.checkin_start_datetime)) {
      setError(`Absen belum dibuka. Absen akan dibuka pada ${format(new Date(data.event.checkin_start_datetime), "dd MMM yyyy, HH:mm")}`)
      setCheckingIn(false)
      return
    }

    if (data.event.checkin_end_datetime && now > new Date(data.event.checkin_end_datetime)) {
      setError(`Absen sudah ditutup sejak ${format(new Date(data.event.checkin_end_datetime), "dd MMM yyyy, HH:mm")}`)
      setCheckingIn(false)
      return
    }

    if (!navigator.geolocation) {
      setError("Browser Anda tidak mendukung deteksi lokasi (GPS).")
      setCheckingIn(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        const distance = getDistance(userLat, userLng, data.event.latitude, data.event.longitude)
        
        if (distance > data.event.radius_meters) {
          setError(`Anda berada di luar area absen! (Jarak Anda: ${distance}m, Maksimal: ${data.event.radius_meters}m)`)
          setCheckingIn(false)
        } else {
          // Success
          const { error: updateError } = await supabase
            .from('participants')
            .update({ 
              status: 'attended', 
              checked_in_at: new Date().toISOString() 
            })
            .eq('id', data.participant.id)

          if (updateError) {
            setError(updateError.message)
          } else {
            // Update local state
            setData({
              ...data,
              participant: {
                ...data.participant,
                status: 'attended',
                checked_in_at: new Date().toISOString()
              }
            })
          }
          setCheckingIn(false)
        }
      },
      (err) => {
        setError("Gagal mendapatkan lokasi GPS. Pastikan Anda memberikan izin lokasi.")
        setCheckingIn(false)
      },
      { enableHighAccuracy: true }
    )
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-pulse text-indigo-500 font-semibold">Memuat E-Ticket...</div></div>
  
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-8 glass shadow-2xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Tiket Tidak Valid</h2>
          <p className="text-slate-500">Tiket tidak ditemukan di sistem kami.</p>
        </Card>
      </div>
    )
  }

  const { event, participant } = data
  const isAttended = participant.status === 'attended'

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-md w-full relative z-10">
        
        <Card className="glass overflow-hidden shadow-2xl border-0 relative">
          <div className="h-4 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="p-8 pb-4 text-center">
            <h2 className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-2">E-Ticket</h2>
            <h1 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">{event.title}</h1>
            {event.organizer_name && (
              <p className="text-sm font-medium text-slate-600 mb-1">Oleh: {event.organizer_name}</p>
            )}
            <p className="text-sm text-slate-500">{format(new Date(event.start_datetime), "dd MMMM yyyy, HH:mm")}</p>
          </div>

          <div className="relative flex justify-center py-6 px-8 border-y border-dashed border-slate-300 bg-white/40">
            {/* Cutout corners */}
            <div className="absolute -left-4 top-1/2 -mt-4 w-8 h-8 bg-slate-50 rounded-full border-r border-slate-300"></div>
            <div className="absolute -right-4 top-1/2 -mt-4 w-8 h-8 bg-slate-50 rounded-full border-l border-slate-300"></div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <QRCode 
                value={participant.ticket_code} 
                size={180} 
                level="H"
                fgColor={isAttended ? "#64748b" : "#0f172a"} 
              />
            </div>
            
            {isAttended && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-10">
                <div className="text-center transform rotate-[-15deg] border-4 border-green-500 rounded-lg p-3 py-1">
                  <span className="text-4xl font-black text-green-500 uppercase tracking-widest">Digunakan</span>
                </div>
              </div>
            )}
          </div>

          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Kode Tiket</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-slate-900">{participant.ticket_code}</p>
            </div>

            <div className="bg-slate-100/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 text-sm">Nama Lengkap</span>
                <span className="text-slate-900 font-medium text-sm text-right">{participant.full_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 text-sm">Jenis Kelamin</span>
                <span className="text-slate-900 font-medium text-sm text-right">{participant.gender || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 text-sm">Instansi</span>
                <span className="text-slate-900 font-medium text-sm text-right">{participant.organization || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Lokasi</span>
                <span className="text-slate-900 font-medium text-sm text-right truncate max-w-[200px]">{event.location}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200 text-center font-medium">
                {error}
              </div>
            )}

            {!isAttended ? (
              <div className="pt-2">
                <p className="text-xs text-center text-slate-500 mb-3">
                  Tunjukkan QR Code ini kepada panitia, atau lakukan <strong>Self Check-in</strong> jika fitur GPS tersedia.
                </p>
                {event.latitude && event.longitude && (
                  <Button 
                    onClick={handleSelfCheckin} 
                    disabled={checkingIn}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg text-base rounded-xl font-semibold"
                  >
                    <Navigation className="w-5 h-5 mr-2" />
                    {checkingIn ? "Memeriksa GPS..." : "Self Check-in (GPS)"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="pt-2">
                <div className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span className="font-semibold text-sm">Anda telah berhasil check-in!</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
