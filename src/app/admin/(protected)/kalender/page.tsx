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
  MapPin, Clock, Info, User, List, Grid, CalendarDays, EyeOff, Eye
} from "lucide-react"

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
}

export default function AdminCalendarPage() {
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
      // Admin sees ALL approved events, including 'rahasia'
      const { data, error } = await supabase
        .from("pengajuan_peminjaman")
        .select(`
          id, nama_event, jenis_event, tanggal_mulai, tanggal_selesai, 
          area_fasilitas, privacy_event, nama_pemohon, nama_lembaga, deskripsi_kegiatan
        `)
        .eq("status", "approved")
      
      if (error) throw error
      setEvents(data as PengajuanEvent[])
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
    })
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
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari event..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select 
            value={filterJenis} onChange={e => setFilterJenis(e.target.value)}
            className="flex h-10 w-full md:w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">Semua Jenis</option>
            {jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select 
            value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="flex h-10 w-full md:w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="">Semua Area</option>
            {AREA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </CardContent>
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
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {dayEvents.map(ev => {
                      // Admin sees true colors based on privacy
                      let bgColor = 'bg-indigo-50 border-indigo-100 text-indigo-700'
                      let Icon = Eye
                      
                      if (ev.privacy_event === 'rahasia') {
                        bgColor = 'bg-red-50 border-red-100 text-red-700'
                        Icon = EyeOff
                      } else if (ev.privacy_event === 'umum_saja') {
                        bgColor = 'bg-amber-50 border-amber-100 text-amber-700'
                        Icon = EyeOff
                      }

                      return (
                        <div 
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`text-[10px] sm:text-xs p-1.5 rounded-md border font-semibold truncate cursor-pointer transition-all hover:shadow-sm flex items-center justify-between gap-1 ${bgColor}`}
                          title={ev.nama_event}
                        >
                          <div className="truncate">{ev.nama_event}</div>
                          {ev.privacy_event !== 'detail_publik' && <Icon className="h-3 w-3 shrink-0 opacity-70" />}
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
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Publik</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Umum Saja</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Rahasia</div>
      </div>

      {/* Event Details Dialog (Admin Version - Shows Everything) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`h-1.5 ${
              selectedEvent.privacy_event === 'rahasia' ? 'bg-red-500' : 
              selectedEvent.privacy_event === 'umum_saja' ? 'bg-amber-500' : 'bg-indigo-500'
            }`} />
            <CardHeader className="pb-2 border-b border-slate-100 bg-white">
              <div className="flex justify-between items-start">
                <div className="pr-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mb-1 border ${
                    selectedEvent.privacy_event === 'rahasia' ? 'bg-red-50 text-red-700 border-red-200' : 
                    selectedEvent.privacy_event === 'umum_saja' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
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
              <div className="grid grid-cols-1 gap-3">
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
                      {selectedEvent.nama_pemohon} {selectedEvent.nama_lembaga ? `(${selectedEvent.nama_lembaga})` : ''}
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
