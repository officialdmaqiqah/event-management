"use client"

import { useState, useEffect } from "react"

interface ActivityItem {
  text: string
  icon: string
  badge: string
}

const activities: ActivityItem[] = [
  { text: "Kajian Rutin & Tabligh Akbar", icon: "menu_book", badge: "Kajian Ilmu" },
  { text: "Peminjaman Ruang & Fasilitas", icon: "domain_add", badge: "Fasilitas" },
  { text: "Akad Nikah & Walimah Berkah", icon: "favorite", badge: "Ibadah" },
  { text: "Rapat & Syiar Komunitas Umat", icon: "groups", badge: "Organisasi" },
  { text: "Peringatan Hari Besar Islam", icon: "celebration", badge: "Syiar Islam" },
]

export function HeroRotatingHeadline() {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % activities.length)
        setFade(true)
      }, 300)
    }, 3200)

    return () => clearInterval(timer)
  }, [])

  const current = activities[index]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl sm:text-4xl font-bold text-on-primary tracking-tight leading-snug">
          Pusat Layanan Kegiatan <br />
          <span className="bg-gradient-to-r from-secondary-fixed via-[#FFF6D4] to-secondary-fixed bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent inline-block font-extrabold drop-shadow-xs">
            Masjid Agung Kubah Timah
          </span>
        </h1>
      </div>

      {/* Dynamic Animated Activity Pill (Pilihan 1: Teks Berganti Otomatis) */}
      <div className="flex items-center flex-wrap gap-2.5 pt-0.5">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold shadow-xs">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-fixed opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-fixed"></span>
          </span>
          <span className="text-emerald-100/90 font-medium text-[11px] sm:text-xs shrink-0">
            Memfasilitasi:
          </span>
          <div className="overflow-hidden h-5 sm:h-6 flex items-center min-w-[200px] sm:min-w-[250px]">
            <span
              className={`font-display font-bold text-secondary-fixed inline-flex items-center gap-1.5 transition-all duration-300 transform whitespace-nowrap ${
                fade ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2.5"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] text-amber-300 shrink-0">
                {current.icon}
              </span>
              <span>{current.text}</span>
            </span>
          </div>
        </div>

        {/* Mini Indicator Dots */}
        <div className="hidden min-[480px]:flex items-center gap-1.5 pl-1">
          {activities.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setFade(false)
                setTimeout(() => {
                  setIndex(i)
                  setFade(true)
                }, 200)
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === index ? "w-4 bg-secondary-fixed shadow-[0_0_8px_rgba(254,214,91,0.6)]" : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
              title={activities[i].text}
              aria-label={activities[i].text}
            />
          ))}
        </div>
      </div>

      <p className="font-body text-xs sm:text-sm text-tertiary-fixed font-normal leading-relaxed max-w-xl">
        Jelajahi jadwal kajian terkini, ikuti agenda syiar Islam, atau rencanakan penyelenggaraan acara spesial Anda dengan fasilitas premium MAKT.
      </p>

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
  )
}
