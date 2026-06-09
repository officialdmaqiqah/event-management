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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Filter, 
  MapPin, Clock, Info, User, List, Grid, CalendarDays, EyeOff, Sparkles 
} from "lucide-react"
import Link from "next/link"

type PengajuanEvent = {
  id: string
  nama_event: string
  jenis_event: string
  tanggal_mulai: string
  tanggal_selesai: string
  area_fasilitas: string[]
  privacy_event: 'detail_publik' | 'umum_saja' | 'rahasia'
  nama_pemohon?: string
  nama_lembaga?: string | null
  deskripsi_kegiatan?: string
  is_public_event?: boolean
  public_slug?: string
  banner_url?: string
}

export default function PublicCalendarPage() {
  const supabase = createClient()
  
  const [events, setEvents] = useState<PengajuanEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  
  // Filters
  const [search, setSearch] = useState("")
  const [filterJenis, setFilterJenis] = useState("")
  const [filterArea, setFilterArea] = useState("")
  const [jenisOptions, setJenisOptions] = useState<string[]>([])
  
  // Modal Details
  const [selectedEvent, setSelectedEvent] = useState<PengajuanEvent | null>(null)
  
  // Hardcoded areas for filter (or dynamically derived)
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
    if (data) setJenisOptions(data.map(d => d.name))
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      // 1. Fetch pengajuan
      const { data: pengajuanData, error: pengajuanError } = await supabase
        .from("pengajuan_peminjaman")
        .select(`
          id, nama_event, jenis_event, tanggal_mulai, tanggal_selesai, 
          area_fasilitas, privacy_event, nama_pemohon, nama_lembaga, deskripsi_kegiatan
        `)
        .eq("status", "approved")
        .neq("privacy_event", "rahasia")
      
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
        publicEventsData.forEach(pe => {
          if (pe.event_request_id) linkedRequestIds.add(pe.event_request_id)
          mergedEvents.push({
            id: pe.id,
            nama_event: pe.title,
            jenis_event: pe.type,
            tanggal_mulai: pe.start_datetime,
            tanggal_selesai: pe.end_datetime || pe.start_datetime,
            area_fasilitas: [pe.location],
            privacy_event: 'detail_publik', // public events are fully visible
            nama_pemohon: pe.organizer_name || 'Admin MAKT',
            nama_lembaga: null,
            deskripsi_kegiatan: pe.description || undefined,
            is_public_event: true,
            public_slug: pe.registration_slug,
            banner_url: pe.banner_url || undefined
          })
        })
      }

      if (pengajuanData) {
        pengajuanData.forEach(p => {
          if (!linkedRequestIds.has(p.id)) {
            mergedEvents.push({
              ...(p as PengajuanEvent),
              is_public_event: false
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

  // Next / Prev navigations
  const nextTime = () => setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))
  const prevTime = () => setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))
  const goToday = () => setCurrentDate(new Date())

  // Render variables
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(viewMode === 'month' ? monthStart : currentDate, { weekStartsOn: 1 })
  const endDate = endOfWeek(viewMode === 'month' ? monthEnd : currentDate, { weekStartsOn: 1 })
  const dateFormat = "d"
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Apply filters
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
    })
  }

  const openEventDetails = (ev: PengajuanEvent) => {
    setSelectedEvent(ev)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-12">
      {/* Header Public Nav (Simple) */}
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
        
        {/* Page Title & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Kalender Kegiatan Publik
            </h1>
            <p className="text-slate-500 mt-1 text-sm max-w-2xl">
              Jadwal kegiatan dan pemakaian fasilitas Masjid Agung Kubah Timah. 
              Hari tanpa tanda berarti fasilitas kemungkinan besar tersedia.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm self-start lg:self-auto">
            <Button 
              variant={viewMode === 'month' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('month')}
              className={viewMode === 'month' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}
            >
              <Grid className="h-4 w-4 mr-1.5" /> Bulan
            </Button>
            <Button 
              variant={viewMode === 'week' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}
            >
              <List className="h-4 w-4 mr-1.5" /> Minggu
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="mb-6 border-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
        </Card>

        {/* Calendar Header Navigation */}
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

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <div key={day} className="py-2.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
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
                        // Privacy masking for "umum_saja"
                        const isMasked = ev.privacy_event === 'umum_saja'
                        const displayTitle = isMasked ? 'Ada Kegiatan di MAKT' : ev.nama_event
                        
                        // Check if special guest / event
                        const isSpecial = !isMasked && (ev.nama_event.toLowerCase().includes('spesial') || ev.nama_event.toLowerCase().includes('tamu'))
                        
                        let bgColor = 'bg-indigo-50 border-indigo-100 text-indigo-700'
                        if (isMasked) bgColor = 'bg-slate-100 border-slate-200 text-slate-600'
                        else if (isSpecial) bgColor = 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                        
                        return (
                          <div 
                            key={ev.id}
                            onClick={() => openEventDetails(ev)}
                            className={`text-[10px] sm:text-xs p-1.5 rounded-md border font-semibold truncate cursor-pointer transition-all hover:shadow-sm relative overflow-hidden ${bgColor}`}
                            title={displayTitle}
                          >
                            {ev.is_public_event && <div className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-bl-sm" />}
                            <div className="flex items-center gap-1 truncate capitalize">
                              {isSpecial && <Sparkles className="h-3 w-3 shrink-0 text-amber-600" />}
                              <span className="truncate">{displayTitle}</span>
                            </div>
                            <div className="text-[9px] opacity-70 flex items-center gap-1 mt-0.5 font-medium hidden sm:flex">
                              <Clock className="h-2.5 w-2.5" />
                              {format(new Date(ev.tanggal_mulai), 'HH:mm')}
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

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 justify-center sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div> Event Publik (Detail Tampil)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-300"></div> Peminjaman Internal/Umum
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div> Event dengan Pendaftaran Terbuka
          </div>
        </div>
      </main>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`h-1.5 ${selectedEvent.privacy_event === 'umum_saja' ? 'bg-slate-400' : 'bg-indigo-500'}`} />
            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 pr-4 leading-tight capitalize">
                    {selectedEvent.privacy_event === 'umum_saja' ? 'Ada Kegiatan di MAKT' : selectedEvent.nama_event}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selectedEvent.privacy_event === 'umum_saja' ? 'Acara Internal / Umum' : selectedEvent.jenis_event}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)} className="h-8 w-8 text-slate-400 hover:text-slate-600 bg-white rounded-full shadow-sm border border-slate-200 -mr-2 -mt-2">
                  <span className="sr-only">Tutup</span>
                  &times;
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              {selectedEvent.is_public_event && selectedEvent.banner_url && (
                <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={selectedEvent.banner_url} alt={selectedEvent.nama_event} className="w-full h-full object-cover" />
                </div>
              )}
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
                        {selectedEvent.area_fasilitas.map(a => (
                          <span key={a} className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedEvent.privacy_event === 'detail_publik' && (
                  <>
                    <div className="flex gap-3">
                      <User className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-semibold text-slate-700">Penyelenggara</span>
                        <span className="text-slate-600 text-xs capitalize">
                          {selectedEvent.nama_pemohon} {selectedEvent.nama_lembaga ? `(${selectedEvent.nama_lembaga})` : ''}
                        </span>
                      </div>
                    </div>
                    {selectedEvent.deskripsi_kegiatan && (
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
                  <div className="mt-4 pt-4 border-t border-slate-200">
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
              </div>
            </CardContent>
          </Card>
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
