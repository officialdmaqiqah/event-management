"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TimeInput } from "@/components/ui/time-input"
import { Label } from "@/components/ui/label"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"
import Link from "next/link"
import { ArrowLeft, CalendarDays, Copy, Plus, Trash2, Save } from "lucide-react"

type SessionConfig = {
  id: string
  waktu_mulai: string
  waktu_selesai: string
  judul_kajian: string
  nama_ustadz: string
  area_fasilitas: string[]
  jenis_event: string
  khotib_imam?: string
  cadangan_khotib_imam?: string
  muazin?: string
  maasyirol?: string
}

type DayConfig = {
  enabled: boolean
  sessions: SessionConfig[]
}

const createDefaultSession = (): SessionConfig => ({
  id: Math.random().toString(36).substring(7),
  waktu_mulai: "05:00",
  waktu_selesai: "06:00",
  judul_kajian: "Kajian Subuh",
  nama_ustadz: "",
  area_fasilitas: ["Ruang Utama (Masjid)"],
  jenis_event: "Kajian / Pengajian",
  khotib_imam: "",
  cadangan_khotib_imam: "",
  muazin: "",
  maasyirol: ""
})

const DEFAULT_DAY_CONFIG: DayConfig = {
  enabled: false,
  sessions: [createDefaultSession()]
}

const DAYS = [
  { id: 1, name: "Senin" },
  { id: 2, name: "Selasa" },
  { id: 3, name: "Rabu" },
  { id: 4, name: "Kamis" },
  { id: 5, name: "Jumat" },
  { id: 6, name: "Sabtu" },
  { id: 0, name: "Minggu" },
]

