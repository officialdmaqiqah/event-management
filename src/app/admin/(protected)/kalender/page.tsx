"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, 
  isWithinInterval 
} from "date-fns"
import { id as localeID } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  ChevronLeft, ChevronRight, Search, Filter, 
  MapPin, Clock, Info, User, List, Grid, CalendarDays, EyeOff, Eye, Sparkles, BookOpen,
  FileImage, X, CalendarPlus, Copy, Share2
} from "lucide-react"
import Link from "next/link"

type PengajuanEvent = {
  id: string
  nama_event: string
  jenis_event: string
  tanggal_mulai: string
  tanggal_selesai: string
  area_fasilitas: string[]
  privacy_event: 'detail_publik' | 'umum_saja' | 'rahasia' | 'publik_terbatas'
  nama_pemohon?: string
  nama_lembaga?: string | null
  deskripsi_kegiatan?: string
  is_public_event?: boolean
  public_slug?: string
  banner_url?: string
  nama_ustadz?: string
  judul_kajian?: string
}

// SVG Icons for Social Media Share
const WhatsAppIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.713-1.458L0 24zm6.59-3.791c1.56.927 3.494 1.441 5.393 1.442 5.593 0 10.144-4.55 10.146-10.143.001-2.71-1.05-5.257-2.959-7.17-1.91-1.913-4.453-2.966-7.164-2.967-5.593 0-10.144 4.55-10.147 10.145-.001 1.958.513 3.868 1.488 5.568l-.587 2.144 2.193-.575zM17.41 14.286c-.294-.148-1.741-.859-2.01-.958-.269-.099-.466-.148-.662.146-.196.294-.76.958-.931 1.155-.171.196-.343.221-.637.073-.294-.148-1.243-.458-2.37-1.465-.877-.782-1.47-1.747-1.641-2.042-.172-.294-.018-.453.13-.601.133-.133.294-.343.441-.515.147-.171.196-.294.294-.49.098-.196.049-.367-.024-.515-.074-.148-.662-1.597-.908-2.189-.24-.578-.48-.5-.662-.51-.171-.007-.367-.007-.564-.007-.196 0-.515.074-.784.368-.269.294-1.029.1-1.029 2.454 0 1.447 1.054 2.846 1.201 3.042.147.196 2.074 3.168 5.023 4.444.702.304 1.25.485 1.677.62.705.224 1.347.193 1.854.117.564-.084 1.741-.711 1.986-1.396.246-.686.246-1.275.172-1.396-.073-.122-.269-.196-.564-.343z"/>
  </svg>
)

const TelegramIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.61l-1.89 8.92c-.14.63-.51.79-1.04.49l-2.88-2.12-1.39 1.34c-.15.15-.28.28-.58.28l.2-2.94 5.36-4.84c.23-.21-.05-.32-.35-.12L8.27 13.5l-2.85-.89c-.62-.19-.63-.62.13-.92L16.63 7.42c.51-.19.96.11.93 1.19z" />
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

// Helper functions for sharing & calendar
const getEventUrl = (event: any) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://event.kubahtimah.com'
  const base = origin.includes('localhost') ? 'https://event.kubahtimah.com' : origin
  return event.public_slug ? `${base}/${event.public_slug}` : `${base}/kalender`
}

const formatShareDate = (startStr: string, endStr: string) => {
  try {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const formatDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(start)
    const formatTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
    return { date: formatDay, time: formatTime }
  } catch (e) {
    return { date: '-', time: '-' }
  }
}

const formatUTC = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  } catch (e) {
    return ''
  }
}

