"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, 
  parseISO, isWithinInterval 
} from "date-fns"
import { id as localeID } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { trackAnalyticsEvent } from "@/app/actions/analytics"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Filter, 
  MapPin, Clock, Info, User, List, Grid, CalendarDays, EyeOff, Sparkles, BookOpen, Lock, X, FileImage,
  CalendarPlus, Copy, Share2, Download
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
  status?: string
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
  return event.public_slug ? `${base}/${event.public_slug}` : `${base}/kalender?event=${event.id}`
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

const handleNativeShare = async (event: any) => {
  const eventUrl = getEventUrl(event)
  const flyerUrl = event.banner_url || event.url_flyer
  
  if (navigator.share) {
    try {
      const shareData: any = {
        title: event.nama_event,
      }

      if (event.nama_ustadz || event.judul_kajian) {
        shareData.text = `Hadirilah kajian "${event.judul_kajian || event.nama_event}" bersama Ust. ${event.nama_ustadz || 'Belum ditentukan'}.\n\nDetail: ${eventUrl}`
      } else {
        shareData.text = `Hadirilah kegiatan ${event.nama_event} di Masjid Agung Kubah Timah.\n\nDetail: ${eventUrl}`
      }

      if (flyerUrl) {
        try {
          const response = await fetch(flyerUrl)
          const blob = await response.blob()
          const file = new File([blob], `flyer-${event.id || 'event'}.jpg`, { type: blob.type })
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            shareData.files = [file]
          }
        } catch (e) {
          console.error("Failed to fetch flyer for sharing", e)
        }
      }

      trackAnalyticsEvent('share_native', getEventUrl(event), { event_id: event.id }).catch(() => {})
      await navigator.share(shareData)
    } catch (err) {
      console.log('Error sharing natively', err)
      // If user aborted, err.name is AbortError, don't fallback to WA in that case
      if ((err as Error).name !== 'AbortError') {
        handleWhatsAppShare(event)
      }
    }
  } else {
    // fallback to WA
    handleWhatsAppShare(event)
  }
}

const handleWhatsAppShare = (event: any) => {
  const text = generateShareText(event)
  trackAnalyticsEvent('share_wa', getEventUrl(event), { event_id: event.id }).catch(() => {})
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
}

const handleTelegramShare = (event: any) => {
  const text = generateShareText(event)
  const eventUrl = getEventUrl(event)
  trackAnalyticsEvent('share_telegram', eventUrl, { event_id: event.id }).catch(() => {})
  window.open(`https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(text)}`, '_blank')
}

const handleFacebookShare = (event: any) => {
  const eventUrl = getEventUrl(event)
  trackAnalyticsEvent('share_facebook', eventUrl, { event_id: event.id }).catch(() => {})
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank')
}

