import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, FileText, CheckCircle2, BellRing, QrCode, ClipboardList, MapPin, ArrowRight, ShieldCheck, Search, Sparkles, Building2, Image as ImageIcon, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { FasilitasGrid } from "@/components/FasilitasGrid"

// Komponen Card Kalender
function EventCard({ event }: { event: any }) {
  const startDate = new Date(event.start_datetime || event.tanggal_mulai)
  const title = event.title || event.nama_event
  const type = event.type || event.jenis_event
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative group overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex justify-between items-start mb-5">
        <span className="bg-slate-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-100 group-hover:border-emerald-100 group-hover:bg-emerald-50 transition-colors">
          {type}
        </span>
        {event.privacy_event === 'publik_terbatas' && (
          <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2.5 py-1 rounded-md border border-rose-100 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Internal
          </span>
        )}
      </div>
      
      <h3 className="font-bold text-slate-900 text-lg leading-tight mb-3 group-hover:text-emerald-700 transition-colors capitalize line-clamp-3">
        {title}
      </h3>
      
      <div className="flex items-center text-sm font-semibold text-slate-500 mt-auto pt-5 border-t border-slate-100">
        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center mr-3 group-hover:bg-emerald-100 transition-colors">
          <CalendarIcon className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-slate-700">{startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}</span>
          <span className="text-slate-400 text-xs">{startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false }).replace(/\./g, ':')} WIB</span>
        </div>
      </div>
    </div>
  )
}

// Data Fasilitas
const FASILITAS_MAKT = [
  {
    id: "ruang-utama",
    nama: "Ruang Utama (Masjid)",
    deskripsi: "Kapasitas besar, pendingin udara terpusat, dan akustik ruang premium. Sangat cocok untuk kajian akbar tingkat kota maupun nasional. Ideal untuk acara akad nikah yang sakral.",
    image: "/ruang-utama.jpg",
  },
  {
    id: "ruang-lt2",
    nama: "Ruang Lt. 2",
    deskripsi: "Ruangan privat yang nyaman. Ideal untuk musyawarah, rapat pimpinan, diskusi kelompok terbatas, kelas training, atau pelatihan.",
  },
  {
    id: "pelataran-depan",
    nama: "Halaman Pelataran Depan",
    deskripsi: "Area terbuka yang luas dengan pemandangan langsung kubah timah nan ikonik. Sering digunakan untuk festival Islami dan resepsi.",
    image: "/pelataran-depan.jpg",
  },
  {
    id: "pelataran-samping",
    nama: "Halaman Pelataran Samping",
    deskripsi: "Lahan paving semi-outdoor yang fleksibel. Biasa dimanfaatkan untuk bazar UMKM, pameran buku, dan kegiatan komunitas.",
  },
  {
    id: "halaman-belakang",
    nama: "Halaman Belakang (Area Pasir)",
    deskripsi: "Area santai berbasis alam. Tempat sempurna untuk kegiatan edukasi anak (TPA/TPQ), outbound mini, atau acara bernuansa kasual.",
  },
  {
    id: "lapangan-parkir",
    nama: "Lapangan Parkir Luas",
    deskripsi: "Mampu menampung ratusan kendaraan roda dua dan roda empat dengan sistem keamanan terpantau untuk kenyamanan tamu.",
  }
]

