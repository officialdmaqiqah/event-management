import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { HomeAgendaSection } from "@/components/HomeAgendaSection"
import { PrayerTopBar } from "@/components/PrayerTopBar"

export default async function Home() {
  const supabase = createClient()
  
  // Ambil data agenda / event dari Supabase
  let upcomingEvents: any[] = []
  try {
    const { data } = await supabase
      .from("pengajuan_peminjaman")
      .select("*")
      .in("status", ["approved"])
      .in("privacy_event", ["detail_publik", "umum_saja", "publik_terbatas"])
      .gte("tanggal_mulai", new Date().toISOString())
      .order("tanggal_mulai", { ascending: true })
      .limit(6)
    if (data) upcomingEvents = data
  } catch (err) {
    console.error("Gagal load upcoming events:", err)
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col relative selection:bg-secondary-fixed selection:text-on-secondary-fixed font-sans">
      
      {/* 1. TOP UTILITY BAR (Live Waktu Sholat Pangkalpinang, Masehi & Hijriah) */}
      <div className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <PrayerTopBar />

        {/* 2. NAVBAR (Logo Only tanpa teks berulang) */}
        <header className="h-16 max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group" title="Beranda MAKT Event">
            <img 
              alt="Logo Masjid Agung Kubah Timah" 
              className="h-10 sm:h-11 w-auto object-contain shrink-0" 
              src="/logo-makt-full.png?v=5"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 leading-none group-hover:text-primary transition-colors">MAKT Event</span>
              <span className="text-[9px] sm:text-[11px] uppercase font-bold tracking-tight sm:tracking-wider text-emerald-800 leading-tight mt-0.5 whitespace-nowrap">Masjid Agung Kubah Timah</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link 
              href="/cek-status" 
              className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-display text-xs font-bold flex items-center gap-1 hover:bg-secondary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">search_check</span>
              <span className="hidden min-[380px]:inline">Cek Status</span>
            </Link>
            <Link 
              href="/admin/login" 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center text-on-primary hover:bg-primary-container transition-colors shadow-sm"
              title="Portal Pengurus / Admin"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </Link>
          </div>
        </header>
      </div>

      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto pt-24">
        
        {/* 3. HERO SECTION (Ikon Kubah Emas Bercahaya & Radiant Aura) */}
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#0B3B2B] via-primary to-[#06241A] px-4 sm:px-8 pt-6 pb-12 rounded-b-3xl sm:rounded-3xl mt-0 sm:mt-2 shadow-xl border border-emerald-700/30">
          {/* Backdrop Image with Ken Burns Zoom & Scrim */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              alt="Masjid Agung Kubah Timah" 
              className="w-full h-full object-cover opacity-25 filter brightness-90 transform-gpu animate-kenburns origin-center" 
              src="/pelataran-depan.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/90 to-primary/50"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/75 to-transparent"></div>
          </div>

          {/* Ambient Lighting & Glow */}
          <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full bg-amber-400/15 blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

          {/* Grid Layout: Left Content, Right Glowing Dome */}
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 py-2 sm:py-4">
            
            {/* Kolom Kiri: Teks & Informasi */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <h1 className="font-display text-2xl sm:text-4xl font-bold text-on-primary tracking-tight leading-snug">
                  Pusat Layanan Kegiatan <br />
                  <span className="bg-gradient-to-r from-secondary-fixed via-[#FFF6D4] to-secondary-fixed bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent inline-block font-extrabold drop-shadow-xs">
                    Masjid Agung Kubah Timah
                  </span>
                </h1>
                <p className="font-body text-xs sm:text-sm text-tertiary-fixed font-normal leading-relaxed max-w-lg">
                  Jelajahi jadwal kajian terkini, ikuti agenda syiar Islam, atau rencanakan penyelenggaraan acara spesial Anda dengan fasilitas premium MAKT.
                </p>
              </div>

              {/* Verified Footer dengan Indikator Radar Live */}
              <div className="flex items-center gap-2 text-tertiary-fixed/90 text-xs font-medium pt-1">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-fixed"></span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-secondary-fixed">verified</span>
                <span>Resmi DKM Masjid Agung Kubah Timah Pangkalpinang</span>
              </div>
            </div>

            {/* Kolom Kanan: Glowing Kubah Timah Silhouette & Aura Animation (Desktop & Tablet) */}
            <div className="hidden sm:flex shrink-0 w-48 h-48 md:w-56 md:h-56 relative items-center justify-center animate-float-slow pointer-events-none select-none">
              <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_25px_rgba(254,214,91,0.35)]">
                <defs>
                  {/* Radiant Glow Gradient */}
                  <radialGradient id="kubahAuraGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FED65B" stopOpacity="0.45" />
                    <stop offset="45%" stopColor="#D4AF37" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0D4734" stopOpacity="0" />
                  </radialGradient>
                  
                  {/* Dome Body Gold Gradient */}
                  <linearGradient id="kubahGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF4D0" />
                    <stop offset="35%" stopColor="#FED65B" />
                    <stop offset="75%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#8C6E0A" />
                  </linearGradient>

                  <linearGradient id="kubahDarkShade" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FED65B" stopOpacity="0.3" />
                    <stop offset="60%" stopColor="#0A3828" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#041B13" stopOpacity="0.95" />
                  </linearGradient>
                </defs>

                {/* Aura Glow Pulses */}
                <circle cx="120" cy="120" r="100" fill="url(#kubahAuraGlow)" className="animate-pulse" />
                <circle cx="120" cy="120" r="88" stroke="#FED65B" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" className="animate-[spin_60s_linear_infinite] origin-center" />
                <circle cx="120" cy="120" r="110" stroke="#FFE088" strokeWidth="1" opacity="0.2" className="animate-ping origin-center" />

                {/* Dome Base Foundation */}
                <path d="M44 195 H196 V205 C196 208 192 210 186 210 H54 C48 210 44 208 44 205 Z" fill="url(#kubahGoldGrad)" opacity="0.9" />
                <rect x="54" y="186" width="132" height="9" rx="2" fill="url(#kubahGoldGrad)" opacity="0.8" />

                {/* Main Dome Body Silhouette (Pointed Kubah Timah) */}
                <path d="M58 186 C58 122 86 72 120 54 C154 72 182 122 182 186 Z" fill="url(#kubahDarkShade)" stroke="url(#kubahGoldGrad)" strokeWidth="2.5" />

                {/* Iconic Diamond Facets on the Dome (Belah Ketupat Kubah Timah) */}
                <path d="M120 56 L120 186" stroke="url(#kubahGoldGrad)" strokeWidth="1.2" opacity="0.5" />
                <path d="M85 88 L120 116 L155 88" stroke="url(#kubahGoldGrad)" strokeWidth="1.2" opacity="0.65" />
                <path d="M68 122 L120 154 L172 122" stroke="url(#kubahGoldGrad)" strokeWidth="1.2" opacity="0.65" />
                <path d="M60 156 L120 186 L180 156" stroke="url(#kubahGoldGrad)" strokeWidth="1.2" opacity="0.65" />

                {/* Shimmering Center Diamonds */}
                <path d="M120 84 L96 112 L120 136 L144 112 Z" fill="url(#kubahGoldGrad)" fillOpacity="0.2" stroke="url(#kubahGoldGrad)" strokeWidth="1.2" />
                <path d="M120 126 L92 154 L120 178 L148 154 Z" fill="url(#kubahGoldGrad)" fillOpacity="0.22" stroke="url(#kubahGoldGrad)" strokeWidth="1.2" />

                {/* Pinnacle Finial & Crescent (Bulan Sabit Emas) */}
                <line x1="120" y1="54" x2="120" y2="28" stroke="url(#kubahGoldGrad)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="120" cy="38" r="3" fill="#FFF4D0" />
                
                {/* Crescent Moon */}
                <path d="M120 14 C112 14 107 20 107 26 C107 33 113 38 121 38 C116 36 113 31 113 26 C113 20 117 16 120 14 Z" fill="url(#kubahGoldGrad)" />
                
                {/* Glimmer Sparkles at Pinnacle */}
                <circle cx="120" cy="14" r="2.5" fill="#FFFFFF" className="animate-ping" />
                <path d="M132 18 L134 12 L140 10 L134 8 L132 2 L130 8 L124 10 L130 12 Z" fill="#FFF" opacity="0.85" className="animate-pulse" />
              </svg>
            </div>

            {/* Versi Mobile Watermark: Kubah bersinar anggun di latar belakang kanan atas */}
            <div className="sm:hidden absolute -top-2 -right-4 w-32 h-32 opacity-25 pointer-events-none select-none animate-float-slow">
              <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="120" cy="120" r="95" fill="url(#kubahAuraGlow)" />
                <path d="M58 186 C58 122 86 72 120 54 C154 72 182 122 182 186 Z" fill="url(#kubahDarkShade)" stroke="url(#kubahGoldGrad)" strokeWidth="2" />
                <line x1="120" y1="54" x2="120" y2="28" stroke="url(#kubahGoldGrad)" strokeWidth="2" strokeLinecap="round" />
                <path d="M120 14 C112 14 107 20 107 26 C107 33 113 38 121 38 C116 36 113 31 113 26 C113 20 117 16 120 14 Z" fill="url(#kubahGoldGrad)" />
              </svg>
            </div>

          </div>
        </section>

        {/* 4. QUICK FLOATING ACTION STRIP (Persis Stitch) */}
        <section className="px-4 sm:px-6 -mt-6 relative z-20">
          <div className="grid grid-cols-3 gap-2 p-2 bg-surface-container-lowest rounded-2xl shadow-md border border-slate-100">
            <Link 
              href="/kalender" 
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-low text-center gap-1 hover:bg-surface-container active:bg-surface-container-high transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">event_available</span>
              </div>
              <span className="font-display text-xs font-bold text-on-surface">Jadwal Kajian</span>
              <span className="text-[10px] text-outline truncate w-full hidden sm:block">Kalender Terbuka</span>
            </Link>

            <Link 
              href="/ajukan-peminjaman" 
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-secondary-fixed/20 text-center gap-1 hover:bg-secondary-fixed/30 active:bg-secondary-fixed/40 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">domain_add</span>
              </div>
              <span className="font-display text-xs font-bold text-on-surface">Pinjam Fasilitas</span>
              <span className="text-[10px] text-outline truncate w-full hidden sm:block">Booking Ruang</span>
            </Link>

            <Link 
              href="/cek-status" 
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-low text-center gap-1 hover:bg-surface-container active:bg-surface-container-high transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">search_check</span>
              </div>
              <span className="font-display text-xs font-bold text-on-surface">Cek Status</span>
              <span className="text-[10px] text-outline truncate w-full hidden sm:block">Lacak Izin Online</span>
            </Link>
          </div>
        </section>

        {/* 5. AGENDA TERDEKAT (Persis Stitch - Interaktif Client Filter) */}
        <HomeAgendaSection dbEvents={upcomingEvents} />

        {/* 6. VENUE & AREA FASILITAS IKONIK SHOWCASE (Persis Stitch) */}
        <section className="px-4 sm:px-6 mt-12 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-xs font-bold text-secondary uppercase tracking-widest">
              Venue & Area
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
              Fasilitas Masjid Ikonik
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Fasilitas ikonik yang nyaman, disiapkan untuk menyambut langkah Anda dalam menuntut ilmu dan merangkai momen penuh berkah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Venue 1: Ruang Utama */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
              <div 
                className="relative w-full h-48 bg-cover bg-center" 
                style={{ backgroundImage: "url('/ruang-utama.jpg')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary text-on-primary font-display text-[11px] font-bold shadow-md">
                  Kapasitas 2.000+ Jamaah
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <span className="font-display text-[10px] font-bold text-secondary-fixed uppercase block">Ikonik Utama</span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white leading-tight">Ruang Utama (Masjid)</h3>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Kapasitas besar, pendingin udara terpusat, dan akustik ruang premium. Sangat cocok untuk kajian akbar tingkat kota maupun nasional serta ideal untuk akad nikah yang sakral.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">AC Terpusat</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Sound Akustik</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Area Barakah</span>
                </div>
              </div>
            </div>

            {/* Venue 2: Ruang Pertemuan Lt. 2 */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
              <div 
                className="relative w-full h-48 bg-cover bg-center" 
                style={{ backgroundImage: "url('/ruang-lt2.jpg')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest text-primary font-display text-[11px] font-bold shadow-md">
                  80 - 120 Orang
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <span className="font-display text-[10px] font-bold text-secondary-fixed uppercase block">Ruang Rapat & Diklat</span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white leading-tight">Ruang Pertemuan Lt. 2</h3>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Ruangan privat yang nyaman. Ideal untuk musyawarah, rapat pimpinan, diskusi kelompok terbatas, kelas training, atau pelatihan ormas Islam.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Proyektor HD</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Full AC</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Whiteboard & Mic</span>
                </div>
              </div>
            </div>

            {/* Venue 3: Halaman Pelataran Depan */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
              <div 
                className="relative w-full h-48 bg-cover bg-center" 
                style={{ backgroundImage: "url('/pelataran-depan.jpg')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest text-secondary font-display text-[11px] font-bold shadow-md">
                  Area Luas Terbuka
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <span className="font-display text-[10px] font-bold text-secondary-fixed uppercase block">Outdoor Plaza</span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white leading-tight">Halaman Pelataran Depan</h3>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Area terbuka yang luas dengan pemandangan langsung kubah timah nan ikonik. Sering digunakan untuk festival Islami akbar, panggung seni, dan resepsi.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">View Kubah Timah</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Kapasitas 1.500+</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Pencahayaan Malam</span>
                </div>
              </div>
            </div>

            {/* Venue 4: Halaman Pelataran Samping */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
              <div 
                className="relative w-full h-48 bg-cover bg-center" 
                style={{ backgroundImage: "url('/pelataran-samping.jpg')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest text-secondary font-display text-[11px] font-bold shadow-md">
                  Stan UMKM & Komunitas
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <span className="font-display text-[10px] font-bold text-secondary-fixed uppercase block">Semi-Outdoor</span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white leading-tight">Halaman Pelataran Samping</h3>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Lahan paving semi-outdoor yang fleksibel. Sangat ideal dimanfaatkan untuk bazar kuliner UMKM Bangka Belitung, pameran buku, hingga temu komunitas.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Paving Teratur</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Akses Logistik</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Area Bazar</span>
                </div>
              </div>
            </div>

            {/* Venue 5: Halaman Belakang (Area Pasir) */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
              <div 
                className="relative w-full h-48 bg-cover bg-center" 
                style={{ backgroundImage: "url('/halaman-belakang.jpg')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest text-primary font-display text-[11px] font-bold shadow-md">
                  Area Ramah Anak
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <span className="font-display text-[10px] font-bold text-secondary-fixed uppercase block">Outdoor Alami</span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white leading-tight">Halaman Belakang (Area Pasir)</h3>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Area santai berbasis alam yang asri. Tempat sempurna untuk kegiatan edukasi anak santri TPA/TPQ, senam keluarga, maupun outbound mini islami.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Nuansa Alam</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Kids Friendly</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Outbound Mini</span>
                </div>
              </div>
            </div>

            {/* Venue 6: Lapangan Parkir Luas */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
              <div 
                className="relative w-full h-48 bg-cover bg-center" 
                style={{ backgroundImage: "url('/lapangan-parkir.jpg')" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-surface-container-lowest text-primary font-display text-[11px] font-bold shadow-md">
                  Ratusan Kendaraan
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <span className="font-display text-[10px] font-bold text-secondary-fixed uppercase block">Area Parkir Terpadu</span>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white leading-tight">Lapangan Parkir Luas</h3>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Lahan parkir lapang yang mampu menampung ratusan kendaraan roda dua dan empat dengan sistem sirkulasi teratur dan pemantauan keamanan.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Kapasitas Besar</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Security & CCTV</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-display text-[10px] font-semibold text-on-surface">Akses Jalan Utama</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. ALUR PERENCANAAN EVENT - 4 LANGKAH (Persis Stitch) */}
        <section className="px-4 sm:px-6 mt-12 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-xs font-bold text-secondary uppercase tracking-widest">
              Tutorial Pembuat Acara
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
              Alur Perencanaan Event
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Hanya butuh 4 langkah mudah dan transparan untuk mewujudkan kegiatan bermakna Anda di Masjid Agung Kubah Timah.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-slate-100 flex flex-col gap-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary font-display text-xs font-bold flex items-center justify-center">1</span>
                <span className="material-symbols-outlined text-[20px] text-primary">edit_calendar</span>
              </div>
              <h4 className="font-display text-sm sm:text-base font-bold text-on-surface">Rencanakan</h4>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                Pilih tanggal, fasilitas, dan isi detail konsep rencana kegiatan online.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-slate-100 flex flex-col gap-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed font-display text-xs font-bold flex items-center justify-center">2</span>
                <span className="material-symbols-outlined text-[20px] text-secondary">fact_check</span>
              </div>
              <h4 className="font-display text-sm sm:text-base font-bold text-on-surface">Review</h4>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                Tim DKM meninjau kesesuaian syar'i serta keamanan jadwal acara.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-slate-100 flex flex-col gap-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-display text-xs font-bold flex items-center justify-center">3</span>
                <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
              </div>
              <h4 className="font-display text-sm sm:text-base font-bold text-on-surface">Disetujui</h4>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                Surat izin resmi terbit otomatis di sistem dan dikonfirmasikan via WA.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-slate-100 flex flex-col gap-2 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-primary text-on-primary font-display text-xs font-bold flex items-center justify-center">4</span>
                <span className="material-symbols-outlined text-[20px] text-secondary">campaign</span>
              </div>
              <h4 className="font-display text-sm sm:text-base font-bold text-on-surface">Go Public</h4>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                Agenda langsung terbit di Kalender MAKT dan siap dihadiri jamaah!
              </p>
            </div>
          </div>
        </section>

        {/* 8. SOLUSI DIGITAL MAKT EVENT - DARK EMERALD BOX (Persis Stitch) */}
        <section className="px-4 sm:px-6 mt-12 flex flex-col">
          <div className="bg-primary text-on-primary p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col gap-5">
            <div>
              <span className="font-display text-xs font-bold text-secondary-fixed uppercase tracking-wider block mb-1">
                Transformasi Pelayanan
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-on-primary">
                Solusi Digital MAKT Event
              </h3>
              <p className="text-xs sm:text-sm text-tertiary-fixed mt-1 leading-relaxed">
                Tinggalkan kerepotan birokrasi manual dengan sistem manajemen cerdas masjid terintegrasi.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3.5 bg-surface-container-lowest/10 rounded-2xl flex items-start gap-3 border border-white/10">
                <span className="material-symbols-outlined text-secondary-fixed text-[22px] shrink-0 mt-0.5">check_circle</span>
                <div className="flex flex-col">
                  <span className="font-display text-xs sm:text-sm font-bold text-on-primary">Birokrasi Bebas Kertas (Paperless)</span>
                  <span className="text-[11px] sm:text-xs text-tertiary-fixed mt-0.5">Pengajuan izin online dari ponsel tanpa bolak-balik bawa proposal fisik.</span>
                </div>
              </div>

              <div className="p-3.5 bg-surface-container-lowest/10 rounded-2xl flex items-start gap-3 border border-white/10">
                <span className="material-symbols-outlined text-secondary-fixed text-[22px] shrink-0 mt-0.5">check_circle</span>
                <div className="flex flex-col">
                  <span className="font-display text-xs sm:text-sm font-bold text-on-primary">Transparansi Jadwal Real-Time</span>
                  <span className="text-[11px] sm:text-xs text-tertiary-fixed mt-0.5">Ketahui ketersediaan ruang secara presisi guna mencegah bentrok agenda.</span>
                </div>
              </div>

              <div className="p-3.5 bg-surface-container-lowest/10 rounded-2xl flex items-start gap-3 border border-white/10">
                <span className="material-symbols-outlined text-secondary-fixed text-[22px] shrink-0 mt-0.5">check_circle</span>
                <div className="flex flex-col">
                  <span className="font-display text-xs sm:text-sm font-bold text-on-primary">Notifikasi Status Otomatis</span>
                  <span className="text-[11px] sm:text-xs text-tertiary-fixed mt-0.5">Setiap perubahan status langsung diberitahukan ke pemohon secara transparan.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. LOKASI IKONIK - PREVIEW PETA (Persis Stitch) */}
        <section className="px-4 sm:px-6 mt-12 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-display text-xs font-bold text-secondary uppercase">Lokasi Ikonik</span>
              <h3 className="font-display text-base sm:text-lg font-bold text-primary">Titik Pusat Kota Pangkalpinang</h3>
            </div>
            <a 
              className="font-display text-xs font-bold text-primary hover:text-emerald-800 flex items-center gap-1" 
              href="https://maps.google.com/?q=Masjid+Agung+Kubah+Timah+Pangkalpinang" 
              target="_blank"
              rel="noreferrer"
            >
              <span>Buka Maps</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>

          <div 
            className="w-full h-48 rounded-2xl shadow-sm bg-cover bg-center overflow-hidden relative border border-slate-200" 
            style={{ backgroundImage: "url('/pelataran-depan.jpg')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-secondary-fixed shadow-md">
                  <span className="material-symbols-outlined text-[20px]">place</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-xs sm:text-sm font-bold leading-tight">Masjid Agung Kubah Timah</span>
                  <span className="text-[11px] text-surface-container-high leading-tight">Jl. Jenderal Sudirman No. 1, Pangkalpinang</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-display text-[10px] font-bold shadow-sm">
                Titik Nol KM
              </span>
            </div>
          </div>
        </section>

      </main>
 
      {/* 10 & 11. UNIFIED CTA & FOOTER - SATU KESATUAN UTUH (TIDAK TERPISAH BLOK) */}
      <footer className="w-full mt-16 bg-surface-container-low/80 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-10 flex flex-col gap-10">
          
          {/* Bagian Atas: Ajakan Kegiatan (CTA) - Alami, Terbuka, Tanpa Kotak Terpisah */}
          <div className="text-center flex flex-col items-center gap-4 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-primary text-xs font-bold border border-emerald-200/80 shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-emerald-700">workspace_premium</span>
              <span>Layanan Fasilitas & Syiar MAKT</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Miliki Ide Kegiatan Bermanfaat?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Jadikan momen kegiatan Anda lebih bermakna dengan dukungan fasilitas eksklusif dan berkah di Masjid Agung Kubah Timah.
              </p>
            </div>

            {/* Micro Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 text-[11px] font-medium border border-slate-200 shadow-2xs">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">ac_unit</span>
                Ruang Nyaman & Ber-AC
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 text-[11px] font-medium border border-slate-200 shadow-2xs">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                Izin Resmi & Transparan
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 text-[11px] font-medium border border-slate-200 shadow-2xs">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">pin_drop</span>
                Titik Nol KM Kota
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row w-full max-w-md gap-3 pt-2">
              <Link 
                href="/ajukan-peminjaman" 
                className="w-full min-h-[46px] px-6 rounded-xl bg-primary hover:bg-primary-container text-white font-display text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
              >
                <span className="material-symbols-outlined text-[19px]">add_task</span>
                <span>Ajukan Izin Acara</span>
              </Link>
              <a 
                href="https://wa.me/6282175426357?text=Assalamualaikum%2C%20Mau%20Tanya%20Tata%20Cara%20Menggunakan%20Fasilitas%20Masjid%20Agung%20Kubah%20Timah" 
                target="_blank"
                rel="noreferrer" 
                className="w-full min-h-[46px] px-5 rounded-xl bg-white hover:bg-emerald-50/70 text-primary font-display text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-emerald-200/90 shadow-2xs transition-all active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-600">chat</span>
                <span>Hubungi DKM</span>
              </a>
            </div>
          </div>

          {/* Garis Pemisah Halus */}
          <div className="h-px w-full bg-slate-200/90" />

          {/* Bagian Bawah: Navigasi & Info Kontak Footer */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Kolom Brand (6 cols) */}
            <div className="md:col-span-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo-makt-full.png?v=5" 
                  alt="Logo Masjid Agung Kubah Timah" 
                  className="h-11 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <span className="font-display font-extrabold text-base text-slate-900 leading-tight">
                    Masjid Agung Kubah Timah
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-emerald-800">
                    Kota Pangkalpinang • Bangka Belitung
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mt-1">
                Pusat dakwah, syiar, dan kegiatan keumatan di Kota Beribu Senyuman Pangkalpinang. Menghadirkan pelayanan fasilitas masjid yang tertib, modern, dan transparan.
              </p>
            </div>

            {/* Kolom Layanan (3 cols) */}
            <div className="md:col-span-3 flex flex-col gap-3">
              <span className="font-display text-xs font-bold text-slate-900 uppercase tracking-wider">
                Layanan Jamaah
              </span>
              <ul className="flex flex-col gap-2 text-xs text-slate-600">
                <li>
                  <Link href="/ajukan-peminjaman" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">arrow_forward</span>
                    Ajukan Izin Acara
                  </Link>
                </li>
                <li>
                  <Link href="/cek-status" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">arrow_forward</span>
                    Cek Status Pengajuan
                  </Link>
                </li>
                <li>
                  <Link href="/kalender" className="hover:text-primary transition-colors flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">arrow_forward</span>
                    Jadwal Acara & Kajian
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom Sekretariat (3 cols) */}
            <div className="md:col-span-3 flex flex-col gap-3">
              <span className="font-display text-xs font-bold text-slate-900 uppercase tracking-wider">
                Sekretariat DKM
              </span>
              <div className="flex flex-col gap-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700 shrink-0 mt-0.5">location_on</span>
                  <span className="leading-snug">Jl. Jenderal Sudirman No. 1, Pangkalpinang</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700 shrink-0">chat</span>
                  <a href="https://wa.me/6282175426357" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                    +62 821-7542-6357 (DKM)
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Bawah Hak Cipta */}
          <div className="pt-6 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
            <span>© {new Date().getFullYear()} DKM Masjid Agung Kubah Timah. Seluruh hak cipta dilindungi.</span>
            <Link 
              href="/admin/login" 
              className="hover:text-primary text-slate-600 transition-colors flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Portal Pengurus & Admin
            </Link>
          </div>

        </div>
      </footer>
    </div>
  )
}
