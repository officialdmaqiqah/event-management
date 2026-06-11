import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Users, MapPin, CalendarDays, CheckCircle2, AlertCircle } from "lucide-react"

export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Ambil profil pengguna
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved, jabatan')
    .eq('user_id', user?.id)
    .single()

  const isAdmin = user?.email === 'officialsiyoyok@gmail.com' || user?.email?.startsWith('yahya')

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

  const getWIBDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false
    };
    const parts = new Intl.DateTimeFormat('id-ID', options).formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    return `${day} ${month} ${year}, ${hour}:${minute}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Utama</h1>
          <p className="text-slate-500 mt-1">Ringkasan aktivitas peminjaman dan event publik</p>
        </div>
        <div className="flex gap-2">
          <Link href="/ajukan-peminjaman">
            <Button className="bg-indigo-600 hover:bg-indigo-700">+ Buat Peminjaman</Button>
          </Link>
          <Link href="/admin/events/new">
            <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">+ Buat Event Publik</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Peminjaman Menunggu Approval</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{pendingCount || 0}</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Peminjaman Disetujui</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{approvedCount || 0}</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Event Publik Aktif</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{activeEventCount || 0}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Jadwal Peminjaman Terdekat</CardTitle>
                <CardDescription>Kegiatan yang akan berlangsung di MAKT</CardDescription>
              </div>
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingPeminjaman && upcomingPeminjaman.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingPeminjaman.map((item) => (
                  <div key={item.id} className="p-4 flex items-start gap-3 sm:gap-4 hover:bg-slate-50 transition-colors">
                    <div className="bg-indigo-50 text-indigo-700 p-2 sm:p-3 rounded-lg flex-shrink-0 text-center min-w-[50px] sm:min-w-[60px]">
                      <div className="text-sm font-semibold">{new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { day: '2-digit', timeZone: 'Asia/Jakarta' })}</div>
                      <div className="text-[10px] sm:text-xs">{new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { month: 'short', timeZone: 'Asia/Jakarta' })}</div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate capitalize text-sm sm:text-base leading-tight">{item.nama_event}</h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5">
                          <span className="flex items-center gap-1 whitespace-nowrap"><Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" /> {new Date(item.tanggal_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false }).replace(/\./g, ':')} WIB</span>
                          <span className="flex items-center gap-1 truncate"><MapPin className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" /> <span className="truncate">{item.area_fasilitas[0]}</span></span>
                        </div>
                      </div>
                      <div className="shrink-0 mt-1 sm:mt-0">
                        <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 sm:py-1 rounded-full font-semibold uppercase ${item.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>Tidak ada peminjaman dalam waktu dekat.</p>
              </div>
            )}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <Link href="/admin/pengajuan" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                Lihat Semua Peminjaman &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-gradient-to-br from-indigo-900 to-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl">Panduan Penggunaan</CardTitle>
            <CardDescription className="text-indigo-200">Perbedaan fitur utama pada sistem ini</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-indigo-500/30 p-1.5 rounded-md"><MapPin className="h-4 w-4 text-indigo-300" /></div>
                <h4 className="font-semibold text-indigo-100">1. Peminjaman Ruang</h4>
              </div>
              <p className="text-sm text-indigo-200 leading-relaxed">Gunakan fitur ini untuk memesan ruang rapat atau area masjid. Sistem sudah menyediakan fitur Absensi Internal berbasis GPS untuk rapat Anda.</p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-emerald-500/30 p-1.5 rounded-md"><Users className="h-4 w-4 text-emerald-300" /></div>
                <h4 className="font-semibold text-indigo-100">2. Event Publik</h4>
              </div>
              <p className="text-sm text-indigo-200 leading-relaxed">Jika rapat/peminjaman Anda adalah acara besar (seperti kajian akbar) yang butuh pendaftaran jamaah luar, silakan buat Event Publik untuk menyebarkan form pendaftaran (E-Ticket).</p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
