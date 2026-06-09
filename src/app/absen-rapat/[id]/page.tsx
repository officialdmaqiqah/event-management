"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, UserCheck, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react"

// MAKT Coordinates
const MAKT_LAT = -2.12075
const MAKT_LNG = 106.1143889
const MAX_RADIUS_METERS = 100

// Helper to calculate distance
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // Radius of the earth in m
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) 
  return R * c
}

export default function AbsenRapatPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [pengajuan, setPengajuan] = useState<any>(null)

  const [form, setForm] = useState({
    full_name: "",
    whatsapp: "",
    organization: ""
  })

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from("pengajuan_peminjaman")
        .select("*")
        .eq("id", id)
        .single()
      
      if (error || !data) {
        setErrorMsg("Rapat atau Kegiatan tidak ditemukan.")
      } else {
        setPengajuan(data)
      }
      setLoading(false)
    }
    fetchEvent()
  }, [id])

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckingIn(true)
    setErrorMsg("")

    if (!navigator.geolocation) {
      setErrorMsg("Browser Anda tidak mendukung deteksi lokasi (GPS).")
      setCheckingIn(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const distance = getDistanceFromLatLonInM(latitude, longitude, MAKT_LAT, MAKT_LNG)

        if (distance > MAX_RADIUS_METERS) {
          setErrorMsg(`Anda berada di luar area Masjid (Jarak: ${Math.round(distance)}m). Maksimal jarak adalah ${MAX_RADIUS_METERS}m untuk dapat absen.`)
          setCheckingIn(false)
          return
        }

        try {
          const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase()
          const { error } = await supabase.from("participants").insert({
            event_request_id: pengajuan.id,
            full_name: form.full_name,
            whatsapp: form.whatsapp,
            organization: form.organization,
            ticket_quantity: 1,
            ticket_code: ticketCode,
            status: 'attended',
            checked_in_at: new Date().toISOString(),
            attendance_type: 'internal',
            check_in_method: 'gps'
          })

          if (error) throw error
          setSuccess(true)
        } catch (err: any) {
          console.error(err)
          setErrorMsg("Gagal menyimpan data absensi.")
        } finally {
          setCheckingIn(false)
        }
      },
      (err) => {
        console.error(err)
        setErrorMsg("Gagal mendapatkan lokasi GPS. Pastikan Anda mengizinkan akses lokasi pada browser HP Anda.")
        setCheckingIn(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Memuat...</div>

  if (errorMsg && !pengajuan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="pt-6 text-center text-red-600 font-medium">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            {errorMsg}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
        <Card className="max-w-md w-full shadow-lg border-green-200">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Absen Berhasil!</h2>
            <p className="text-slate-500 mt-2">Terima kasih <strong>{form.full_name}</strong> telah hadir di {pengajuan.nama_event}.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center">
      <div className="max-w-md w-full mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-3">
          <ShieldCheck className="h-3.5 w-3.5" /> Absensi Internal Rapat
        </span>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{pengajuan.nama_event}</h1>
        <p className="text-sm text-slate-500 mt-1">{pengajuan.area_fasilitas.join(", ")}</p>
      </div>

      <Card className="max-w-md w-full shadow-md border border-slate-200">
        <CardHeader className="bg-white pb-4 border-b border-slate-100">
          <CardTitle className="text-lg">Form Kehadiran</CardTitle>
          <CardDescription>Isi data diri Anda dan pastikan GPS aktif untuk absensi.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 bg-slate-50/50">
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleCheckIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Masukkan nama Anda" />
            </div>
            <div className="space-y-1.5">
              <Label>Nomor WhatsApp <span className="text-red-500">*</span></Label>
              <Input required type="tel" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="08..." />
            </div>
            <div className="space-y-1.5">
              <Label>Jabatan / Organisasi</Label>
              <Input value={form.organization} onChange={e => setForm({...form, organization: e.target.value})} placeholder="Divisi atau instansi Anda" />
            </div>

            <div className="pt-4 space-y-3">
              <div className="bg-blue-50/80 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                <p>Sistem akan memverifikasi bahwa Anda berada di area radius Masjid Agung Kubah Timah menggunakan GPS perangkat Anda.</p>
              </div>

              <Button type="submit" disabled={checkingIn} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-sm font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2">
                {checkingIn ? (
                  <>Memeriksa Lokasi GPS...</>
                ) : (
                  <><UserCheck className="h-4.5 w-4.5" /> Hadir Rapat (GPS)</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
