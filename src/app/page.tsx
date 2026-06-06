import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MapPin, QrCode, CheckCircle2, Heart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
      <header className="px-6 lg:px-14 h-16 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex gap-2 items-center font-bold text-xl tracking-tight text-indigo-600">
          <Calendar className="h-6 w-6" />
          <span>Kubah Timah Events</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-indigo-600 transition-colors flex items-center" href="#features">
            Fitur
          </Link>
          <div className="flex items-center gap-2 ml-4">
            <Link href="/admin/login">
              <Button variant="outline" size="sm">Masuk</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Daftar Gratis</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-48 bg-gradient-to-b from-indigo-50 to-white relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          
          <div className="container px-4 md:px-6 relative z-10 text-center max-w-4xl mx-auto">
            <div className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800 mb-6">
              Sistem Manajemen Acara Terpadu
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Pusat Informasi & Registrasi <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Kubah Timah</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-2xl/relaxed mb-10">
              Platform resmi untuk mengelola dan mendaftar acara di Masjid Agung Kubah Timah. Tersedia untuk pihak internal maupun eksternal: Kajian rutin, Rapat Internal, Musyawarah, hingga Seminar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all rounded-full">
                  Mulai Bikin Event Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="w-full py-20 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Kenapa Menggunakan Layanan Ini?</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">Solusi digital untuk memudahkan setiap kegiatan di lingkungan Masjid Agung Kubah Timah.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: QrCode, title: "E-Ticket & QR Scanner", desc: "Cocok untuk kajian besar atau seminar. Peserta mendapatkan E-Ticket otomatis untuk check-in cepat di lokasi." },
                { icon: MapPin, title: "Absensi Rapat & Musyawarah", desc: "Fitur check-in pintar berbasis GPS memastikan peserta rapat / musyawarah benar-benar hadir di area Masjid Kubah Timah." },
                { icon: Users, title: "Terbuka untuk Umum", desc: "Dapat dimanfaatkan oleh internal pengurus masjid maupun komunitas eksternal yang ingin menyelenggarakan acara." },
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                    <f.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between px-6 lg:px-14">
        <p className="text-sm text-gray-500">© 2026 Masjid Agung Kubah Timah. All rights reserved.</p>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <Link className="text-sm text-gray-500 hover:text-gray-900" href="#">Syarat & Ketentuan</Link>
          <Link className="text-sm text-gray-500 hover:text-gray-900" href="#">Privasi</Link>
        </div>
      </footer>
    </div>
  )
}
