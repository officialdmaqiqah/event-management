import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Calendar, ShieldCheck, CheckCircle2, FileText, Search, UserCircle, CheckSquare, CalendarDays, QrCode, FileArchive } from "lucide-react"

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
              Selamat datang di Sistem Manajemen Event Masjid Agung Kubah Timah (MAKT)! Sistem ini dibangun untuk mempermudah jamaah, takmir, dan pengurus dalam mengelola penjadwalan, peminjaman fasilitas, dan pelaksanaan kegiatan di lingkungan masjid.
            </p>
            <p className="text-slate-600 mb-8">
              Berikut adalah panduan lengkap cara menggunakan berbagai fitur yang ada di dalam sistem ini.
            </p>

            {/* Bagian 1 */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-sm">1</span>
                <h3 className="text-xl font-bold text-slate-900 m-0">Panduan Untuk Jamaah / Pemohon Umum</h3>
              </div>
              <p className="text-slate-600 mb-6 ml-10">Bagian ini ditujukan bagi Anda yang ingin mengetahui jadwal masjid, mendaftarkan acara, atau melihat informasi kegiatan.</p>
              
              <div className="space-y-8 pl-10 border-l-2 border-slate-100 ml-4">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-500" /> 1. Mengecek Jadwal Kegiatan (Kalender)
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Sistem MAKT memiliki kalender terpadu yang menampilkan semua kegiatan publik yang akan dilaksanakan.
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li><strong>Cara Akses:</strong> Kunjungi halaman utama situs (Beranda) dan klik menu "Kalender Event" atau buka halaman <Link href="/kalender"><code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer">/kalender</code></Link>.</li>
                    <li><strong>Fungsi:</strong> Anda bisa melihat acara apa saja yang akan berlangsung dalam format kalender bulanan.</li>
                    <li><strong>Tingkat Privasi Acara:</strong> Anda akan melihat perbedaan status privasi setiap acara:
                      <ul className="list-circle pl-5 mt-1 space-y-1">
                        <li><strong>Publik:</strong> Terbuka untuk umum, detail kegiatan dan deskripsi bisa dilihat bebas.</li>
                        <li><strong>Umum Saja:</strong> Anda tahu ada acara umum, tapi detail spesifik mungkin disederhanakan.</li>
                        <li><strong>Khusus Internal:</strong> Ada ikon gembok "Internal". Ini berarti fasilitas sedang dipakai oleh lembaga/keluarga tertentu secara tertutup (misal: Rapat atau Akad Nikah). Anda tidak bisa melihat deskripsi detailnya, tetapi Anda tahu fasilitas tersebut sedang dipakai.</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-500" /> 2. Mengajukan Peminjaman Fasilitas / Membuat Acara
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Jika Anda/organisasi Anda ingin menggunakan fasilitas MAKT (seperti Ruang Utama, Ruang Lt. 2, atau Pelataran).
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li><strong>Cara Akses:</strong> Dari halaman utama, klik tombol "Ajukan Acara Sekarang" atau akses <Link href="/ajukan-peminjaman"><code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer">/ajukan-peminjaman</code></Link>.</li>
                    <li><strong>Prosedur Pengisian:</strong>
                      <ol className="list-decimal pl-5 mt-1 space-y-1">
                        <li>Isi biodata pemohon dan lembaga/organisasi Anda.</li>
                        <li>Isi detail acara (Nama Acara, Tanggal, Jam Mulai - Selesai).</li>
                        <li>Pilih fasilitas yang ingin digunakan.</li>
                        <li>Tentukan Sifat Privasi Acara. Pilih "Publik" jika ingin dipromosikan ke jamaah lain, atau "Khusus Internal" jika itu acara tertutup.</li>
                      </ol>
                    </li>
                    <li>Sistem akan mengirimkan notifikasi kepada Admin untuk diperiksa (Review).</li>
                    <li><strong>Setelah Submit:</strong> Anda akan mendapatkan <strong>ID Pengajuan/Kode Tiket</strong>. Simpan kode ini!</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Search className="h-4 w-4 text-emerald-500" /> 3. Cek Status Pengajuan
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Anda tidak perlu bertanya-tanya apakah pengajuan Anda sudah disetujui atau belum.
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li><strong>Cara Akses:</strong> Klik menu "Cek Status Pengajuan" atau buka <Link href="/cek-status"><code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer">/cek-status</code></Link>.</li>
                    <li><strong>Fungsi:</strong> Masukkan Kode Tiket / ID Pengajuan yang Anda dapatkan sebelumnya. Sistem akan menampilkan status terkini: <strong>Pending</strong> (Menunggu Konfirmasi), <strong>Approved</strong> (Disetujui), atau <strong>Rejected</strong> (Ditolak).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bagian 2 */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-sm">2</span>
                <h3 className="text-xl font-bold text-slate-900 m-0">Panduan Untuk Admin / Takmir (Pengurus)</h3>
              </div>
              <p className="text-slate-600 mb-6 ml-10">Bagian ini khusus bagi pengelola sistem yang memiliki akses masuk ke dashboard admin.</p>
              
              <div className="space-y-8 pl-10 border-l-2 border-slate-100 ml-4">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-emerald-500" /> 1. Login Admin
                  </h4>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li>Akses URL <Link href="/admin/login"><code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer">/admin/login</code></Link>.</li>
                    <li>Masukkan username dan password Anda.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-emerald-500" /> 2. Manajemen Pengajuan (Penyetujuan Acara)
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Menu ini digunakan untuk menyeleksi pengajuan fasilitas yang masuk dari jamaah.
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li><strong>Cara Akses:</strong> Di sidebar kiri, klik "Pengajuan".</li>
                    <li><strong>Fitur Utama:</strong>
                      <ul className="list-circle pl-5 mt-1 space-y-1">
                        <li><strong>Filter & Pencarian:</strong> Anda bisa memfilter pengajuan berdasarkan Sifat Privasi (Publik/Internal/Umum/Rahasia) atau mengurutkannya berdasarkan tanggal terbaru/terlama.</li>
                        <li><strong>Aksi (Review):</strong> Anda bisa melihat detail formulir yang diisi pemohon.</li>
                        <li><strong>Approval:</strong> Jika tidak ada bentrok jadwal dan acara sesuai syariat, klik setujui (Approve). Jadwal tersebut akan otomatis masuk ke dalam sistem Kalender Publik.</li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-500" /> 3. Manajemen Kalender & Event Admin
                  </h4>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li><strong>Cara Akses:</strong> Menu "Kalender" di dashboard admin.</li>
                    <li><strong>Fungsi:</strong> Melihat keseluruhan jadwal acara (baik yang rahasia maupun publik) dalam view yang komprehensif. Admin bisa mengelola jadwal jika terjadi reschedule mendadak.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-emerald-500" /> 4. Sistem Absensi & Scanner (Manajemen Kepanitiaan)
                  </h4>
                  <p className="text-slate-600 mt-2">
                    Ketika acara besar sedang berlangsung (misal Kajian Akbar), sistem MAKT menyediakan alat operasional untuk panitia.
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li><strong>Scanner:</strong> Ada fitur scanner (pemindai QR Code) untuk melakukan check-in peserta yang sudah mendaftar (misalnya untuk tiket VIP atau acara terbatas).</li>
                    <li><strong>Absen Rapat:</strong> Sistem juga mengakomodir modul Absensi Rapat (<Link href="/absen-rapat"><code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer">/absen-rapat</code></Link>) dengan validasi lokasi (GPS radius) untuk memastikan pengurus/peserta benar-benar hadir di area Masjid Agung Kubah Timah.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileArchive className="h-4 w-4 text-emerald-500" /> 5. Arsip Dokumen & Laporan Rapat
                  </h4>
                  <ul className="list-disc pl-5 text-slate-600 mt-2 space-y-1">
                    <li><strong>Laporan Rapat:</strong> MAKT menyediakan arsip publik dan internal untuk menyimpan notulensi rapat, hasil musyawarah, dan evaluasi kegiatan.</li>
                    <li><strong>Fungsi:</strong> Hal ini menjaga transparansi dan keteraturan tata kelola masjid.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 mt-12">
              <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">💡 Tips Praktis untuk Semua Pengguna</h4>
              <ul className="list-disc pl-5 text-amber-800/80 mt-2 space-y-2 text-sm">
                <li>Selalu periksa menu <strong>Agenda Terdekat</strong> di halaman utama (Beranda) untuk melihat ringkasan acara menarik minggu ini.</li>
                <li>Saat mengajukan event, perhatikan baik-baik pilihan privasi. Jika Anda memilih "Rahasia", acara Anda tidak akan muncul sama sekali di kalender publik.</li>
                <li>Dengan beroperasinya sistem manajemen ini, semoga tata kelola kegiatan di Masjid Agung Kubah Timah semakin tertib, transparan, dan penuh berkah.</li>
              </ul>
            </div>

            {/* Hubungi Admin */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Masih Punya Pertanyaan?</h4>
                <p className="text-slate-600 text-sm mt-1">Jangan ragu untuk menghubungi admin kami via WhatsApp jika Anda butuh bantuan lebih lanjut.</p>
              </div>
              <a 
                href="https://wa.me/6282175426357?text=Assalamualaikum%2C%20Mau%20Tanya%20Tata%20Cara%20Menggunakan%20Fasilitas%20Masjid%20Agung%20Kubah%20Timah" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold px-6 h-12 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  Tanya via WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
