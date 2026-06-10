"use client"

import { MessageCircle } from "lucide-react"
import { usePathname } from "next/navigation"

export default function FloatingWhatsApp() {
  const pathname = usePathname()

  // Sembunyikan tombol WA di halaman admin agar tidak mengganggu dashboard
  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <a
      href="https://wa.me/6282175426357"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-500 text-white rounded-full shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:bg-emerald-600 hover:scale-110 hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] transition-all duration-300 group"
      aria-label="Hubungi Ustadz Roni via WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
      {/* Tooltip */}
      <span className="absolute right-16 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
        Hubungi Ustadz Roni
      </span>
    </a>
  )
}