const generateShareText = (event: any) => {
  const { date, time } = formatShareDate(event.tanggal_mulai, event.tanggal_selesai)
  const eventUrl = getEventUrl(event)
  
  if (event.nama_ustadz || event.judul_kajian) {
    return `🕌 *HADIRILAH & SYIARKANLAH KAJIAN ISLAM* 🕌\n*Masjid Agung Kubah Timah*\n\n📌 *TEMA KAJIAN:*\n👉 "${event.judul_kajian || event.nama_event}"\n\n👤 *Narasumber/Ustadz:*\nUst. ${event.nama_ustadz || 'Belum ditentukan'}\n\n📅 *WAKTU PELAKSANAAN:*\n• Hari/Tanggal: ${date}\n• Waktu: ${time} WIB\n• Lokasi: ${(event.area_fasilitas as string[]).join(', ')}\n\n---\n🔗 *Detail Informasi & Pendaftaran:*\n${eventUrl}`
  } else {
    return `📢 *INFORMASI KEGIATAN MAKT* 📢\n*Masjid Agung Kubah Timah*\n\n📅 *${event.nama_event}*\n_${event.jenis_event}_\n\n• Waktu: ${date} (${time} WIB)\n• Lokasi: ${(event.area_fasilitas as string[]).join(', ')}\n\n---\n🔗 *Detail Selengkapnya:*\n${eventUrl}`
  }
}

const handleWhatsAppShare = (event: any) => {
  const text = generateShareText(event)
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
}

const handleTelegramShare = (event: any) => {
  const text = generateShareText(event)
  const eventUrl = getEventUrl(event)
  window.open(`https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(text)}`, '_blank')
}

const handleFacebookShare = (event: any) => {
  const eventUrl = getEventUrl(event)
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank')
}