export default function GeneratorPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  const [configs, setConfigs] = useState<Record<number, DayConfig>>({
    1: { enabled: true, sessions: [{ id: 's-1-1', waktu_mulai: '05:00', waktu_selesai: '06:00', judul_kajian: 'Kajian Subuh', nama_ustadz: 'Ustadz H. Firdaus, Lc,. M.Pd', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' }] },
    2: { enabled: true, sessions: [{ id: 's-2-1', waktu_mulai: '05:00', waktu_selesai: '06:00', judul_kajian: 'Kajian Subuh', nama_ustadz: 'Ustadz Jauhar Ridloni Marzuq, Lc, MA', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' }] },
    3: { enabled: true, sessions: [{ id: 's-3-1', waktu_mulai: '05:00', waktu_selesai: '06:00', judul_kajian: "Tadarus & Tahsin Qur'an", nama_ustadz: 'Ustadz Ainur Rasyid', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' }] },
    4: { enabled: true, sessions: [
      { id: 's-4-1', waktu_mulai: '05:00', waktu_selesai: '06:00', judul_kajian: 'Kajian Subuh', nama_ustadz: 'Ustadz Drs. Ahmad Luthfi HZ', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' },
      { id: 's-4-2', waktu_mulai: '18:30', waktu_selesai: '19:00', judul_kajian: 'Baca Yasin Berjamaah', nama_ustadz: '', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' },
      { id: 's-4-3', waktu_mulai: '20:00', waktu_selesai: '21:00', judul_kajian: 'Maulid Al Barzanji', nama_ustadz: 'Tim Barzanji & Marhaban Masjid Agung Kubah Timah Pangkalpinang', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' },
    ] },
    5: { enabled: true, sessions: [
      { id: 's-5-1', waktu_mulai: '05:00', waktu_selesai: '06:00', judul_kajian: 'Kajian Subuh', nama_ustadz: 'Ustadz Ibadurrahman Alimin', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' },
      { id: 's-5-2', waktu_mulai: '12:00', waktu_selesai: '13:00', judul_kajian: "Sholat Jum'at", nama_ustadz: '', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Sholat Jumat', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' },
      { id: 's-5-3', waktu_mulai: '18:30', waktu_selesai: '19:30', judul_kajian: "Kajian Diniyah & Al Qur'an", nama_ustadz: 'Ustadz Ibadurrahman Alimin', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' }
    ] },
    6: { enabled: true, sessions: [{ id: 's-6-1', waktu_mulai: '05:00', waktu_selesai: '06:00', judul_kajian: 'Kajian Subuh', nama_ustadz: 'Ustadz H. Johan, S.Ag, M.Pd', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' }] },
    0: { enabled: true, sessions: [{ id: 's-0-1', waktu_mulai: '05:00', waktu_selesai: '06:00', judul_kajian: 'Kajian Subuh', nama_ustadz: 'Ustadz H. Khusnul Anam, Lc', area_fasilitas: ['Ruang Utama (Masjid)'], jenis_event: 'Kajian / Pengajian', khotib_imam: '', cadangan_khotib_imam: '', muazin: '', maasyirol: '' }] },
  })

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
  }>({
    isOpen: false, type: 'alert', title: '', message: ''
  })

  useEffect(() => {
    const savedDraft = localStorage.getItem('generator_draft')
    if (savedDraft) {
      try {
        const { startDate: sd, endDate: ed, configs: confs } = JSON.parse(savedDraft)
        if (sd) setStartDate(sd)
        if (ed) setEndDate(ed)
        if (confs) setConfigs(confs)
      } catch (err) {
        console.error("Gagal load draft", err)
      }
    }
  }, [])

  const handleSaveDraft = () => {
    localStorage.setItem('generator_draft', JSON.stringify({ startDate, endDate, configs }))
    setDialogState({
      isOpen: true,
      type: 'alert',
      title: 'Draft Disimpan',
      message: 'Data isian jadwal berhasil disimpan sementara di browser Anda. Anda bisa kembali dan melanjutkannya nanti.',
    })
  }

  const toggleDay = (dayId: number, enabled: boolean) => {
    setConfigs(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], enabled }
    }))
  }

  const updateSession = (dayId: number, sessionId: string, field: keyof SessionConfig, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        sessions: prev[dayId].sessions.map(s => s.id === sessionId ? { ...s, [field]: value } : s)
      }
    }))
  }

  const addSession = (dayId: number) => {
    setConfigs(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        sessions: [...prev[dayId].sessions, createDefaultSession()]
      }
    }))
  }

  const removeSession = (dayId: number, sessionId: string) => {
    setConfigs(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        sessions: prev[dayId].sessions.filter(s => s.id !== sessionId)
      }
    }))
  }

  const copyToAll = (sourceDayId: number) => {
    const source = configs[sourceDayId]
    setConfigs(prev => {
      const next = { ...prev }
      DAYS.forEach(d => {
        if (d.id !== sourceDayId && prev[d.id].enabled) {
          // Deep copy sessions
          next[d.id] = { 
            ...next[d.id], 
            sessions: source.sessions.map(s => ({ ...s, id: Math.random().toString(36).substring(7) }))
          }
        }
      })
      return next
    })
  }

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setDialogState({ isOpen: true, type: 'error', title: 'Error', message: 'Silakan pilih rentang tanggal mulai dan akhir.' })
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      setDialogState({ isOpen: true, type: 'error', title: 'Error', message: 'Tanggal akhir harus setelah tanggal mulai.' })
      return
    }

    const hasEnabledDays = Object.values(configs).some(c => c.enabled)
    if (!hasEnabledDays) {
      setDialogState({ isOpen: true, type: 'error', title: 'Error', message: 'Minimal pilih satu hari untuk di-generate.' })
      return
    }

    setLoading(true)

    try {
      const generatedRows: any[] = []
      let currentDate = new Date(start)
      
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay() 
        const config = configs[dayOfWeek]
        
        if (config.enabled) {
          const tglStr = currentDate.toISOString().split('T')[0]
          
          config.sessions.forEach((session) => {
            let deskripsi = 'Kajian Rutin Terjadwal Otomatis';
            if (session.jenis_event === 'Sholat Jumat' || session.judul_kajian === "Sholat Jum'at") {
              deskripsi += `\nKhotib & Imam: ${session.khotib_imam || '-'}\nCadangan Khotib & Imam: ${session.cadangan_khotib_imam || '-'}\nMa'asyirol: ${session.maasyirol || '-'}\nMuazin: ${session.muazin || '-'}`;
            }

            generatedRows.push({
              nomor_pengajuan: `RUTIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              status: 'approved',
              tipe_pemohon: 'lembaga',
              nama_lembaga: 'DKM MAKT',
              nama_pemohon: 'DKM MAKT',
              whatsapp: '080000000000',
              email: 'admin@makt.id',
              alamat: 'Pangkalpinang',
              nama_event: session.judul_kajian,
              judul_kajian: session.judul_kajian,
              nama_ustadz: session.nama_ustadz || null,
              jenis_event: session.jenis_event,
              tujuan_peminjaman: 'Kegiatan Kajian Rutin',
              estimasi_peserta: 100,
              tanggal_mulai: `${tglStr}T${session.waktu_mulai}:00+07:00`,
              tanggal_selesai: `${tglStr}T${session.waktu_selesai}:00+07:00`,
              area_fasilitas: session.area_fasilitas,
              privacy_event: 'detail_publik',
              deskripsi_kegiatan: deskripsi,
            })
          })
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }

      if (generatedRows.length === 0) {
        setDialogState({ isOpen: true, type: 'alert', title: 'Info', message: 'Tidak ada tanggal yang cocok dengan hari yang dipilih dalam rentang waktu tersebut.' })
        setLoading(false)
        return
      }

      const { error } = await supabase.from('pengajuan_peminjaman').insert(generatedRows)

      if (error) throw error

      localStorage.removeItem('generator_draft')

      setDialogState({ 
        isOpen: true, 
        type: 'success', 
        title: 'Berhasil!', 
        message: `Berhasil meng-generate ${generatedRows.length} jadwal kegiatan rutin ke dalam sistem.` 
      })

      setTimeout(() => {
        router.push('/admin/kalender')
      }, 2000)

    } catch (err: any) {
      console.error(err)
      setDialogState({ isOpen: true, type: 'error', title: 'Gagal', message: err.message || 'Terjadi kesalahan sistem.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/pengajuan">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-indigo-600" />
            Generator Jadwal Rutin
          </h1>
          <p className="text-slate-500">Buat puluhan jadwal kajian otomatis dalam 1 klik.</p>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-indigo-600">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle>1. Pilih Rentang Waktu</CardTitle>
          <CardDescription>Tentukan dari tanggal berapa sampai tanggal berapa jadwal ini berlaku.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-6">
          <div className="space-y-2 w-full sm:max-w-[250px]">
            <Label>Dari Tanggal</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50" />
          </div>
          <div className="space-y-2 w-full sm:max-w-[250px]">
            <Label>Sampai Tanggal</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle>2. Konfigurasi per Hari</CardTitle>
          <CardDescription>Aktifkan hari yang memiliki kajian. Bapak bisa menambah banyak sesi dalam 1 hari.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {DAYS.map((day) => {
              const config = configs[day.id]
              return (
                <div key={day.id} className={`p-4 sm:p-6 transition-colors ${config.enabled ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <input 
                      type="checkbox" 
                      id={`day-${day.id}`}
                      checked={config.enabled} 
                      onChange={e => toggleDay(day.id, e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <Label htmlFor={`day-${day.id}`} className={`text-lg font-bold cursor-pointer ${config.enabled ? 'text-indigo-900' : 'text-slate-400'}`}>
                      Hari {day.name}
                    </Label>
                    
                    {config.enabled && (
                      <Button variant="ghost" size="sm" onClick={() => copyToAll(day.id)} className="ml-auto text-xs text-indigo-600 hover:bg-indigo-50 hidden sm:flex">
                        <Copy className="w-3 h-3 mr-1" /> Salin Format Hari Ini ke Hari Lain
                      </Button>
                    )}
                  </div>

                  {config.enabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 border-l-2 border-indigo-100 pl-4 ml-2">
                      {config.sessions.map((session, index) => (
                        <div key={session.id} className="relative bg-slate-50 border border-slate-100 rounded-lg p-4">
                          <div className="absolute -left-7 top-4 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                            Sesi {index + 1}
                          </div>
                          
                          {config.sessions.length > 1 && (
                            <div className="absolute right-4 top-4">
                              <Button variant="outline" size="icon" onClick={() => removeSession(day.id, session.id)} className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-100 shadow-sm rounded-md bg-white">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}

                          <div className="flex flex-col gap-4 mt-2">
                            {/* Row 1: Waktu & Judul */}
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="space-y-1.5 md:w-1/3">
                                <Label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Waktu Pelaksanaan</Label>
                                <div className="flex items-center gap-2">
                                  <TimeInput value={session.waktu_mulai} onChange={e => updateSession(day.id, session.id, 'waktu_mulai', e.target.value)} className="h-10 bg-white flex-1" />
                                  <span className="text-slate-400 font-medium">-</span>
                                  <TimeInput value={session.waktu_selesai} onChange={e => updateSession(day.id, session.id, 'waktu_selesai', e.target.value)} className="h-10 bg-white flex-1" />
                                </div>
                              </div>
                              <div className="space-y-1.5 flex-1 md:pr-10">
                                <Label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Judul / Tema Kajian</Label>
                                <Input value={session.judul_kajian} onChange={e => updateSession(day.id, session.id, 'judul_kajian', e.target.value)} className="h-10 bg-white" placeholder="Contoh: Kajian Tafsir Jalalain" />
                              </div>
                            </div>
                            
                            {/* Row 2: Ustadz */}
                            {!(session.jenis_event === 'Sholat Jumat' || session.judul_kajian === "Sholat Jum'at") && (
                              <div className="space-y-1.5">
                                <Label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Nama Ustadz / Pemateri</Label>
                                <Input value={session.nama_ustadz} onChange={e => updateSession(day.id, session.id, 'nama_ustadz', e.target.value)} className="h-10 bg-white w-full" placeholder="Contoh: Ustadz H. Abdul Somad" />
                              </div>
                            )}
                            
                            {/* Petugas Sholat Jumat */}
                            {(session.jenis_event === 'Sholat Jumat' || session.judul_kajian === "Sholat Jum'at") && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                <div className="flex flex-col justify-end space-y-1.5">
                                  <Label className="text-[10px] text-indigo-700 font-bold uppercase tracking-tight">Khotib & Imam</Label>
                                  <Input value={session.khotib_imam} onChange={e => updateSession(day.id, session.id, 'khotib_imam', e.target.value)} className="h-9 bg-white text-sm" placeholder="Nama Khotib & Imam" />
                                </div>
                                <div className="flex flex-col justify-end space-y-1.5">
                                  <Label className="text-[10px] text-indigo-700 font-bold uppercase tracking-tight leading-tight">Cadangan Khotib & Imam</Label>
                                  <Input value={session.cadangan_khotib_imam} onChange={e => updateSession(day.id, session.id, 'cadangan_khotib_imam', e.target.value)} className="h-9 bg-white text-sm" placeholder="Nama Cadangan" />
                                </div>
                                <div className="flex flex-col justify-end space-y-1.5">
                                  <Label className="text-[10px] text-indigo-700 font-bold uppercase tracking-tight">Ma'asyirol</Label>
                                  <Input value={session.maasyirol} onChange={e => updateSession(day.id, session.id, 'maasyirol', e.target.value)} className="h-9 bg-white text-sm" placeholder="Nama Ma'asyirol" />
                                </div>
                                <div className="flex flex-col justify-end space-y-1.5">
                                  <Label className="text-[10px] text-indigo-700 font-bold uppercase tracking-tight">Muazin</Label>
                                  <Input value={session.muazin} onChange={e => updateSession(day.id, session.id, 'muazin', e.target.value)} className="h-9 bg-white text-sm" placeholder="Nama Muazin" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <Button variant="outline" size="sm" onClick={() => addSession(day.id)} className="mt-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 border-dashed w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-1" /> Tambah Sesi Kajian Lain di Hari {day.name}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleSaveDraft} 
            disabled={loading}
            variant="outline"
            className="w-full sm:w-1/3 h-12 text-slate-700 hover:bg-slate-100 bg-white border-slate-300 shadow-sm"
          >
            <Save className="w-5 h-5 mr-2 text-indigo-600" /> Simpan Draft Sementara
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full sm:w-2/3 h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            {loading ? "Mengeksekusi Data..." : "⚡ Generate Seluruh Jadwal Sekarang"}
          </Button>
        </CardFooter>
      </Card>

      <CustomDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onCancel={() => setDialogState(prev => ({...prev, isOpen: false}))}
        onConfirm={() => setDialogState(prev => ({...prev, isOpen: false}))}
      />
    </div>
  )
}
