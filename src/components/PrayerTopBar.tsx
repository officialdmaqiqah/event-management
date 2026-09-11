"use client"

import { useState, useEffect } from "react"

interface PrayerSchedule {
  subuh: string
  terbit: string
  dhuha: string
  dzuhur: string
  ashar: string
  maghrib: string
  isya: string
}

const DEFAULT_SCHEDULE: PrayerSchedule = {
  subuh: "04:35",
  terbit: "05:47",
  dhuha: "06:14",
  dzuhur: "11:56",
  ashar: "15:06",
  maghrib: "17:58",
  isya: "19:06"
}

const PRAYER_NAMES = [
  { key: "subuh", label: "Subuh" },
  { key: "terbit", label: "Syuruq" },
  { key: "dhuha", label: "Dhuha" },
  { key: "dzuhur", label: "Dzuhur" },
  { key: "ashar", label: "Ashar" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isya", label: "Isya" }
] as const

interface PrayerTopBarProps {
  className?: string
  containerClassName?: string
}

export function PrayerTopBar({ 
  className = "", 
  containerClassName = "max-w-4xl" 
}: PrayerTopBarProps) {
  const [schedule, setSchedule] = useState<PrayerSchedule>(DEFAULT_SCHEDULE)
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const [masehiDate, setMasehiDate] = useState<string>("")
  const [hijriDate, setHijriDate] = useState<string>("")

  // 1. Inisialisasi Tanggal Masehi & Hijriah
  useEffect(() => {
    const now = new Date()
    
    // Format Masehi: Jumat, 11 Sep 2026
    const masehiStr = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(now)
    setMasehiDate(masehiStr)

    // Format Hijriah: 29 Rabiul Awal 1448 H
    try {
      const hijriStr = new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(now)
      setHijriDate(hijriStr)
    } catch {
      setHijriDate("1448 H")
    }

    // 2. Fetch Jadwal Sholat Kemenag Pangkalpinang (ID 0907)
    const fetchPrayer = async () => {
      try {
        const y = now.getFullYear()
        const m = now.getMonth() + 1
        const d = now.getDate()
        const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/0907/${y}/${m}/${d}`)
        const json = await res.json()
        if (json?.status && json?.data?.jadwal) {
          const j = json.data.jadwal
          setSchedule({
            subuh: j.subuh || "04:35",
            terbit: j.terbit || "05:47",
            dhuha: j.dhuha || "06:14",
            dzuhur: j.dzuhur || "11:56",
            ashar: j.ashar || "15:06",
            maghrib: j.maghrib || "17:58",
            isya: j.isya || "19:06"
          })
        }
      } catch (e) {
        console.warn("Using fallback prayer schedule for Pangkalpinang:", e)
      }
    }
    fetchPrayer()
  }, [])

  // 3. Tentukan Jadwal Sholat Terdekat Berikutnya & Pergantian Otomatis
  useEffect(() => {
    const findNextPrayer = () => {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      for (let i = 0; i < PRAYER_NAMES.length; i++) {
        const key = PRAYER_NAMES[i].key
        const timeStr = schedule[key]
        if (timeStr) {
          const [h, m] = timeStr.split(":").map(Number)
          const prayerMinutes = h * 60 + m
          if (prayerMinutes > currentMinutes) {
            return i
          }
        }
      }
      return 0 // Jika sudah lewat Isya, kembali ke Subuh besok
    }

    const nextIndex = findNextPrayer()
    setActiveIdx(nextIndex)

    // 4. Otomatis berganti setiap 4 detik untuk showcase seluruh waktu sholat
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PRAYER_NAMES.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [schedule])

  const currentPrayer = PRAYER_NAMES[activeIdx]
  const currentTime = schedule[currentPrayer.key]

  return (
    <div className={`w-full bg-surface-container-low/90 border-b border-slate-200/60 ${className}`}>
      <div className={`${containerClassName} mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-y-1 gap-x-3 text-on-surface-variant font-display text-[11px]`}>
        {/* Lokasi & Tanggal Masehi + Hijriah */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <div className="flex items-center gap-1 font-bold text-primary">
            <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
            <span>Masjid Agung Kubah Timah</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          {masehiDate && (
            <span className="text-slate-600 font-medium">
              {masehiDate}
            </span>
          )}
          <span className="hidden sm:inline text-slate-300">•</span>
          {hijriDate && (
            <span className="text-secondary font-semibold">
              {hijriDate}
            </span>
          )}
        </div>

        {/* Jadwal Sholat Berganti (Subuh -> Syuruq -> Dhuha -> Dzuhur -> Ashar -> Maghrib -> Isya) */}
        <div className="flex items-center gap-2 font-bold ml-auto sm:ml-0">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest border border-slate-200/70 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-secondary uppercase tracking-wider text-[10px]">
              {currentPrayer.label}
            </span>
            <span className="text-primary font-extrabold text-[11px]">
              {currentTime} WIB
            </span>
          </div>

          {/* Mini indicator dots */}
          <div className="hidden md:flex items-center gap-1">
            {PRAYER_NAMES.map((p, idx) => (
              <button
                key={p.key}
                onClick={() => setActiveIdx(idx)}
                title={`${p.label}: ${schedule[p.key]} WIB`}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIdx 
                    ? "bg-primary w-3" 
                    : "bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