const handleTwitterShare = (event: any) => {
  const eventUrl = getEventUrl(event)
  const text = `Hadirilah kegiatan "${event.nama_event}" di Masjid Agung Kubah Timah!`
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(eventUrl)}`, '_blank')
}

const handleCopyText = async (event: any) => {
  const text = generateShareText(event)
  try {
    await navigator.clipboard.writeText(text)
    alert("Teks undangan berhasil disalin!")
  } catch (err) {
    console.error("Gagal menyalin teks", err)
  }
}

const handleGoogleCalendar = (event: any) => {
  const eventUrl = getEventUrl(event)
  const startDateUTC = formatUTC(event.tanggal_mulai)
  const endDateUTC = formatUTC(event.tanggal_selesai)
  const details = `${event.deskripsi_kegiatan || ''}\n\nDetail Event: ${eventUrl}`
  const location = `${(event.area_fasilitas as string[]).join(', ')} - Masjid Agung Kubah Timah`
  
  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.nama_event)}&dates=${startDateUTC}/${endDateUTC}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
  window.open(gCalUrl, '_blank')
}

const handleDownloadICS = (event: any) => {
  const eventUrl = getEventUrl(event)
  const startDateUTC = formatUTC(event.tanggal_mulai)
  const endDateUTC = formatUTC(event.tanggal_selesai)
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Masjid Agung Kubah Timah//Jadwal Event//ID',
    'BEGIN:VEVENT',
    `UID:${event.id}@kubahtimah.com`,
    `DTSTAMP:${startDateUTC}`,
    `DTSTART:${startDateUTC}`,
    `DTEND:${endDateUTC}`,
    `SUMMARY:${event.nama_event}`,
    `DESCRIPTION:${(event.deskripsi_kegiatan || '').replace(/\n/g, '\\n')}\\n\\nDetail: ${eventUrl}`,
    `LOCATION:${(event.area_fasilitas as string[]).join(', ')} - Masjid Agung Kubah Timah`,
    `URL:${eventUrl}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${event.nama_event.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function AdminCalendarPage() {
  const supabase = createClient()
  
  const [events, setEvents] = useState<PengajuanEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [showFilters, setShowFilters] = useState(false)
  const [previewFlyer, setPreviewFlyer] = useState<string | null>(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showCalMenu, setShowCalMenu] = useState(false)
  
  // Filters
  const [search, setSearch] = useState("")
  const [filterJenis, setFilterJenis] = useState("")
  const [filterArea, setFilterArea] = useState("")
  const [jenisOptions, setJenisOptions] = useState<string[]>([])
  
  // Modal Details
  const [selectedEvent, setSelectedEvent] = useState<PengajuanEvent | null>(null)
  
  const AREA_OPTIONS = [
    "Ruang Utama (Masjid)", "Aula Serbaguna", "Halaman Utama", 
    "Ruang Rapat Lt. 1", "Ruang Rapat Lt. 2", "Perpustakaan", 
    "Lapangan Parkir", "Ruang Kelas / TPQ"
  ]

  useEffect(() => {
    fetchEvents()
    fetchJenisOptions()
  }, [])

  const fetchJenisOptions = async () => {
    const { data } = await supabase.from('jenis_event').select('name').order('name')
    if (data) setJenisOptions((data as any[]).map(d => d.name))
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      // 1. Fetch pengajuan
      const { data: pengajuanData, error: pengajuanError } = await supabase
        .from("pengajuan_peminjaman")
        .select(`
          id, nama_event, jenis_event, tanggal_mulai, tanggal_selesai, 
          area_fasilitas, privacy_event, nama_pemohon, nama_lembaga, deskripsi_kegiatan, nama_ustadz, judul_kajian, url_flyer
        `)
        .eq("status", "approved")
      
      if (pengajuanError) throw pengajuanError

      // 2. Fetch public events
      const { data: publicEventsData, error: publicEventsError } = await supabase
        .from("events")
        .select(`
          id, title, type, start_datetime, end_datetime, location, 
          organizer_name, description, registration_slug, event_request_id, banner_url
        `)
        .eq("status", "published")

      if (publicEventsError) throw publicEventsError

      // 3. Merge data
      const mergedEvents: PengajuanEvent[] = []
      const linkedRequestIds = new Set()

      if (publicEventsData) {
        (publicEventsData as any[]).forEach(pe => {
          if (pe.event_request_id) linkedRequestIds.add(pe.event_request_id)
          
          const correspondingPengajuan = (pengajuanData as any[])?.find(p => p.id === pe.event_request_id)
          
          mergedEvents.push({
            id: pe.id,
            nama_event: pe.title,
            jenis_event: pe.type,
            tanggal_mulai: pe.start_datetime,
            tanggal_selesai: pe.end_datetime || pe.start_datetime,
            area_fasilitas: [pe.location],
            privacy_event: 'detail_publik', 
            nama_pemohon: pe.organizer_name || 'Admin MAKT',
            nama_lembaga: null,
            deskripsi_kegiatan: pe.description || undefined,
            is_public_event: true,
            public_slug: pe.registration_slug,
            banner_url: pe.banner_url || correspondingPengajuan?.url_flyer || undefined
          })
        })
      }

      if (pengajuanData) {
        (pengajuanData as any[]).forEach(p => {
          if (!linkedRequestIds.has(p.id)) {
            mergedEvents.push({
              ...(p as PengajuanEvent),
              is_public_event: false,
              banner_url: p.url_flyer || undefined
            })
          }
        })
      }

      setEvents(mergedEvents)
    } catch (err) {
      console.error("Gagal load admin calendar events:", err)
    } finally {
      setLoading(false)
    }
  }

  const nextTime = () => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))
  const prevTime = () => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))
  const goToday = () => setCurrentDate(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(viewMode === 'month' ? monthStart : currentDate, { weekStartsOn: 1 })
  const endDate = endOfWeek(viewMode === 'month' ? monthEnd : currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const filteredEvents = events.filter(ev => {
    if (search && !ev.nama_event.toLowerCase().includes(search.toLowerCase())) return false
    if (filterJenis && ev.jenis_event !== filterJenis) return false
    if (filterArea && !ev.area_fasilitas.includes(filterArea)) return false
    return true
  })

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(ev => {
      const eStart = new Date(ev.tanggal_mulai)
      const eEnd = new Date(ev.tanggal_selesai)
      return isWithinInterval(day, {
        start: new Date(eStart.setHours(0,0,0,0)), 
        end: new Date(eEnd.setHours(23,59,59,999))
      })
    }).sort((a, b) => new Date(a.tanggal_mulai).getTime() - new Date(b.tanggal_mulai).getTime())
  }

  return (
    <div className="space-y-6">
      {/* Title & View Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kalender Master Admin</h1>
          <p className="text-sm text-slate-500">Tampilan lengkap seluruh jadwal kegiatan (termasuk Rahasia).</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
          <Button 
            variant={viewMode === 'month' ? 'default' : 'ghost'} size="sm" 
            onClick={() => setViewMode('month')}
            className={viewMode === 'month' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}
          >
            <Grid className="h-4 w-4 mr-1.5" /> Bulan
          </Button>
          <Button 
            variant={viewMode === 'week' ? 'default' : 'ghost'} size="sm" 
            onClick={() => setViewMode('week')}
            className={viewMode === 'week' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}
          >
            <List className="h-4 w-4 mr-1.5" /> Minggu
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader 
          className="pb-3 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors p-4"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex flex-row items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600" />
            <div className="font-bold text-slate-800 text-sm">Filter Pencarian</div>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-600 px-2">
            {showFilters ? "Sembunyikan" : "Tampilkan"}
          </Button>
        </CardHeader>
        {showFilters && (
          <CardContent className="p-4 pt-0 flex flex-col md:flex-row gap-4 border-t border-slate-100 mt-2">
            <div className="relative flex-1 pt-2 md:pt-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari event..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select 
              value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
              className="flex h-10 w-full md:w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 mt-0"
            >
              <option value="">Semua Jenis</option>
              {jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
            <select 
              value={filterArea} onChange={e => setFilterArea(e.target.value)}
              className="flex h-10 w-full md:w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 mt-0"
            >
              <option value="">Semua Area</option>
              {AREA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </CardContent>
        )}
      </Card>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Button variant="outline" size="sm" onClick={prevTime}><ChevronLeft className="h-4 w-4 mr-1" /> Prev</Button>
        <div className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-500 hidden sm:block" />
          {format(currentDate, viewMode === 'month' ? "MMMM yyyy" : "'Minggu' do MMMM yyyy", { locale: localeID })}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={goToday} className="hidden sm:flex">Hari Ini</Button>
          <Button variant="outline" size="sm" onClick={nextTime}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
            <div key={day} className="py-2.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">{day}</div>
          ))}
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
            <div key={day} className="py-2.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider block sm:hidden">{day}</div>
          ))}
        </div>

        {loading ? (
          <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" /></div>
        ) : (
          <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-[140px] sm:auto-rows-[160px]' : 'auto-rows-[minmax(250px,auto)]'}`}>
            {days.map((day, i) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, monthStart)
              const isToday = isSameDay(day, new Date())
              
              return (
                <div 
                  key={day.toString()} 
                  className={`border-r border-b border-slate-100 p-1 sm:p-2 flex flex-col 
                    ${!isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/30'}
                    ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-semibold flex items-center justify-center h-6 w-6 rounded-full 
                      ${isToday ? 'bg-indigo-600 text-white shadow-md' : !isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}`
                    }>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="hidden sm:inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {dayEvents.length} Jadwal
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {dayEvents.map(ev => {
                      // Admin sees true colors based on privacy
                      let bgColor = 'bg-indigo-50 border-indigo-100 text-indigo-700'
                      let badgeColor = 'bg-indigo-200 text-indigo-800'
                      let Icon = Eye
                      
                      const isTerbatas = ev.privacy_event === 'publik_terbatas'
                      const isMasked = ev.privacy_event === 'umum_saja'
                      const isRahasia = ev.privacy_event === 'rahasia'
                      
                      const isRutin = Boolean(ev.deskripsi_kegiatan?.toLowerCase().includes('rutin') || ev.nama_event.toLowerCase().includes('rutin') || ev.nama_pemohon?.toLowerCase().includes('rutin') || ev.jenis_event?.toLowerCase().includes('rutin'))
                      const isSpecial = !isRutin && Boolean(ev.nama_ustadz || ev.nama_event.toLowerCase().includes('spesial') || ev.nama_event.toLowerCase().includes('tamu'))

                      if (isRahasia || isMasked) {
                        bgColor = 'bg-slate-100 border-slate-200 text-slate-600'
                        badgeColor = 'bg-slate-200 text-slate-800'
                        Icon = EyeOff
                      } else if (isTerbatas) {
                        bgColor = 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                        badgeColor = 'bg-rose-200 text-rose-800'
                        Icon = EyeOff
                      } else if (isSpecial) {
                        bgColor = 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                        badgeColor = 'bg-amber-200 text-amber-800'
                      } else if (isRutin) {
                        bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                        badgeColor = 'bg-emerald-200 text-emerald-800'
                      }

                      return (
                        <div 
                          key={ev.id}
                          onClick={() => { setSelectedEvent(ev); setShowShareMenu(false); setShowCalMenu(false); }}
                          className={`text-[10px] sm:text-xs p-1.5 rounded-md border font-semibold truncate cursor-pointer transition-all hover:shadow-sm relative overflow-hidden flex flex-col gap-1 ${bgColor}`}
                          title={ev.nama_event}
                        >
                          {ev.is_public_event && <div className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-bl-sm" />}
                          <div className="flex items-center justify-between gap-1 w-full">
                            <div className="flex items-center gap-1 truncate capitalize">
                              {isTerbatas || isRahasia ? <Icon className="h-2.5 w-2.5 flex-shrink-0 text-rose-600" /> : isSpecial && ev.privacy_event === 'detail_publik' ? <Sparkles className="h-2.5 w-2.5 shrink-0 text-amber-600" /> : <Clock className="h-2.5 w-2.5 shrink-0 opacity-70" />}
                              <span className="truncate">{ev.nama_event}</span>
                            </div>
                            {ev.privacy_event !== 'detail_publik' && <Icon className="h-3 w-3 shrink-0 opacity-70 ml-1" />}
                          </div>
                          <div className="flex justify-between items-center mt-0.5 w-full">
                            <span className="opacity-80">
                              {format(new Date(ev.tanggal_mulai), 'HH:mm')}
                            </span>
                            {ev.privacy_event !== 'detail_publik' && <span className={`text-[8px] font-bold px-1 rounded ${badgeColor}`}>INTERNAL</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Admin Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Peminjaman (Publik/Admin)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-300"></div> Kajian Rutin</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Peminjaman (Internal/Rahasia)</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div> Event dengan Pendaftaran Terbuka</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-300"></div> Kajian Spesial / Tamu Undangan</div>
      </div>

      {/* Event Details Dialog (Admin Version - Shows Everything) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`h-1.5 ${
              selectedEvent.privacy_event === 'rahasia' ? 'bg-red-500' : 
              selectedEvent.privacy_event === 'umum_saja' ? 'bg-amber-500' :
              selectedEvent.privacy_event === 'publik_terbatas' ? 'bg-rose-500' : 'bg-indigo-500'
            }`} />
            <CardHeader className="pb-2 border-b border-slate-100 bg-white">
              <div className="flex justify-between items-start">
                <div className="pr-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mb-1 border ${
                    selectedEvent.privacy_event === 'rahasia' ? 'bg-red-50 text-red-700 border-red-200' : 
                    selectedEvent.privacy_event === 'umum_saja' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    selectedEvent.privacy_event === 'publik_terbatas' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {selectedEvent.privacy_event === 'rahasia' && <EyeOff className="h-3 w-3 mr-1" />}
                    Privasi: {selectedEvent.privacy_event.replace('_', ' ').toUpperCase()}
                  </span>
                  <CardTitle className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedEvent.nama_event}
                  </CardTitle>
                  <CardDescription className="mt-1">{selectedEvent.jenis_event}</CardDescription>
                </div>
                 <Button variant="ghost" size="sm" onClick={() => { setSelectedEvent(null); setShowShareMenu(false); setShowCalMenu(false); }} className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                  <span className="sr-only">Tutup</span>&times;
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm bg-slate-50">
              <div className="grid grid-cols-1 gap-3">
                {(selectedEvent.nama_ustadz || selectedEvent.judul_kajian) && (
                  <div className={`flex gap-3 p-2 rounded-lg border ${(!selectedEvent.deskripsi_kegiatan?.toLowerCase().includes('rutin') && !selectedEvent.nama_event.toLowerCase().includes('rutin') && !selectedEvent.nama_pemohon?.toLowerCase().includes('rutin') && !selectedEvent.jenis_event?.toLowerCase().includes('rutin')) ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    {(!selectedEvent.deskripsi_kegiatan?.toLowerCase().includes('rutin') && !selectedEvent.nama_event.toLowerCase().includes('rutin') && !selectedEvent.nama_pemohon?.toLowerCase().includes('rutin') && !selectedEvent.jenis_event?.toLowerCase().includes('rutin')) ? (
                      <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <BookOpen className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={`block font-semibold ${(!selectedEvent.deskripsi_kegiatan?.toLowerCase().includes('rutin') && !selectedEvent.nama_event.toLowerCase().includes('rutin') && !selectedEvent.nama_pemohon?.toLowerCase().includes('rutin') && !selectedEvent.jenis_event?.toLowerCase().includes('rutin')) ? 'text-amber-800' : 'text-emerald-800'}`}>Pemateri / Tema Kajian</span>
                      <span className={`text-xs font-bold block mt-0.5 ${(!selectedEvent.deskripsi_kegiatan?.toLowerCase().includes('rutin') && !selectedEvent.nama_event.toLowerCase().includes('rutin') && !selectedEvent.nama_pemohon?.toLowerCase().includes('rutin') && !selectedEvent.jenis_event?.toLowerCase().includes('rutin')) ? 'text-amber-900' : 'text-emerald-900'}`}>
                        {selectedEvent.nama_ustadz || "Belum ditentukan"}
                      </span>
                      {selectedEvent.judul_kajian && selectedEvent.judul_kajian.toLowerCase().trim() !== selectedEvent.nama_event.toLowerCase().trim() && (
                        <span className={`text-xs italic block mt-0.5 ${(!selectedEvent.deskripsi_kegiatan?.toLowerCase().includes('rutin') && !selectedEvent.nama_event.toLowerCase().includes('rutin') && !selectedEvent.nama_pemohon?.toLowerCase().includes('rutin') && !selectedEvent.jenis_event?.toLowerCase().includes('rutin')) ? 'text-amber-700' : 'text-emerald-700'}`}>
                          &quot;{selectedEvent.judul_kajian}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Clock className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-700">Waktu</span>
                    <span className="text-slate-600 text-xs">
                      {format(new Date(selectedEvent.tanggal_mulai), "dd MMM yyyy HH:mm", { locale: localeID })} - <br/>
                      {format(new Date(selectedEvent.tanggal_selesai), "dd MMM yyyy HH:mm", { locale: localeID })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-700">Area / Fasilitas</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedEvent.area_fasilitas as any[]).map(a => (
                        <span key={a} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium shadow-sm">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <User className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-700">Penyelenggara</span>
                    <span className="text-slate-600 text-xs">
                      {selectedEvent.nama_pemohon} {selectedEvent.nama_lembaga && selectedEvent.nama_lembaga.toLowerCase() !== selectedEvent.nama_pemohon?.toLowerCase() ? `(${selectedEvent.nama_lembaga})` : ''}
                    </span>
                  </div>
                </div>
                {selectedEvent.deskripsi_kegiatan && (
                  <div className="flex gap-3 pt-2 border-t border-slate-200">
                    <Info className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-semibold text-slate-700 mb-1">Deskripsi</span>
                      <p className="text-slate-600 text-xs leading-relaxed bg-white p-2 rounded-md border border-slate-200 shadow-sm">
                        {selectedEvent.deskripsi_kegiatan}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.banner_url && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <Button 
                    className="w-full gap-2 text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md border-0 font-bold transition-all"
                    onClick={() => setPreviewFlyer(selectedEvent.banner_url!)}
                  >
                    <FileImage className="h-4 w-4" /> Lihat Flyer Event
                  </Button>
                </div>
              )}

              {selectedEvent.is_public_event && selectedEvent.public_slug && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  {new Date() > new Date(selectedEvent.tanggal_selesai) ? (
                    <Button disabled className="w-full bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed font-medium">
                      Pendaftaran Ditutup (Event Berakhir)
                    </Button>
                  ) : (
                    <Link href={`/${selectedEvent.public_slug}`}>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                        Lihat Detail Pendaftaran (Frontend)
                      </Button>
                    </Link>
                  )}
                </div>
              )}

               {selectedEvent.privacy_event !== 'umum_saja' && selectedEvent.privacy_event !== 'rahasia' && (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200">
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-slate-700 font-semibold"
                        onClick={() => {
                          setShowShareMenu(!showShareMenu);
                          setShowCalMenu(false);
                        }}
                      >
                        <Share2 className="w-4 h-4" /> Bagikan Acara
                      </Button>
                      {showShareMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-1.5 py-2 space-y-1">
                          <button
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 rounded-md transition-all flex items-center gap-2"
                            onClick={() => {
                              handleWhatsAppShare(selectedEvent);
                              setShowShareMenu(false);
                            }}
                          >
                            <WhatsAppIcon /> WhatsApp
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-700 rounded-md transition-all flex items-center gap-2"
                            onClick={() => {
                              handleTelegramShare(selectedEvent);
                              setShowShareMenu(false);
                            }}
                          >
                            <TelegramIcon /> Telegram
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-700 rounded-md transition-all flex items-center gap-2"
                            onClick={() => {
                              handleFacebookShare(selectedEvent);
                              setShowShareMenu(false);
                            }}
                          >
                            <FacebookIcon /> Facebook
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-black rounded-md transition-all flex items-center gap-2"
                            onClick={() => {
                              handleTwitterShare(selectedEvent);
                              setShowShareMenu(false);
                            }}
                          >
                            <TwitterIcon /> X
                          </button>
                          <div className="border-t border-slate-100 my-1"></div>
                          <button
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-700 rounded-md transition-all flex items-center gap-2"
                            onClick={() => {
                              handleCopyText(selectedEvent);
                              setShowShareMenu(false);
                            }}
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" /> Salin Teks
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-slate-700 font-semibold"
                        onClick={() => {
                          setShowCalMenu(!showCalMenu);
                          setShowShareMenu(false);
                        }}
                      >
                        <CalendarPlus className="w-4 h-4" /> Ingatkan Saya
                      </Button>
                      {showCalMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-1.5 py-2 space-y-1">
                          <button
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-700 rounded-md transition-all flex items-center gap-2"
                            onClick={() => {
                              handleGoogleCalendar(selectedEvent);
                              setShowCalMenu(false);
                            }}
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-indigo-500" /> Google Calendar
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-rose-700 rounded-md transition-all flex items-center gap-2"
                            onClick={() => {
                              handleDownloadICS(selectedEvent);
                              setShowCalMenu(false);
                            }}
                          >
                            <CalendarDays className="w-3.5 h-3.5 text-rose-500" /> Kalender HP (iCal)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Flyer Preview Dialog */}
      {previewFlyer && (
        <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8" onClick={() => setPreviewFlyer(null)}>
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); setPreviewFlyer(null); }} 
              className="absolute top-2 right-2 sm:-top-4 sm:-right-4 z-10 text-slate-400 hover:text-white hover:bg-white/20 bg-black/40 rounded-full h-10 w-10 transition-all flex items-center justify-center"
            >
              <X className="h-6 w-6" />
            </Button>
            <img 
              src={previewFlyer} 
              alt="Flyer Event" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />
    </div>
  )
}
