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

function getIndonesianHijriDate(date: Date = new Date()): string {
  const monthMap: Record<string, string> = {
    'muharram': 'Muharram',
    'safar': 'Safar',
    'rabiulawal': 'Rabiul Awal',
    'rabiul awal': 'Rabiul Awal',
    'rabi\'ul awal': 'Rabiul Awal',
    'rabiulakhir': 'Rabiul Akhir',
    'rabiul akhir': 'Rabiul Akhir',
    'rabi\'ul akhir': 'Rabiul Akhir',
    'rabiul tsani': 'Rabiul Akhir',
    'jumadilawal': 'Jumadil Awal',
    'jumadil awal': 'Jumadil Awal',
    'jumadilakhir': 'Jumadil Akhir',
    'jumadil akhir': 'Jumadil Akhir',
    'jumadil tsani': 'Jumadil Akhir',
    'rajab': 'Rajab',
    'syaban': 'Sya\'ban',
    'sya\'ban': 'Sya\'ban',
    'ramadhan': 'Ramadhan',
    'ramadan': 'Ramadhan',
    'syawal': 'Syawal',
    'dzulqadah': 'Dzulqa\'dah',
    'dzulqa\'dah': 'Dzulqa\'dah',
    'zulkaidah': 'Dzulqa\'dah',
    'dzulhijjah': 'Dzulhijjah',
    'dzulhijah': 'Dzulhijjah',
    'zulhijah': 'Dzulhijjah'
  }

  const calendars = ['islamic-umalqura', 'islamic', 'islamic-civil']

  for (const cal of calendars) {
    try {
      const formatter = new Intl.DateTimeFormat(`id-ID-u-ca-${cal}`, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      const parts = formatter.formatToParts(date)
      const day = parts.find(p => p.type === 'day')?.value || ''
      const rawMonth = parts.find(p => p.type === 'month')?.value || ''
      const rawYear = parts.find(p => p.type === 'year')?.value || ''

      const cleanMonthKey = rawMonth.toLowerCase().replace(/[^a-z']/g, '')
      const monthName = monthMap[cleanMonthKey] || rawMonth
      const cleanYear = rawYear.replace(/\D/g, '')

      if (day && monthName && cleanYear) {
        return `${day} ${monthName} ${cleanYear} H`
      }
    } catch (e) {
      continue
    }
  }

  return ''
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
    
    // Format Masehi: Jum, 11 Sep 2026
    const masehiStr = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(now)
    setMasehiDate(masehiStr)

    // Format Hijriah menggunakan kalkulasi akurat (menghindari bug Android ICU 'SM')
    setHijriDate(getIndonesianHijriDate(now))

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

    // 4. Otomatis berganti setiap 4.5 detik untuk showcase seluruh waktu sholat
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PRAYER_NAMES.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [schedule])

  const currentPrayer = PRAYER_NAMES[activeIdx]
  const currentTime = schedule[currentPrayer.key]

  return (
    <div className={`w-full bg-surface-container-low/90 border-b border-slate-200/60 ${className}`}>
      <div className={`${containerClassName} mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2 text-on-surface-variant font-display text-[11px]`}>
        {/* Lokasi & Tanggal Masehi + Hijriah (Single-Line Rapi di Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
          <div className="flex items-center gap-1 font-bold text-primary shrink-0">
            <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
            <span className="hidden sm:inline">Masjid Agung Kubah Timah</span>
            <span className="inline sm:hidden">Kubah Timah</span>
          </div>
          <span className="text-slate-300">•</span>
          {masehiDate && (
            <span className="text-slate-600 font-medium whitespace-nowrap truncate">
              {masehiDate}
            </span>
          )}
          {hijriDate && (
            <>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:inline text-secondary font-semibold whitespace-nowrap">
                {hijriDate}
              </span>
            </>
          )}
        </div>

        {/* Jadwal Sholat Berganti (Subuh -> Syuruq -> Dhuha -> Dzuhur -> Ashar -> Maghrib -> Isya) */}
        <div className="flex items-center gap-2 font-bold shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest border border-slate-200/70 shadow-xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-secondary uppercase tracking-wider text-[10px]">
              {currentPrayer.label}
            </span>
            <span className="text-primary font-extrabold text-[11px]">
              {currentTime} WIB
            </span>
          </div>

          {/* Mini indicator dots (Desktop only) */}
          <div className="hidden lg:flex items-center gap-1">
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
