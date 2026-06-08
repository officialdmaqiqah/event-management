import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, FileText, CheckCircle2, BellRing, QrCode, ClipboardList, MapPin, ArrowRight, ShieldCheck, Search, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

// Komponen Card Kalender
function EventCard({ event }: { event: any }) {
  const startDate = new Date(event.start_datetime)
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative group overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex justify-between items-start mb-5">
        <span className="bg-slate-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-100 group-hover:border-emerald-100 group-hover:bg-emerald-50 transition-colors">
          {event.type}
        </span>
      </div>
      
      <h3 className="font-extrabold text-slate-900 text-xl leading-snug mb-3 group-hover:text-emerald-700 transition-colors">
        {event.title}
      </h3>
      
      <div className="flex items-center text-sm font-semibold text-slate-500 mt-auto pt-5 border-t border-slate-100">
        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center mr-3 group-hover:bg-emerald-100 transition-colors">
          <CalendarIcon className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-slate-700">{startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="text-slate-400 text-xs">{startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
        </div>
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
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navbar - Modern Glass */}
      <header className="px-4 sm:px-6 lg:px-14 h-20 flex items-center bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/50">
        <div className="flex gap-3 items-center group cursor-pointer">
          <div className="bg-emerald-950 p-2 rounded-xl group-hover:bg-emerald-900 transition-colors">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-slate-900 leading-none group-hover:text-emerald-800 transition-colors">MAKT Event</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block mt-0.5">Masjid Agung Kubah Timah</span>
          </div>
        </div>
        
        <nav className="ml-auto flex items-center gap-3">
          <Link href="/cek-status" className="hidden sm:flex">
            <Button variant="ghost" className="rounded-full text-slate-600 font-bold hover:bg-slate-100 hover:text-emerald-800 transition-all">
              <Search className="h-4 w-4 mr-2" /> Cek Status
            </Button>
          </Link>
          <Link href="/admin/login">
            <Button variant="outline" className="rounded-full border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 font-bold transition-all shadow-sm">
              <ShieldCheck className="h-4 w-4 mr-2" /> Admin Area
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        
        {/* HERO SECTION - Modern Dark Glow */}
        <section className="relative bg-[#022c22] pt-24 pb-32 overflow-hidden flex items-center justify-center min-h-[85vh]">
          {/* Abstract Background Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#022c22] to-[#041a15] z-0"></div>
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-800/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 mix-blend-screen pointer-events-none"></div>
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/40 border border-emerald-700/50 backdrop-blur-md text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-8 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Sistem Manajemen Fasilitas MAKT
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
              Kelola Event Dengan <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-amber-200 to-amber-500">
                Lebih Elegan & Mudah
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-emerald-100/70 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Ajukan peminjaman tempat, pantau persetujuan, dan telusuri agenda publik Masjid Agung Kubah Timah melalui portal digital terpadu.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Link href="/ajukan-peminjaman" className="w-full sm:w-auto group">
                <Button variant="custom" size="lg" className="w-full h-14 px-8 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-base rounded-full shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] transition-all duration-300 group-hover:shadow-[0_0_60px_-15px_rgba(245,158,11,0.7)] group-hover:-translate-y-1">
                  <FileText className="h-5 w-5 mr-2" /> Ajukan Peminjaman
                </Button>
              </Link>
              <Link href="/kalender" className="w-full sm:w-auto">
                <Button variant="custom" size="lg" className="w-full h-14 px-8 bg-emerald-900/20 border border-emerald-700/50 backdrop-blur-md text-emerald-50 hover:bg-emerald-800/50 hover:text-white font-medium text-base rounded-full transition-all duration-300 hover:border-emerald-500/50">
                  <CalendarIcon className="h-5 w-5 mr-2" /> Lihat Kalender
                </Button>
              </Link>
            </div>
            
            <div className="mt-10">
              <Link href="/cek-status" className="text-sm font-medium text-emerald-400/80 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-colors sm:hidden">
                <Search className="h-4 w-4" /> Cek Status Pengajuan
              </Link>
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITION - Modern Grid Layout */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-sm font-bold text-emerald-600 tracking-widest uppercase mb-3">Layanan Terpadu</h2>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Solusi Digital Berbasis Masjid</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
              {[
                { icon: <FileText className="h-6 w-6"/>, title: "Pengajuan Online", desc: "Isi formulir dari rumah, unggah proposal pendukung, dan pantau status tanpa harus datang ke sekretariat." },
                { icon: <ShieldCheck className="h-6 w-6"/>, title: "Approval Berjenjang", desc: "Sistem persetujuan yang terstruktur oleh pengurus masjid untuk memastikan kelayakan setiap kegiatan." },
                { icon: <CalendarIcon className="h-6 w-6"/>, title: "Kalender Publik", desc: "Transparansi jadwal untuk meminimalisir bentrok acara dan memudahkan masyarakat melihat kegiatan." },
                { icon: <BellRing className="h-6 w-6"/>, title: "Notifikasi Realtime", desc: "Dapatkan pembaruan status pengajuan Anda langsung melalui sistem dengan cepat dan responsif." },
                { icon: <QrCode className="h-6 w-6"/>, title: "Absensi Berbasis QR", desc: "Sistem check-in presensi terintegrasi khusus untuk rapat dan evaluasi pengurus." },
                { icon: <ClipboardList className="h-6 w-6"/>, title: "Arsip Terpusat", desc: "Pencatatan risalah rapat digital, penyimpanan foto kegiatan, dan laporan yang terorganisir." }
              ].map((fitur, i) => (
                <div key={i} className="flex gap-6 group cursor-default">
                  <div className="shrink-0 mt-1">
                    <div className="h-14 w-14 bg-slate-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 shadow-sm group-hover:shadow-emerald-600/30">
                      {fitur.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">{fitur.title}</h4>
                    <p className="text-slate-500 leading-relaxed text-sm font-medium">{fitur.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ALUR PENGAJUAN - Elegant Steps */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-slate-900">Alur Pengajuan Cepat</h2>
              <p className="text-slate-500 mt-3 font-medium">Proses transparan dari awal pengajuan hingga disetujui</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative mt-12">
              <div className="hidden md:block absolute top-1/2 left-[10%] w-[80%] h-0.5 bg-gradient-to-r from-emerald-100 via-emerald-300 to-emerald-100 -translate-y-1/2 z-0"></div>
              
              {[
                { no: "1", title: "Isi Formulir", desc: "Lengkapi data kegiatan secara online" },
                { no: "2", title: "Verifikasi", desc: "Pengecekan kelengkapan oleh Admin" },
                { no: "3", title: "Approval", desc: "Persetujuan final oleh Pengurus" },
                { no: "4", title: "Kalender", desc: "Jadwal resmi diterbitkan ke publik" },
              ].map((step, i) => (
                <div key={i} className="relative z-10 w-full md:w-56 text-center group">
                  <div className="h-16 w-16 bg-white border-4 border-slate-50 text-emerald-700 shadow-xl shadow-slate-200/50 font-black text-xl rounded-full flex items-center justify-center mx-auto mb-5 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-100 transition-all duration-500 group-hover:-translate-y-2">
                    {step.no}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 text-lg">{step.title}</h4>
                  <p className="text-sm text-slate-500 font-medium px-4">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KALENDER PREVIEW - Clean Cards */}
        <section className="py-24 bg-white relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 rounded-l-[100px] pointer-events-none opacity-50"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-sm font-bold text-amber-500 tracking-widest uppercase mb-3">Agenda Terjadwal</h2>
                <h3 className="text-3xl font-black text-slate-900">Kegiatan Terdekat MAKT</h3>
              </div>
              <Link href="/kalender">
                <Button className="rounded-full bg-slate-900 hover:bg-emerald-900 text-white font-bold px-6 transition-all duration-300 shadow-md">
                  Lihat Semua Agenda <ArrowRight className="h-4 w-4 ml-2" />
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
              <div className="bg-white border border-slate-100 rounded-[2rem] p-16 text-center shadow-sm">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CalendarIcon className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Belum ada agenda terdekat</h3>
                <p className="text-slate-500 font-medium">Saat ini belum ada kegiatan publik yang terjadwal dalam waktu dekat.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA AKHIR - Elegant Dark */}
        <section className="py-24 bg-emerald-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-800/40 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <Sparkles className="h-12 w-12 text-amber-400 mx-auto mb-8 opacity-80" />
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
              Siap menyelenggarakan acara di <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">MAKT?</span>
            </h2>
            <p className="text-emerald-100/70 mb-12 text-lg font-medium leading-relaxed">
              Manfaatkan fasilitas terbaik kami untuk mendukung kesuksesan kegiatan Islami Anda. Proses mudah, transparan, dan terpercaya.
            </p>
            <Link href="/ajukan-peminjaman">
              <Button variant="custom" size="lg" className="h-14 px-10 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-base shadow-xl rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.6)]">
                Mulai Pengajuan Sekarang
              </Button>
            </Link>
          </div>
        </section>

      </main>

      {/* FOOTER - Clean & Minimal */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8 text-center sm:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-2 font-black text-slate-900 text-xl mb-4">
                <MapPin className="h-6 w-6 text-emerald-600" /> MAKT Event
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed text-center sm:text-left max-w-xs">
                Sistem informasi terpadu untuk pengelolaan jadwal dan perizinan fasilitas Masjid Agung Kubah Timah.
              </p>
            </div>
            
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">Tautan Cepat</h4>
              <div className="flex flex-col gap-3">
                <Link href="/kalender" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Kalender Kegiatan</Link>
                <Link href="/cek-status" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Cek Status Pengajuan</Link>
                <Link href="/ajukan-peminjaman" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Ajukan Peminjaman</Link>
              </div>
            </div>
            
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">Internal</h4>
              <div className="flex flex-col gap-3">
                <Link href="/admin/login" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Portal Pengurus</Link>
                <Link href="/laporan-rapat" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Arsip Dokumen</Link>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm font-medium">© {new Date().getFullYear()} Masjid Agung Kubah Timah. Hak Cipta Dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