export default async function Home() {
  const supabase = createClient()
  
  // Ambil 4 event terdekat dari pengajuan yang disetujui
  const { data: upcomingEvents } = await supabase
    .from("pengajuan_peminjaman")
    .select("*")
    .in("status", ["approved"])
    .in("privacy_event", ["detail_publik", "umum_saja", "publik_terbatas"])
    .gte("tanggal_mulai", new Date().toISOString())
    .order("tanggal_mulai", { ascending: true })
    .limit(4)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navbar - Modern Glass */}
      <header className="px-4 sm:px-6 lg:px-14 h-20 flex items-center bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/50">
        <div className="flex gap-3 items-center group cursor-pointer">
          <div className="flex items-center justify-center mr-1">
            <img src="/logo-makt-full.png" alt="Logo MAKT" className="h-10 w-auto" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-slate-900 leading-none group-hover:text-emerald-800 transition-colors">MAKT Event</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Masjid Agung Kubah Timah</span>
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
              Pusat Syiar & Edukasi
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
              Pusat Layanan Kegiatan <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-amber-200 to-amber-500">
                Masjid Agung Kubah Timah
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-emerald-100/80 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              Jelajahi jadwal kajian terkini, ikuti agenda syiar Islam, atau rencanakan penyelenggaraan acara spesial Anda dengan fasilitas premium dari MAKT.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Link href="/kalender" className="w-full sm:w-auto group">
                <Button variant="custom" size="lg" className="w-full h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-full shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all duration-300 group-hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] group-hover:-translate-y-1 border border-emerald-400/50">
                  <CalendarIcon className="h-5 w-5 mr-2" /> Jadwal Kajian & Event
                </Button>
              </Link>
              <Link href="/ajukan-peminjaman" className="w-full sm:w-auto group">
                <Button variant="custom" size="lg" className="w-full h-14 px-8 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-base rounded-full shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] transition-all duration-300 group-hover:shadow-[0_0_60px_-15px_rgba(245,158,11,0.7)] group-hover:-translate-y-1">
                  <FileText className="h-5 w-5 mr-2" /> Rencanakan Acara Anda
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

        {/* AGENDA TERDEKAT - Untuk Jamaah */}
        <section className="py-24 bg-slate-50 relative -mt-10 rounded-t-[3rem] z-20 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mb-12 gap-6">
              <div className="text-center sm:text-left">
                <h2 className="text-sm font-bold text-amber-500 tracking-widest uppercase mb-3 flex items-center justify-center sm:justify-start gap-2">
                  <BellRing className="h-4 w-4" /> Informasi Jamaah
                </h2>
                <h3 className="text-3xl font-black text-slate-900">Agenda Terdekat</h3>
              </div>
              <Link href="/kalender">
                <Button className="rounded-full bg-slate-900 hover:bg-emerald-900 text-white font-bold px-6 transition-all duration-300 shadow-md">
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
              <div className="bg-white border border-slate-100 rounded-[2rem] p-16 text-center shadow-sm">
                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CalendarIcon className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Agenda Dalam Waktu Dekat</h3>
                <p className="text-slate-500 font-medium">Pantau terus halaman ini untuk update kajian terbaru.</p>
              </div>
            )}
          </div>
        </section>

        {/* FASILITAS PREMIUM KAMI - Image Grid Section */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-emerald-600 tracking-widest uppercase mb-3">VENUE & AREA</h2>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Fasilitas Masjid</h3>
              <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto font-medium">Fasilitas ikonik yang nyaman, disiapkan untuk menyambut langkah Anda dalam menuntut ilmu dan merangkai momen penuh berkah.</p>
            </div>
            
            <FasilitasGrid fasilitasMakt={FASILITAS_MAKT} />
          </div>
        </section>

        {/* VALUE PROPOSITION - Split Audience */}
        <section className="py-24 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-amber-500 tracking-widest uppercase mb-3">Keunggulan Sistem</h2>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Lebih Dari Sekadar Tempat</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              {/* Kolom Jamaah */}
              <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-emerald-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900">Bagi Jamaah</h4>
                </div>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-lg mb-1">Informasi Terpusat</h5>
                      <p className="text-slate-500 text-sm leading-relaxed">Seluruh jadwal kajian rutin dan tabligh akbar terupdate secara real-time di satu kalender.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-lg mb-1">Transparansi Jadwal</h5>
                      <p className="text-slate-500 text-sm leading-relaxed">Hindari datang ke masjid di waktu yang kosong atau salah jadwal dengan melihat kalender publik kami.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-lg mb-1">Ekosistem Masjid Ramah</h5>
                      <p className="text-slate-500 text-sm leading-relaxed">Dikelilingi oleh fasilitas Islami yang bersih dan terawat, siap menyambut ibadah Anda.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Penyelenggara */}
              <div className="bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="h-12 w-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-black text-white">Bagi Penyelenggara Acara</h4>
                </div>
                <div className="space-y-8 relative z-10">
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1"><CheckCircle2 className="h-5 w-5 text-amber-400" /></div>
                    <div>
                      <h5 className="font-bold text-white text-lg mb-1">Birokrasi Bebas Kertas</h5>
                      <p className="text-slate-400 text-sm leading-relaxed">Isi formulir perencanaan secara online dan unggah dokumen pendukung tanpa repot datang ke sekretariat.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1"><CheckCircle2 className="h-5 w-5 text-amber-400" /></div>
                    <div>
                      <h5 className="font-bold text-white text-lg mb-1">Notifikasi Otomatis</h5>
                      <p className="text-slate-400 text-sm leading-relaxed">Pantau status pengajuan izin secara transparan dengan pemberitahuan melalui sistem.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1"><CheckCircle2 className="h-5 w-5 text-amber-400" /></div>
                    <div>
                      <h5 className="font-bold text-white text-lg mb-1">Publikasi Terintegrasi</h5>
                      <p className="text-slate-400 text-sm leading-relaxed">Begitu disetujui, acara Anda otomatis tayang di Kalender MAKT untuk menarik minat jamaah.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ALUR PENGAJUAN - Elegant Steps (Khusus Penyelenggara) */}
        <section className="py-24 bg-white relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-3">TUTORIAL PEMBUAT ACARA</h2>
              <h3 className="text-3xl font-black text-slate-900">Alur Perencanaan Event</h3>
              <p className="text-slate-500 mt-3 font-medium text-lg">Hanya butuh 4 langkah mudah untuk mewujudkan acara Anda</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative mt-16">
              <div className="hidden md:block absolute top-1/2 left-[10%] w-[80%] h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
              
              {[
                { no: "1", title: "Rencanakan", desc: "Pilih tanggal, fasilitas, dan isi detail konsep." },
                { no: "2", title: "Review", desc: "Tim meninjau kesesuaian dan keamanan jadwal." },
                { no: "3", title: "Disetujui", desc: "Izin terbit. Anda siap menjalankan acara!" },
                { no: "4", title: "Go Public", desc: "Otomatis diumumkan di kalender." },
              ].map((step, i) => (
                <div key={i} className="relative z-10 w-full md:w-56 text-center group">
                  <div className="h-16 w-16 bg-white border-4 border-slate-100 text-slate-300 font-black text-xl rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-amber-500 group-hover:text-slate-900 group-hover:border-amber-100 transition-all duration-500 group-hover:-translate-y-2 shadow-sm">
                    {step.no}
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2 text-lg">{step.title}</h4>
                  <p className="text-sm text-slate-500 font-medium px-4">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA AKHIR - Split Banner */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Banner Kiri - Jamaah */}
              <div className="bg-emerald-900 rounded-[2rem] p-10 relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[300px]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                <CalendarIcon className="h-10 w-10 text-emerald-400 mb-6 relative z-10" />
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 relative z-10">Tetap Terhubung dengan Masjid</h3>
                <p className="text-emerald-100/80 mb-8 font-medium text-sm sm:text-base relative z-10">Jangan lewatkan kajian ilmu dan kegiatan syiar Islami terbaru di Masjid Agung Kubah Timah.</p>
                <Link href="/kalender" className="relative z-10 w-full sm:w-auto">
                  <Button variant="custom" className="w-full bg-white hover:bg-emerald-50 text-emerald-900 rounded-full font-bold px-8 h-12 shadow-xl shadow-white/10 transition-all hover:scale-105">
                    Buka Kalender Penuh
                  </Button>
                </Link>
              </div>

              {/* Banner Kanan - Penyelenggara */}
              <div className="bg-amber-500 rounded-[2rem] p-10 relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[300px]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400 rounded-full blur-2xl pointer-events-none"></div>
                <Sparkles className="h-10 w-10 text-amber-900 mb-6 relative z-10" />
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 relative z-10">Miliki Ide Kegiatan Bermanfaat?</h3>
                <p className="text-amber-900/80 mb-8 font-medium text-sm sm:text-base relative z-10">Jadikan momen kegiatan Anda lebih bermakna dengan dukungan fasilitas eksklusif kami.</p>
                <Link href="/ajukan-peminjaman" className="relative z-10 w-full sm:w-auto">
                  <Button variant="custom" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold px-8 h-12 shadow-xl shadow-slate-900/20 transition-all hover:scale-105">
                    Ajukan Acara Sekarang
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER - Clean & Minimal */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8 text-center sm:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-2 font-black text-slate-900 text-xl mb-4">
                <Building2 className="h-6 w-6 text-emerald-600" /> MAKT Event
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed text-center sm:text-left max-w-xs">
                Platform penyelenggaraan kegiatan dan manajemen fasilitas premium Masjid Agung Kubah Timah.
              </p>
            </div>
            
            <div className="flex flex-col items-center sm:items-start">
              <h4 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">Tautan Cepat</h4>
              <div className="flex flex-col gap-3">
                <Link href="/kalender" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Kalender Event</Link>
                <Link href="/cek-status" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Cek Status Pengajuan</Link>
                <Link href="/ajukan-peminjaman" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Rencanakan Event Anda</Link>
                <Link href="/bantuan" className="text-slate-500 hover:text-emerald-600 font-medium transition-colors text-sm">Pusat Bantuan</Link>
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
