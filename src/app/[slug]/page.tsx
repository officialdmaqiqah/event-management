"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { MapPin, Calendar, Clock, CheckCircle2, Users, Phone, Navigation } from "lucide-react"

// Fungsi hitung jarak Haversine (dalam meter)
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

export default function RegistrationPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successDirect, setSuccessDirect] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: "",
    whatsapp: "",
    gender: "",
    organization: "",
  })
  
  const [customResponses, setCustomResponses] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchEvent()
  }, [])

  const fetchEvent = async () => {
    const { data: eventData, error } = await supabase
      .from('events')
      .select('*')
      .eq('registration_slug', params.slug)
      .eq('status', 'published')
      .single()

    if (error || !eventData) {
      setLoading(false)
      return
    }

    // Hitung jumlah pendaftar saat ini
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', (eventData as any).id)

    setEvent({ ...eventData, current_participants: count || 0 })
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleCustomChange = (fieldId: string, value: any) => {
    setCustomResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleDirectCheckin = async (lat: number, lng: number, formattedName: string, formattedWA: string) => {
    // Generate random code just for DB requirement, even if not used as ticket
    const ticketCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { error: insertError } = await supabase.from('participants').insert([
      {
        event_id: event.id,
        full_name: formattedName,
        whatsapp: formattedWA,
        gender: formData.gender,
        organization: formData.organization,
        ticket_code: ticketCode,
        status: 'attended', // Langsung hadir
        checked_in_at: new Date().toISOString(),
        custom_responses: customResponses

      }
    ])

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
    } else {
      setSuccessDirect(true)
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // Cek Quota
    if (event.quota && event.current_participants >= event.quota) {
      setError("Mohon maaf, kuota pendaftaran untuk event ini sudah penuh.")
      setSubmitting(false)
      return
    }

    // Format Nama (Title Case)
    const formattedName = formData.full_name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Format WhatsApp (Ganti awalan 0 menjadi 62, hilangkan karakter non-digit)
    let formattedWA = formData.whatsapp.replace(/\D/g, '')
    if (formattedWA.startsWith('0')) {
      formattedWA = '62' + formattedWA.substring(1)
    }

    // Update state agar UI berubah (opsional, tapi bagus untuk feedback)
    setFormData(prev => ({ ...prev, full_name: formattedName, whatsapp: formattedWA }))

    // Cek duplikasi nomor WhatsApp untuk event ini menggunakan nomor yang sudah di-format
    const { data: existingParticipant, error: checkError } = await supabase
      .from('participants')
      .select('id')
      .eq('event_id', event.id)
      .eq('whatsapp', formattedWA)
      .maybeSingle()
      
    console.log("Check duplicate WA:", existingParticipant, checkError)

    if (checkError) {
      setError("Nomor WA ini sudah terdaftar")
      setSubmitting(false)
      return
    }

    if (existingParticipant) {
      setError("Nomor WA ini sudah terdaftar")
      setSubmitting(false)
      return
    }

    // Jika mode Direct Check-in
    if (!event.requires_registration) {
      const now = new Date()
      if (event.checkin_start_datetime && now < new Date(event.checkin_start_datetime)) {
        setError(`Absen belum dibuka. Absen akan dibuka pada ${format(new Date(event.checkin_start_datetime), "dd MMM yyyy, HH:mm")}`)
        setSubmitting(false)
        return
      }
      if (event.checkin_end_datetime && now > new Date(event.checkin_end_datetime)) {
        setError(`Absen sudah ditutup sejak ${format(new Date(event.checkin_end_datetime), "dd MMM yyyy, HH:mm")}`)
        setSubmitting(false)
        return
      }

      if (event.latitude && event.longitude) {
        if (!navigator.geolocation) {
          setError("Browser Anda tidak mendukung deteksi lokasi (GPS).")
          setSubmitting(false)
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude
            const userLng = position.coords.longitude
            const distance = getDistance(userLat, userLng, event.latitude, event.longitude)
            
            if (distance > event.radius_meters) {
              setError(`Anda berada di luar area absen! (Jarak Anda: ${distance}m, Maksimal: ${event.radius_meters}m)`)
              setSubmitting(false)
            } else {
              handleDirectCheckin(userLat, userLng, formattedName, formattedWA)
            }
          },
          (err) => {
            setError("Gagal mendapatkan lokasi GPS. Pastikan Anda memberikan izin lokasi pada browser.")
            setSubmitting(false)
          },
          { enableHighAccuracy: true }
        )
        return
      } else {
        // Direct check-in tanpa validasi GPS
        handleDirectCheckin(0, 0, formattedName, formattedWA)
        return
      }
    }

    // Alur Normal (Pre-Registration)
    const ticketCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error: insertError } = await supabase.from('participants').insert([
      {
        event_id: event.id,
        full_name: formattedName,
        whatsapp: formattedWA,
        gender: formData.gender,
        organization: formData.organization,
        ticket_code: ticketCode,
        custom_responses: customResponses

      }
    ])

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
    } else {
      // Kirim WhatsApp (Tidak di-await agar tidak memperlambat UI)
      const ticketUrl = `${window.location.origin}/${params.slug}/ticket/${ticketCode}`
      
      fetch('/api/send-wa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formattedWA,
          nama: formattedName,
          event_id: event.id,
          event_title: event.title,
          link_tiket: ticketUrl
        })
      }).catch(err => console.error("Failed to send WA:", err))

      router.push(`/${params.slug}/success?ticket=${ticketCode}`)
    }
  }

  if (loading) return <div className="p-10 flex h-screen items-center justify-center"><div className="animate-pulse text-indigo-500 font-semibold">Memuat Data Event...</div></div>
  
  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-8 glass shadow-2xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Event Tidak Ditemukan</h2>
          <p className="text-slate-500">Event yang Anda cari tidak ada atau belum dipublikasikan.</p>
        </Card>
      </div>
    )
  }

  if (successDirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-10 glass shadow-2xl border-t-8 border-t-green-500">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Absen Berhasil!</h2>
          <p className="text-slate-600 mb-6">Terima kasih <strong>{formData.full_name}</strong>, kehadiran Anda di <strong>{event.title}</strong> telah tercatat di sistem.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Kembali</Button>
        </Card>
      </div>
    )
  }

  const isDirectCheckin = !event.requires_registration

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-4xl mx-auto space-y-10 relative z-10">
        
        {/* Banner Section */}
        {event.banner_url && (
          <div className="w-full h-64 md:h-80 lg:h-96 rounded-3xl overflow-hidden shadow-2xl relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={event.banner_url} 
              alt="Event Banner" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="text-center space-y-3">
          {event.logo_url && (
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={event.logo_url} 
                alt="Organizer Logo" 
                className="h-20 w-auto object-contain drop-shadow-md"
              />
            </div>
          )}
          
          <span className="px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold tracking-wide uppercase">
            {isDirectCheckin ? 'Form Absensi Kehadiran' : 'Pendaftaran Event'}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">{event.title}</h1>
          <p className="text-xl text-slate-600 font-medium">{event.type}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="space-y-6 lg:col-span-2">
            <Card className="glass border-0 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <CardHeader className="bg-white/40">
                <CardTitle className="text-xl text-slate-800">Detail Pelaksanaan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-4 mt-0.5">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-1">Waktu</div>
                    <div className="text-slate-600 font-medium">
                      {format(new Date(event.start_datetime), "EEEE, dd MMM yyyy")}
                      <br />
                      {format(new Date(event.start_datetime), "HH:mm")} 
                      {event.end_datetime && ` - ${format(new Date(event.end_datetime), "HH:mm")}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-4 mt-0.5">
                    <MapPin className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-1">Tempat</div>
                    <div className="text-slate-600 font-medium leading-relaxed">{event.location}</div>
                  </div>
                </div>
                
                {event.organizer_name && (
                  <div className="flex items-start">
                    <div className="bg-indigo-100 p-2 rounded-lg mr-4 mt-0.5">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-1">Penyelenggara</div>
                      <div className="text-slate-600 font-medium leading-relaxed">{event.organizer_name}</div>
                    </div>
                  </div>
                )}

                {event.organizer_contact && (
                  <div className="flex items-start">
                    <div className="bg-indigo-100 p-2 rounded-lg mr-4 mt-0.5">
                      <Phone className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-1">Kontak Person</div>
                      <div className="text-slate-600 font-medium leading-relaxed">{event.organizer_contact}</div>
                    </div>
                  </div>
                )}
                
                {(event.description || event.agenda) && <hr className="border-slate-200" />}
                
                {event.description && (
                  <div>
                    <div className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-2">Deskripsi</div>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{event.description}</p>
                  </div>
                )}
                {event.agenda && (
                  <div>
                    <div className="font-semibold text-slate-700 text-sm uppercase tracking-wider mb-2">Agenda</div>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{event.agenda}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="glass shadow-2xl border border-white/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
              
              <CardHeader className="relative z-10 pb-2">
                <CardTitle className="text-2xl text-slate-800">Data Peserta</CardTitle>
                <CardDescription className="text-base text-slate-500">
                  {isDirectCheckin 
                    ? "Isi form di bawah ini untuk mengonfirmasi kehadiran Anda di lokasi." 
                    : "Silakan isi data diri Anda untuk mendapatkan E-Ticket QR Code."}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-4">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200 font-medium flex items-start">
                      <span className="block">{error}</span>
                    </div>
                  )}
                  
                  {isDirectCheckin && event.latitude && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                      <Navigation className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 font-medium">
                        Absen event ini menggunakan deteksi Lokasi (GPS). Pastikan Anda memberikan izin akses lokasi pada browser HP Anda.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-slate-700 font-semibold">Nama Lengkap *</Label>
                    <Input id="full_name" name="full_name" required value={formData.full_name} onChange={handleChange} className="bg-white/80 h-12" placeholder="Cth: Budi Santoso" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-slate-700 font-semibold">Nomor WhatsApp *</Label>
                      <Input id="whatsapp" name="whatsapp" required value={formData.whatsapp} onChange={handleChange} className="bg-white/70 h-11 border-slate-200 focus:ring-indigo-500 rounded-xl" placeholder="08..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-slate-700 font-semibold">Jenis Kelamin *</Label>
                      <select 
                        id="gender" 
                        name="gender" 
                        required 
                        value={formData.gender} 
                        onChange={handleChange} 
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                      >
                        <option value="" disabled>Pilih Jenis Kelamin</option>
                        <option value="Pria">Pria</option>
                        <option value="Wanita">Wanita</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-slate-700 font-semibold">Instansi / Organisasi</Label>
                    <Input id="organization" name="organization" value={formData.organization} onChange={handleChange} className="bg-white/80 h-12" placeholder="Opsional" />
                  </div>

                  {event.custom_fields && event.custom_fields.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <h4 className="font-semibold text-slate-800 text-lg">Informasi Tambahan</h4>
                      {event.custom_fields.map((field: any) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={`custom_${field.id}`} className="text-slate-700 font-semibold">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          {field.type === 'textarea' ? (
                            <textarea
                              id={`custom_${field.id}`}
                              required={field.required}
                              value={customResponses[field.id] || ""}
                              onChange={(e) => handleCustomChange(field.id, e.target.value)}
                              className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                            />
                          ) : (
                            <Input
                              id={`custom_${field.id}`}
                              type={field.type === 'number' ? 'number' : 'text'}
                              required={field.required}
                              value={customResponses[field.id] || ""}
                              onChange={(e) => handleCustomChange(field.id, e.target.value)}
                              className="bg-white/70 h-11 border-slate-200 focus:ring-indigo-500 rounded-xl"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-14 text-lg mt-8 font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all rounded-xl" disabled={submitting}>
                    {submitting 
                      ? "Memproses..." 
                      : (isDirectCheckin ? "Absen Kehadiran Sekarang" : "Daftar & Dapatkan Tiket")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
