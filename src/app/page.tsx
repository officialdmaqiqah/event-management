import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, FileText, CheckCircle2, BellRing, QrCode, ClipboardList, MapPin, ArrowRight, ShieldCheck, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

// Komponen Card Kalender
function EventCard({ event }: { event: any }) {
  const startDate = new Date(event.start_datetime)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 group-hover:bg-emerald-600 transition-colors"></div>
      <div className="flex justify-between items-start mb-3">
        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
          {event.type}
        </span>
      </div>
      <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
        {event.title}
      </h3>
      <div className="flex items-center text-xs font-medium text-slate-500 mt-auto pt-4 border-t border-slate-50">
        <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
        {startDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
        <span className="mx-2">•</span>
        {startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
      </div>
    </div>
  )
}

export default async function Home() {
  const supabase = createClient()
  
  // Ambil 4 event terdekat
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .gte("start_datetime", new Date().toISOString())
    .eq("status", "published")
    .order("start_datetime", { ascending: true })
    .limit(4)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      {/* Navbar */}
      <header className="px-4 sm:px-6 lg:px-14 min-h-[4.5rem] py-2 flex flex-wrap items-center bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex gap-3 items-center">
          <div className="bg-emerald-900 p-1.5 rounded-lg">
            <MapPin className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight text-emerald-900 leading-none">MAKT Event</span>
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest hidden sm:block">Masjid Agung Kubah Timah</span>
          </div>
        </div>
        
        <nav className="ml-auto flex items-center gap-2 sm:gap-4">
          <Link href="/cek-status" className="hidden sm:flex">
            <Button variant="ghost" size="sm" className="text-emerald-800 font-bold hover:bg-emerald-50 hover:text-emerald-900">
              <Search className="h-4 w-4 mr-1.5" /> Cek Status
            </Button>
          </Link>
          <Link href="/admin/login">
            <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-bold">
              <ShieldCheck className="h-4 w-4 mr-1.5" /> Masuk Admin
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative bg-emerald-900 pt-16 pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-700/50 text-amber-400 text-xs font-bold uppercase tracking-widest mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Sistem Informasi Resmi
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
              Sistem Manajemen Event & <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                Peminjaman Fasilitas MAKT
              </span>
            </h1>
            
            <p className="mt-4 text-lg sm:text-xl text-emerald-100/90 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Ajukan peminjaman tempat, pantau proses persetujuan, dan telusuri kalender kegiatan resmi Masjid Agung Kubah Timah secara transparan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/ajukan-peminjaman" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-base shadow-lg shadow-amber-500/20">
                  <FileText className="h-5 w-5 mr-2" /> Ajukan Peminjaman
                </Button>
              </Link>
              <Link href="/kalender" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-14 px-8 bg-transparent border-2 border-emerald-700 text-white hover:bg-emerald-800 hover:text-white font-bold text-base">
                  <CalendarIcon className="h-5 w-5 mr-2" /> Lihat Kalender Event
                </Button>
              </Link>
            </div>
            
            <div className="mt-8">
              <Link href="/cek-status" className="text-sm font-semibold text-emerald-300 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-colors sm:hidden">
                <Search className="h-4 w-4" /> Cek Status Pengajuan Anda
              </Link>
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITION (Fitur Utama) */}
        <section className="py-20 bg-white relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-emerald-950">Layanan & Fitur Terpadu</h2>
              <div className="h-1 w-20 bg-amber-500 mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <FileText/>, title: "Pengajuan Online", desc: "Isi formulir dari rumah, unggah proposal pendukung, dan pantau status tanpa harus datang ke sekretariat." },
                { icon: <ShieldCheck/>, title: "Approval Berjenjang", desc: "Sistem persetujuan yang terstruktur oleh pengurus masjid untuk memastikan kelayakan setiap kegiatan." },
                { icon: <CalendarIcon/>, title: "Kalender Publik", desc: "Transparansi jadwal untuk meminimalisir bentrok acara dan memudahkan masyarakat melihat kegiatan." },
                { icon: <BellRing/>, title: "Notifikasi WhatsApp", desc: "Dapatkan pembaruan status pengajuan Anda langsung melalui pesan WhatsApp secara otomatis." },
                { icon: <QrCode/>, title: "Absensi Internal", desc: "Sistem check-in presensi berbasis QR & GPS terintegrasi khusus untuk rapat dan evaluasi pengurus." },
                { icon: <ClipboardList/>, title: "Notulen & Dokumentasi", desc: "Pencatatan risalah rapat digital, penyimpanan foto kegiatan, dan laporan siap cetak (PDF)." }
              ].map((fitur, i) => (
                <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-100 transition-colors group">
                  <div className="h-12 w-12 bg-white text-emerald-700 rounded-xl flex items-center justify-center shadow-sm mb-5 group-hover:scale-110 transition-transform">
                    {fitur.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{fitur.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{fitur.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ALUR PENGAJUAN */}
        <section className="py-20 bg-emerald-50 border-y border-emerald-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-black text-emerald-950 mb-16">Alur Pengajuan Kegiatan</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-emerald-200 -translate-y-1/2 z-0"></div>
              
              {[
                { no: "1", title: "Isi Formulir", desc: "Lengkapi data kegiatan" },
                { no: "2", title: "Verifikasi Admin", desc: "Pengecekan kelengkapan" },
                { no: "3", title: "Approval", desc: "Persetujuan pengurus" },
                { no: "4", title: "Masuk Kalender", desc: "Jadwal diterbitkan" },
                { no: "5", title: "Notifikasi WA", desc: "Pemohon dikabari" },
              ].map((step, i) => (
                <div key={i} className="relative z-10 bg-white p-5 rounded-xl shadow-sm border border-emerald-100 w-full md:w-48 text-center">
                  <div className="h-8 w-8 bg-amber-500 text-emerald-950 font-black rounded-full flex items-center justify-center mx-auto mb-3 text-sm">
                    {step.no}
                  </div>
                  <h4 className="font-bold text-emerald-900 mb-1 text-sm">{step.title}</h4>
                  <p className="text-xs text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KALENDER PREVIEW */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-end mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-black text-emerald-950">Agenda Terdekat</h2>
                <p className="text-slate-500 mt-2">Kegiatan publik yang akan datang di MAKT.</p>
              </div>
              <Link href="/kalender">
                <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold">
                  Lihat Kalender Penuh <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {upcomingEvents.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center">
                <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Belum ada agenda terdekat</h3>
                <p className="text-slate-500 text-sm mt-1">Saat ini belum ada kegiatan publik yang terjadwal dalam waktu dekat.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA AKHIR */}
        <section className="py-24 bg-emerald-900 relative overflow-hidden text-center px-4">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
              Ingin mengadakan kegiatan di <span className="text-amber-400">MAKT?</span>
            </h2>
            <p className="text-emerald-100/90 mb-10 text-lg">
              Ajukan permohonan pemakaian fasilitas Masjid Agung Kubah Timah sekarang juga melalui portal terpadu kami.
            </p>
            <Link href="/ajukan-peminjaman">
              <Button size="lg" className="h-14 px-10 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black text-base shadow-xl">
                Ajukan Peminjaman Sekarang
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-emerald-950 text-emerald-200 py-8 text-center text-sm border-t border-emerald-900">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <MapPin className="h-5 w-5 text-amber-500" /> Masjid Agung Kubah Timah
          </div>
          <p>© {new Date().getFullYear()} Hak Cipta Dilindungi. Sistem Manajemen Event MAKT.</p>
          <div className="flex gap-4">
            <Link href="/laporan-rapat" className="hover:text-white transition-colors">Arsip Laporan</Link>
            <Link href="/admin/login" className="hover:text-white transition-colors">Login Pengurus</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