const handleTwitterShare = (event: any) => {
  const eventUrl = getEventUrl(event)
  const text = `Hadirilah kegiatan "${event.nama_event}" di Masjid Agung Kubah Timah!`
  trackAnalyticsEvent('share_x', eventUrl, { event_id: event.id }).catch(() => {})
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
  
  trackAnalyticsEvent('download_ics', eventUrl, { event_id: event.id }).catch(() => {})

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

export default function CalendarClient() {
  const supabase = createClient()
  
  const [events, setEvents] = useState<PengajuanEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [showFilters, setShowFilters] = useState(false)
  const [previewFlyer, setPreviewFlyer] = useState<string | null>(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showCalMenu, setShowCalMenu] = useState(false)
  
  const [search, setSearch] = useState("")
  const [filterJenis, setFilterJenis] = useState("")
  const [filterArea, setFilterArea] = useState("")
  const [jenisOptions, setJenisOptions] = useState<string[]>([])
  
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

  useEffect(() => {
    if (events.length > 0) {
      const searchParams = new URLSearchParams(window.location.search)
      const eventId = searchParams.get('event')
      if (eventId) {
        const found = events.find(e => e.id === eventId)
        if (found) {
          setSelectedEvent(found)
        }
      }
    }
  }, [events])

  const fetchJenisOptions = async () => {
    const { data } = await supabase.from('jenis_event').select('name').order('name')
    if (data) setJenisOptions((data as any[]).map(d => d.name))
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const { data: pengajuanData, error: pengajuanError } = await supabase
        .from("pengajuan_peminjaman")
        .select(`
          id, nama_event, jenis_event, tanggal_mulai, tanggal_selesai, 
          area_fasilitas, privacy_event, nama_pemohon, nama_lembaga, deskripsi_kegiatan, nama_ustadz, judul_kajian, status, url_flyer
        `)
        .in("status", ["approved", "submitted", "under_review", "revision_requested"])
        .neq("privacy_event", "rahasia")
      
      if (pengajuanError) throw pengajuanError

      const { data: publicEventsData, error: publicEventsError } = await supabase
        .from("events")
        .select(`
          id, title, type, start_datetime, end_datetime, location, 
          organizer_name, description, registration_slug, event_request_id, banner_url
        `)
        .eq("status", "published")

      if (publicEventsError) throw publicEventsError

      const mergedEvents: PengajuanEvent[] = []
      const linkedRequestIds = new Set()

      if (publicEventsData) {
        (publicEventsData as any[]).forEach(pe => {
          if (pe.event_request_id) linkedRequestIds.add(pe.event_request_id)
          
          let correspondingPengajuan = (pengajuanData as any[])?.find(p => p.id === pe.event_request_id)
          if (!correspondingPengajuan) {
            correspondingPengajuan = (pengajuanData as any[])?.find(p => p.nama_event?.toLowerCase() === pe.title?.toLowerCase())
            if (correspondingPengajuan) {
              linkedRequestIds.add(correspondingPengajuan.id)
            }
          }

          mergedEvents.push({
            id: pe.id,
            nama_event: pe.title,
            jenis_event: pe.type,
            tanggal_mulai: pe.start_datetime,
            tanggal_selesai: pe.end_datetime || pe.start_datetime,
            area_fasilitas: [pe.location],
            privacy_event: correspondingPengajuan?.privacy_event || 'detail_publik',
            nama_pemohon: pe.organizer_name || correspondingPengajuan?.nama_pemohon || 'Admin MAKT',
            nama_lembaga: correspondingPengajuan?.nama_lembaga || null,
            deskripsi_kegiatan: pe.description || correspondingPengajuan?.deskripsi_kegiatan || undefined,
            is_public_event: correspondingPengajuan?.privacy_event !== 'publik_terbatas', 
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
      console.error("Gagal load calendar events:", err)
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
  const dateFormat = "d"
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

  const openEventDetails = (ev: PengajuanEvent) => {
    trackAnalyticsEvent('view_event_detail', getEventUrl(ev), { event_id: ev.id }).catch(() => {})
    setSelectedEvent(ev)
    setShowShareMenu(false)
    setShowCalMenu(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg text-indigo-700 flex items-center gap-2">
            <img src="/logo-makt-full.png" alt="MAKT Logo" className="h-8 w-auto" /> Kubah Timah
          </Link>
          <div className="flex gap-3">
            <Link href="/ajukan-peminjaman">
              <Button variant="outline" size="sm" className="hidden sm:flex border-indigo-200 text-indigo-700 hover:bg-indigo-50">Ajukan Event</Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-slate-500">Login Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:max-w-6xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Kalender Kegiatan Publik
            </h1>
            <p className="text-slate-500 mt-1 text-sm max-w-2xl">
              Jadwal kegiatan dan pemakaian fasilitas Masjid Agung Kubah Timah. 
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm self-start lg:self-auto">
            <Button 
              variant={viewMode === 'month' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setViewMode('month'); trackAnalyticsEvent('view_mode', 'month').catch(() => {}) }}
              className={viewMode === 'month' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}
            >
              <Grid className="h-4 w-4 mr-1.5" /> Bulan
            </Button>
            <Button 
              variant={viewMode === 'week' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setViewMode('week'); trackAnalyticsEvent('view_mode', 'week').catch(() => {}) }}
              className={viewMode === 'week' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}
            >
              <List className="h-4 w-4 mr-1.5" /> Minggu
            </Button>
          </div>
        </div>

        <Card className="mb-6 border border-slate-200 shadow-sm bg-white">
          <div 
            className="p-3 sm:p-4 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setShowFilters(!showFilters)}
          >
            <div className="flex flex-row items-center gap-2">
              <Filter className="h-4 w-4 text-indigo-600" />
              <div className="font-bold text-slate-800 text-sm">Filter Pencarian</div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-600 px-2">
              {showFilters ? "Sembunyikan" : "Tampilkan"}
            </Button>
          </div>
          {showFilters && (
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 border-t border-slate-100 pt-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Cari nama kegiatan..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>
                <select 
                  value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="">Semua Jenis Kegiatan</option>
                  {jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <select 
                  value={filterArea} onChange={e => setFilterArea(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="">Semua Fasilitas/Area</option>
                  {AREA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <Button variant="outline" size="sm" onClick={prevTime} className="h-9">
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <div className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-500 hidden sm:block" />
            {format(currentDate, viewMode === 'month' ? "MMMM yyyy" : "'Minggu' do MMMM yyyy", { locale: localeID })}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={goToday} className="hidden sm:flex text-slate-500">Hari Ini</Button>
            <Button variant="outline" size="sm" onClick={nextTime} className="h-9">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <div key={day} className="py-2.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="p-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" /></div>
          ) : (
            <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-[120px] sm:auto-rows-[140px]' : 'auto-rows-[minmax(200px,auto)]'}`}>
              {days.map((day, i) => {
                const dayEvents = getEventsForDay(day)
                const isCurrentMonth = isSameMonth(day, monthStart)
                const isToday = isSameDay(day, new Date())
                
                return (
                  <div 
                    key={day.toString()} 
                    className={`border-r border-b border-slate-100 p-1 sm:p-2 flex flex-col transition-colors
                      ${!isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/30'}
                      ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs sm:text-sm font-semibold flex items-center justify-center h-6 w-6 rounded-full 
                        ${isToday ? 'bg-indigo-600 text-white shadow-md' : 
                          !isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}`
                      }>
                        {format(day, dateFormat)}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="hidden sm:inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {dayEvents.length} Jadwal
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {dayEvents.map(ev => {
                        const isMasked = ev.privacy_event === 'umum_saja'
                        const isTerbatas = ev.privacy_event === 'publik_terbatas'
                        const isPending = ev.status && ['submitted', 'under_review', 'revision_requested'].includes(ev.status)
                        const baseTitle = isMasked ? 'Ada Kegiatan di MAKT' : ev.nama_event
                        const displayTitle = isPending ? `[Proses] ${baseTitle}` : baseTitle
                        
                        const isRutin = !isMasked && Boolean(ev.deskripsi_kegiatan?.toLowerCase().includes('rutin') || ev.nama_event.toLowerCase().includes('rutin') || ev.nama_pemohon?.toLowerCase().includes('rutin') || ev.jenis_event?.toLowerCase().includes('rutin'))
                        const isSpecial = !isMasked && !isRutin && Boolean(ev.nama_ustadz || ev.nama_event.toLowerCase().includes('spesial') || ev.nama_event.toLowerCase().includes('tamu'))
                        
                        let bgColor = 'bg-indigo-50 border-indigo-100 text-indigo-700'
                        if (isPending) bgColor = 'bg-white border-slate-400 border-dashed text-slate-500 opacity-80'
                        else if (isMasked) bgColor = 'bg-slate-100 border-slate-200 text-slate-600'
                        else if (isTerbatas) bgColor = 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                        else if (isSpecial) bgColor = 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                        else if (isRutin) bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                        
                        return (
                          <div 
                            key={ev.id}
                            onClick={() => openEventDetails(ev)}
                            className={`text-[10px] sm:text-xs p-1.5 rounded-md border font-semibold truncate cursor-pointer transition-all hover:shadow-sm relative overflow-hidden ${bgColor}`}
                            title={displayTitle}
                          >
                            {ev.is_public_event && <div className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-bl-sm" />}
                            <div className="flex items-center gap-1 truncate capitalize">
                              {isTerbatas ? <Lock className="h-2.5 w-2.5 flex-shrink-0 text-rose-600" /> : isSpecial ? <Sparkles className="h-2.5 w-2.5 flex-shrink-0" /> : <Clock className="h-2.5 w-2.5 flex-shrink-0 opacity-70" />}
                              <span className="truncate">{displayTitle}</span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                              <span className="opacity-80">
                                {format(new Date(ev.tanggal_mulai), 'HH:mm')}
                              </span>
                              {isTerbatas && <span className="text-[8px] font-bold px-1 bg-rose-200 text-rose-800 rounded">INTERNAL</span>}
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

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 justify-center sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div> Event Publik
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-300"></div> Internal Umum
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-200 border border-rose-300"></div> Khusus Internal
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-200 border border-emerald-300"></div> Kajian Rutin
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white border border-slate-400 border-dashed"></div> Menunggu ACC (Proses)
          </div>
        </div>
      </main>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`h-1.5 ${selectedEvent.privacy_event === 'umum_saja' ? 'bg-slate-400' : selectedEvent.privacy_event === 'publik_terbatas' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.privacy_event === 'publik_terbatas' && (
                      <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-md w-fit">
                        <Lock className="h-3 w-3" /> KHUSUS INTERNAL / UNDANGAN
                      </span>
                    )}
                    {selectedEvent.status && ['submitted', 'under_review', 'revision_requested'].includes(selectedEvent.status) && (
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-300 border-dashed text-xs font-bold px-2.5 py-1 rounded-md w-fit">
                        <Clock className="h-3 w-3" /> MENUNGGU PERSETUJUAN
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 pr-4 leading-tight capitalize">
                    {selectedEvent.privacy_event === 'umum_saja' ? 'Ada Kegiatan di MAKT' : selectedEvent.nama_event}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedEvent.privacy_event === 'umum_saja' ? 'Acara Internal / Umum' : selectedEvent.jenis_event}
                  </CardDescription>
                </div>
                 <Button variant="ghost" size="sm" onClick={() => { setSelectedEvent(null); setShowShareMenu(false); setShowCalMenu(false); }} className="h-8 w-8 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200 -mr-2 -mt-2">
                  <span className="sr-only">Tutup</span>
                  &times;
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex gap-3">
                  <Clock className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-700">Waktu Pelaksanaan</span>
                    <span className="text-slate-600 text-xs">
                      {format(new Date(selectedEvent.tanggal_mulai), "dd MMMM yyyy HH:mm", { locale: localeID })} - <br/>
                      {format(new Date(selectedEvent.tanggal_selesai), "dd MMMM yyyy HH:mm", { locale: localeID })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-700">Area / Fasilitas</span>
                    {selectedEvent.privacy_event === 'umum_saja' ? (
                      <span className="text-slate-600 text-xs italic">Dirahasiakan (Dipakai Internal)</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedEvent.area_fasilitas as any[]).map(a => (
                          <span key={a} className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {((selectedEvent as any).url_flyer || selectedEvent.banner_url) && (
                  <Button 
                    variant="outline" 
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 mt-2 mb-2 font-medium shadow-sm transition-all flex items-center justify-center py-6"
                    onClick={() => {
                      trackAnalyticsEvent('view_flyer', getEventUrl(selectedEvent), { event_id: selectedEvent.id }).catch(() => {})
                      setPreviewFlyer((selectedEvent as any).url_flyer || selectedEvent.banner_url!)
                    }}
                  >
                    <FileImage className="w-5 h-5 mr-2" /> Lihat Flyer Kajian
                  </Button>
                )}

                {(selectedEvent.privacy_event === 'detail_publik' || selectedEvent.privacy_event === 'publik_terbatas') && (
                  <>
                    {(selectedEvent.nama_ustadz || selectedEvent.judul_kajian) && (
                      <div className="flex gap-3">
                        {(!selectedEvent.deskripsi_kegiatan?.toLowerCase().includes('rutin') && !selectedEvent.nama_event.toLowerCase().includes('rutin') && !selectedEvent.nama_pemohon?.toLowerCase().includes('rutin') && !selectedEvent.jenis_event?.toLowerCase().includes('rutin')) ? (
                          <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <BookOpen className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="block font-semibold text-slate-700">Pemateri / Tema Kajian</span>
                          <span className="text-slate-800 text-xs font-bold block mt-0.5">
                            {selectedEvent.nama_ustadz || "Belum ditentukan"}
                          </span>
                          {selectedEvent.judul_kajian && selectedEvent.judul_kajian.toLowerCase().trim() !== selectedEvent.nama_event.toLowerCase().trim() && (
                            <span className="text-slate-600 text-xs italic block mt-0.5">
                              &quot;{selectedEvent.judul_kajian}&quot;
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <User className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-semibold text-slate-700">Penyelenggara</span>
                        <span className="text-slate-600 text-xs capitalize">
                          {selectedEvent.nama_pemohon} {selectedEvent.nama_lembaga && selectedEvent.nama_lembaga.toLowerCase() !== selectedEvent.nama_pemohon?.toLowerCase() ? `(${selectedEvent.nama_lembaga})` : ''}
                        </span>
                      </div>
                    </div>
                    {selectedEvent.deskripsi_kegiatan && selectedEvent.privacy_event === 'detail_publik' && (
                      <div className="flex gap-3 pt-2 border-t border-slate-100">
                        <Info className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="block font-semibold text-slate-700 mb-1">Deskripsi</span>
                          <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap capitalize">
                            {selectedEvent.deskripsi_kegiatan}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedEvent.is_public_event && selectedEvent.public_slug && (
                  <div className="mt-2">
                    {new Date() > new Date(selectedEvent.tanggal_selesai) ? (
                      <Button disabled className="w-full bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed font-medium">
                        Pendaftaran Ditutup (Event Berakhir)
                      </Button>
                    ) : (
                      <Link href={`/${selectedEvent.public_slug}`}>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                          Lihat Detail Pendaftaran
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {selectedEvent.privacy_event === 'umum_saja' && (
                  <div className="mt-2 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                    Ini adalah kegiatan terbatas. Rincian penyelenggara dan deskripsi tidak dipublikasikan untuk umum demi alasan privasi.
                  </div>
                )}

                {selectedEvent.privacy_event !== 'umum_saja' && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
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
                              handleNativeShare(selectedEvent);
                              setShowShareMenu(false);
                            }}
                          >
                            <FileImage className="w-3.5 h-3.5 text-emerald-600" /> WA Status / IG Story
                          </button>
                          <div className="border-t border-slate-100 my-1"></div>
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
                
                {selectedEvent.privacy_event === 'publik_terbatas' && (
                  <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-100 text-sm font-medium flex items-start gap-3">
                    <Lock className="h-5 w-5 mt-0.5 text-rose-600 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-bold">Perhatian: Acara Internal / Khusus Undangan</p>
                      <p className="text-rose-700/90 text-xs">Kegiatan ini diselenggarakan secara tertutup atau hanya untuk kalangan internal lembaga/keluarga. Jamaah umum dimohon untuk memaklumi.</p>
                    </div>
                  </div>
                )}
              </div>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await fetch(previewFlyer!);
                  const blob = await res.blob();
                  trackAnalyticsEvent('download_flyer', getEventUrl(selectedEvent), { event_id: selectedEvent.id }).catch(() => {})
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = `flyer-${selectedEvent?.nama_event || 'event'}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  window.open(previewFlyer!, '_blank');
                }
              }}
              className="absolute top-2 right-14 sm:-top-4 sm:right-8 z-10 text-slate-400 hover:text-white hover:bg-white/20 bg-black/40 rounded-full h-10 w-10 transition-all flex items-center justify-center"
              title="Download Flyer"
            >
              <Download className="h-5 w-5" />
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

      {/* Global CSS for scrollbar inside calendar cells */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}} />
    </div>
  )
}
