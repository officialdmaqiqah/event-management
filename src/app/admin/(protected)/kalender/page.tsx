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
  MapPin, Clock, Info, User, List, Grid, CalendarDays, EyeOff, Eye, Sparkles, BookOpen
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

export default function AdminCalendarPage() {
  const supabase = createClient()
  
  const [events, setEvents] = useState<PengajuanEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [showFilters, setShowFilters] = useState(false)
  
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
          area_fasilitas, privacy_event, nama_pemohon, nama_lembaga, deskripsi_kegiatan, nama_ustadz, judul_kajian
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
        publicEventsData.forEach(pe => {
          if (pe.event_request_id) linkedRequestIds.add(pe.event_request_id)
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
                      let Icon = Eye
                      
                      const isRutin = Boolean(ev.deskripsi_kegiatan?.toLowerCase().includes('rutin') || ev.nama_event.toLowerCase().includes('rutin') || ev.nama_pemohon?.toLowerCase().includes('rutin') || ev.jenis_event?.toLowerCase().includes('rutin'))
                      const isSpecial = !isRutin && Boolean(ev.nama_ustadz || ev.nama_event.toLowerCase().includes('spesial') || ev.nama_event.toLowerCase().includes('tamu'))

                      if (ev.privacy_event === 'rahasia' || ev.privacy_event === 'umum_saja') {
                        bgColor = 'bg-slate-100 border-slate-200 text-slate-600'
                        Icon = EyeOff
                      } else if (isSpecial) {
                        bgColor = 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                      } else if (isRutin) {
                        bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                      }

                      return (
                        <div 
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`text-[10px] sm:text-xs p-1.5 rounded-md border font-semibold truncate cursor-pointer transition-all hover:shadow-sm relative overflow-hidden flex flex-col gap-1 ${bgColor}`}
                          title={ev.nama_event}
                        >
                          {ev.is_public_event && <div className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-bl-sm" />}
                          <div className="flex items-center justify-between gap-1 w-full">
                            <div className="flex items-center gap-1 truncate capitalize">
                              {isSpecial && ev.privacy_event === 'detail_publik' ? <Sparkles className="h-2.5 w-2.5 shrink-0 text-amber-600" /> : <Clock className="h-2.5 w-2.5 shrink-0 opacity-70" />}
                              <span className="truncate">{ev.nama_event}</span>
                            </div>
                            {ev.privacy_event !== 'detail_publik' && <Icon className="h-3 w-3 shrink-0 opacity-70 ml-1" />}
                          </div>
                          <div className="flex justify-between items-center mt-0.5 w-full">
                            <span className="opacity-80">
                              {format(new Date(ev.tanggal_mulai), 'HH:mm')}
                            </span>
                            {ev.privacy_event !== 'detail_publik' && <span className="text-[8px] font-bold px-1 bg-white/50 rounded">INTERNAL</span>}
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
                <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)} className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-full">
                  <span className="sr-only">Tutup</span>&times;
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm bg-slate-50">
              {selectedEvent.is_public_event && selectedEvent.banner_url && (
                <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={selectedEvent.banner_url} alt={selectedEvent.nama_event} className="w-full h-full object-cover" />
                </div>
              )}
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
                      {selectedEvent.area_fasilitas.map(a => (
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
            </CardContent>
          </Card>
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
