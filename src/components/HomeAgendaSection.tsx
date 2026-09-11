"use client"

import { useState } from "react"
import Link from "next/link"

interface EventItem {
  id: string | number
  title: string
  category: string
  dateMonth: string
  dateDay: string
  time: string
  room: string
  organizer: string
  badgeText: string
  badgeColorClass: string
  isInternal?: boolean
}

export function HomeAgendaSection({ dbEvents }: { dbEvents: any[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("all")

  // Map database events or fallback to Stitch sample events
  const defaultEvents: EventItem[] = [
    {
      id: "sample-1",
      title: "Klaqulus (Kajian Pemuda & Milenial)",
      category: "komunitas",
      dateMonth: "SEP",
      dateDay: "12",
      time: "16:00 WIB",
      room: "Ruang Utama (Masjid)",
      organizer: "Remaja Masjid MAKT",
      badgeText: "Terkonfirmasi",
      badgeColorClass: "bg-primary-fixed text-on-primary-fixed",
    },
    {
      id: "sample-2",
      title: "Akad Nikah Barakah",
      category: "akad",
      dateMonth: "SEP",
      dateDay: "19",
      time: "07:00 WIB",
      room: "Ruang Utama (Masjid)",
      organizer: "Reservasi Keluarga H. Rahman",
      badgeText: "Sakral",
      badgeColorClass: "bg-secondary-fixed text-on-secondary-fixed",
    },
    {
      id: "sample-3",
      title: "Akad Nikah Khidmat",
      category: "akad",
      dateMonth: "SEP",
      dateDay: "26",
      time: "08:00 WIB",
      room: "Ruang Utama (Masjid)",
      organizer: "Reservasi Keluarga H. Syukri",
      badgeText: "Sakral",
      badgeColorClass: "bg-secondary-fixed text-on-secondary-fixed",
    },
    {
      id: "sample-4",
      title: "Tausiyah Akbar Pangkalpinang",
      category: "komunitas",
      dateMonth: "SEP",
      dateDay: "27",
      time: "13:00 WIB",
      room: "Halaman Pelataran Depan",
      organizer: "DKM MAKT & Majelis Ta'lim",
      badgeText: "Terbuka",
      badgeColorClass: "bg-primary-fixed text-on-primary-fixed",
    }
  ]

  // Combine real database events with default mock if empty
  const events: EventItem[] = dbEvents && dbEvents.length > 0 
    ? dbEvents.map((evt) => {
        const d = new Date(evt.start_datetime || evt.tanggal_mulai)
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"]
        const typeStr = (evt.type || evt.jenis_event || "Kajian").toLowerCase()
        
        let cat = "kajian"
        let badge = "Terbuka"
        let badgeColor = "bg-primary-fixed text-on-primary-fixed"

        if (typeStr.includes("nikah") || typeStr.includes("akad")) {
          cat = "akad"
          badge = "Sakral"
          badgeColor = "bg-secondary-fixed text-on-secondary-fixed"
        } else if (typeStr.includes("komunitas") || typeStr.includes("organisasi")) {
          cat = "komunitas"
          badge = "Terkonfirmasi"
          badgeColor = "bg-primary-fixed text-on-primary-fixed"
        }

        const room = Array.isArray(evt.area_fasilitas) && evt.area_fasilitas.length > 0 
          ? evt.area_fasilitas[0] 
          : "Ruang Utama (Masjid)"

        return {
          id: evt.id,
          title: evt.title || evt.nama_event || "Agenda MAKT",
          category: cat,
          dateMonth: monthNames[d.getMonth()] || "SEP",
          dateDay: String(d.getDate()).padStart(2, "0"),
          time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(/\./g, ":") + " WIB",
          room: room,
          organizer: evt.nama_lembaga || evt.nama_pemohon || "Pengurus DKM MAKT",
          badgeText: badge,
          badgeColorClass: badgeColor,
          isInternal: evt.privacy_event === "publik_terbatas"
        }
      })
    : defaultEvents

  const filteredEvents = activeFilter === "all" 
    ? events 
    : events.filter(e => e.category === activeFilter)

  return (
    <section className="px-4 sm:px-6 lg:px-8 mt-12 flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="font-display text-xs font-bold text-secondary uppercase tracking-widest block mb-1">
            Informasi Jamaah
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-primary">
            Agenda Terdekat
          </h2>
        </div>
        <Link 
          href="/kalender" 
          className="font-display font-semibold text-xs sm:text-sm text-primary hover:text-emerald-800 flex items-center gap-1 shrink-0 pb-1"
        >
          <span>Kalender Penuh</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
        {[
          { key: "all", label: "Semua" },
          { key: "komunitas", label: "Komunitas" },
          { key: "akad", label: "Akad Nikah" },
          { key: "kajian", label: "Kajian Rutin" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-full font-display text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeFilter === tab.key
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredEvents.map((evt) => (
          <article 
            key={evt.id} 
            className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 hover:shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Date Square */}
                <div className="w-13 h-13 rounded-xl bg-surface-container-low text-primary flex flex-col items-center justify-center shrink-0 border border-emerald-900/5">
                  <span className="font-display text-[10px] font-bold tracking-wider leading-none text-slate-500">
                    {evt.dateMonth}
                  </span>
                  <span className="font-display text-xl font-extrabold leading-none pt-1 text-primary">
                    {evt.dateDay}
                  </span>
                </div>
                
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${evt.category === "akad" ? "bg-secondary" : "bg-primary"}`}></span>
                    <span className={`font-display text-[11px] font-bold uppercase tracking-wider ${evt.category === "akad" ? "text-secondary" : "text-primary"}`}>
                      {evt.category === "akad" ? "Akad Nikah" : evt.category === "komunitas" ? "Kegiatan Komunitas" : "Kajian Rutin"}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-on-surface truncate">
                    {evt.title}
                  </h3>
                </div>
              </div>
              
              <span className={`px-2.5 py-0.5 rounded-full font-display text-[10px] sm:text-xs font-bold shrink-0 ${evt.badgeColorClass}`}>
                {evt.badgeText}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-on-surface-variant text-xs font-normal">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                <span>{evt.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-outline">meeting_room</span>
                <span className="truncate">{evt.room}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] sm:text-xs text-outline truncate max-w-[200px] sm:max-w-xs">
                {evt.organizer}
              </span>
              <Link 
                href="/kalender" 
                className="font-display text-xs font-bold text-primary hover:text-emerald-800 flex items-center gap-0.5 shrink-0"
              >
                <span>Detail Acara</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
