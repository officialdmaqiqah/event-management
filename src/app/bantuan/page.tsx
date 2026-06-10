import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Calendar, ShieldCheck, CheckCircle2, FileText, Search, MessageCircle } from "lucide-react"

export default function BantuanPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200 selection:text-emerald-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg text-slate-900">Pusat Bantuan</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 sm:p-12">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
            <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
              <BookOpen className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Panduan Pengguna</h2>
              <p className="text-slate-500 font-medium mt-1">Sistem Manajemen Event Masjid Agung Kubah Timah</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-emerald-600 hover:prose-a:text-emerald-700">
            <p className="lead text-lg text-slate-600 mb-8">
              Selamat datang di Pusat Bantuan! Sistem ini dibangun untuk mempermudah pengelolaan jadwal dan peminjaman fasilitas di lingkungan Masjid Agung Kubah Timah.
            </p>

            {/* Bagian 1 */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-sm">1</span>
                <h3 className="text-xl font-bold text-slate-900 m-0">Untuk Jamaah / Pemohon Umum</h3>
              </div>
              
              <div className="space-y-6 pl-10 border-l-2 border-slate-100 ml-4">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-500" /> Mengecek Jadwal Kegiatan
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Kunjungi menu <strong>Kalender Event</strong>. Di sini Anda dapat melihat jadwal kegiatan yang akan berlangsung. Perhatikan label privasi acara:
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li><strong>Publik:</strong> Terbuka untuk umum, detail kegiatan bisa dilihat.</li>
                    <li><strong>Umum Saja:</strong> Terbuka untuk umum, namun detail disederhanakan.</li>
                    <li><strong>Khusus Internal:</strong> Ditandai dengan ikon gembok merah muda. Ini berarti fasilitas sedang dipakai oleh lembaga tertentu secara tertutup (misal: Rapat atau Akad Nikah).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-500" /> Mengajukan Peminjaman Fasilitas
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Gunakan menu <strong>Rencanakan Event Anda</strong>. Isi formulir dengan lengkap termasuk biodata, detail acara, pilihan fasilitas, dan sifat privasi. Setelah di-submit, Anda akan mendapatkan <strong>Kode Tiket</strong>.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Search className="h-4 w-4 text-emerald-500" /> Cek Status Pengajuan
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Gunakan menu <strong>Cek Status Pengajuan</strong> dan masukkan Kode Tiket Anda untuk melihat apakah pengajuan disetujui (Approved), ditolak (Rejected), atau masih menunggu (Pending).
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian 2 */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-sm">2</span>
                <h3 className="text-xl font-bold text-slate-900 m-0">Untuk Admin / Pengurus</h3>
              </div>
              
              <div className="space-y-6 pl-10 border-l-2 border-slate-100 ml-4">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Manajemen Pengajuan
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Masuk ke Portal Pengurus, lalu akses menu <strong>Pengajuan</strong>. Anda dapat melihat, memfilter (berdasarkan privasi), mengurutkan, dan mereview formulir pengajuan. Jika disetujui, acara akan otomatis masuk ke kalender publik sesuai pengaturan privasinya.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Fitur Operasional (Scanner & Absensi)
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Tersedia fitur Scanner Check-in untuk peserta acara tertentu, dan modul Absensi Rapat berbasis radius lokasi (GPS) untuk memastikan kehadiran pengurus di area Masjid Agung Kubah Timah.
                  </p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 mt-8">
              <h4 className="font-bold text-amber-900 mb-2">💡 Tips Penting</h4>
              <p className="text-amber-800/80 text-sm m-0">
                Saat mengajukan event, pastikan Anda memilih opsi <strong>Privasi</strong> yang tepat. Jika Anda memilih "Rahasia", acara Anda tidak akan muncul sama sekali di Kalender Publik, demi menjaga kerahasiaan kegiatan.
              </p>
            </div>

            {/* Hubungi Admin */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Masih Punya Pertanyaan?</h4>
                <p className="text-slate-600 text-sm mt-1">Jangan ragu untuk menghubungi admin kami via WhatsApp jika Anda butuh bantuan lebih lanjut.</p>
              </div>
              <a 
                href="https://wa.me/6282175426357" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold px-6 h-12 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  Hubungi Ustadz Roni
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
