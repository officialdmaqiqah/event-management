import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Users, MapPin, CalendarDays, CheckCircle2, AlertCircle, PlusCircle, ArrowRight, Sparkles, BookOpen, ShieldCheck } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Ambil profil pengguna
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved, jabatan, system_role')
    .eq('user_id', user?.id)
    .single()

  const isAdmin = profile?.system_role === 'super_admin' || profile?.system_role === 'admin_makt' || user?.email === 'officialsiyoyok@gmail.com' || user?.email?.startsWith('yahya')

  // Statistik Pengajuan (Peminjaman)
  let pendingQuery = supabase.from("pengajuan_peminjaman").select("id", { count: "exact" }).in("status", ["submitted", "under_review", "revision_requested"])
  let approvedQuery = supabase.from("pengajuan_peminjaman").select("id", { count: "exact" }).eq("status", "approved")
  
  if (!isAdmin && user) {
    pendingQuery = pendingQuery.eq("user_id", user.id)
    approvedQuery = approvedQuery.eq("user_id", user.id)
  }

  const { count: pendingCount } = await pendingQuery
  const { count: approvedCount } = await approvedQuery

  // Statistik Event Publik
  let eventQuery = supabase.from("events").select("id", { count: "exact" }).eq("status", "published")
  if (!isAdmin && user) {
    eventQuery = eventQuery.eq("user_id", user.id)
  }
  const { count: activeEventCount } = await eventQuery

  // Daftar Peminjaman Terdekat
  let upcomingQuery = supabase
    .from("pengajuan_peminjaman")
    .select("id, nama_event, tanggal_mulai, area_fasilitas, status")
    .gte("tanggal_mulai", new Date().toISOString())
    .order("tanggal_mulai", { ascending: true })
    .limit(4)

  if (!isAdmin && user) {
    upcomingQuery = upcomingQuery.eq("user_id", user.id)
  }
  const { data: upcomingPeminjaman } = await upcomingQuery

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed font-display text-[11px] font-bold mb-1.5 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
            <span>Pusat Kendali Administrasi MAKT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary font-display">
            Dashboard Pengurus
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Ringkasan data perizinan peminjaman fasilitas dan agenda syiar Masjid Agung Kubah Timah.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/ajukan-peminjaman">
            <Button className="bg-primary text-on-primary hover:bg-primary-container font-display text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 h-10 px-4">
              <PlusCircle className="h-4 w-4" />
              <span>Buat Peminjaman</span>
            </Button>
          </Link>
          <Link href="/admin/events/new">
            <Button className="bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-container font-display text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 h-10 px-4">
              <Sparkles className="h-4 w-4" />
              <span>Buat Event Publik</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Menunggu Approval */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="h-1 w-full bg-amber-500 absolute top-0 inset-x-0" />
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menunggu Approval</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1.5 font-display">{pendingCount || 0}</h3>
                <span className="text-[11px] text-amber-700 font-semibold mt-1 inline-block">
                  Butuh verifikasi pengurus
                </span>
              </div>
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100/80">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Peminjaman Disetujui */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="h-1 w-full bg-primary absolute top-0 inset-x-0" />
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peminjaman Disetujui</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1.5 font-display">{approvedCount || 0}</h3>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                  Izin terbit & terjadwal
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50 text-primary rounded-2xl border border-emerald-100/80">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Event Publik Aktif */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="h-1 w-full bg-secondary-fixed absolute top-0 inset-x-0" />
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Publik Terbit</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1.5 font-display">{activeEventCount || 0}</h3>
                <span className="text-[11px] text-emerald-800 font-semibold mt-1 inline-block">
                  Kajian & syiar umum aktif
                </span>
              </div>
              <div className="p-3.5 bg-secondary-fixed/30 text-on-secondary-fixed rounded-2xl border border-secondary-fixed/50">
                <Users className="w-6 h-6 text-emerald-900" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left Column: Jadwal Peminjaman Terdekat */}
        <Card className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="bg-surface-container-low/50 border-b border-slate-100 py-4 px-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-primary font-display">
                  Jadwal Peminjaman Terdekat
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Agenda pemakaian fasilitas yang akan segera berlangsung
                </CardDescription>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-primary flex items-center justify-center">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {upcomingPeminjaman && upcomingPeminjaman.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingPeminjaman.map((item) => (
                  <div key={item.id} className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:bg-slate-50/80 transition-colors">
                    <div className="bg-emerald-50 text-primary border border-emerald-100/80 p-2 sm:p-2.5 rounded-xl flex-shrink-0 text-center min-w-[52px] sm:min-w-[58px]">
                      <div className="text-base font-black font-display leading-none">
                        {new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', timeZone: 'Asia/Jakarta' })}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase mt-1">
                        {new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' })}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate capitalize text-sm sm:text-base leading-snug">
                          {item.nama_event}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 whitespace-nowrap text-slate-600 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(item.tanggal_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false }).replace(/\./g, ':')} WIB
                          </span>
                          <span className="flex items-center gap-1 truncate text-slate-600 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">{item.area_fasilitas[0]}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                          item.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status === 'approved' ? 'Disetujui' : item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500 space-y-1">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">Tidak ada peminjaman dalam waktu dekat</p>
                <p className="text-xs text-slate-400">Pengajuan baru yang disetujui akan muncul di sini.</p>
              </div>
            )}
            
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center">
              <Link 
                href="/admin/pengajuan" 
                className="text-xs font-bold text-primary hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
              >
                <span>Kelola Semua Pengajuan Peminjaman</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Panduan Penggunaan Sistem MAKT */}
        <Card className="rounded-2xl bg-gradient-to-br from-[#0D4734] via-[#093527] to-[#06281E] text-white overflow-hidden relative shadow-md border-0">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#FED65B]/15 rounded-full blur-3xl pointer-events-none" />
          
          <CardHeader className="relative z-10 pb-3 pt-6 px-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#FED65B] text-[#241A00] flex items-center justify-center font-bold">
                <BookOpen className="h-4 w-4 text-[#735C00]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FED65B]">Panduan Pengurus</span>
            </div>
            <CardTitle className="text-xl font-bold font-display text-white">
              Struktur Manajemen Fitur MAKT
            </CardTitle>
            <CardDescription className="text-xs text-emerald-200/80">
              Panduan pembagian alur kerja peminjaman fasilitas dan publikasi event
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 space-y-3.5 px-6 pb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="bg-[#FED65B]/20 p-1.5 rounded-lg text-[#FED65B]">
                  <MapPin className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-sm text-[#FED65B]">1. Peminjaman Fasilitas & Rapat</h4>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Digunakan untuk permohonan ruangan/area (Ruang VIP, Serbaguna, Pelataran). Sistem menyediakan fitur Absensi Internal berbasis GPS untuk memonitor kehadiran rapat pengurus/panitia.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="bg-emerald-400/20 p-1.5 rounded-lg text-emerald-300">
                  <Users className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-sm text-emerald-200">2. Event Publik & E-Tiket</h4>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Jika kegiatan terbuka untuk umum (seperti Tabligh Akbar, Seminar, atau Kajian Rutin) yang membutuhkan kuota pendaftaran jamaah, gunakan fitur Event Publik untuk menerbitkan formulir registrasi online dan E-Tiket QR.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
