"use client"

import { useState, useEffect } from "react"
import { Image as ImageIcon, X } from "lucide-react"

interface Fasilitas {
  id: string
  nama: string
  deskripsi: string
  image?: string
}

interface FasilitasGridProps {
  fasilitasMakt: Fasilitas[]
}

export function FasilitasGrid({ fasilitasMakt }: FasilitasGridProps) {
  const [activeImage, setActiveImage] = useState<{ src: string; title: string } | null>(null)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImage(null)
      }
    }
    if (activeImage) {
      window.addEventListener("keydown", handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [activeImage])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {fasilitasMakt.map((fasilitas, i) => (
          <div
            key={i}
            className="group rounded-3xl overflow-hidden bg-slate-50 shadow-sm border border-slate-200 hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
          >
            {/* Image Section */}
            <div
              className={`relative h-64 bg-slate-100 flex items-center justify-center overflow-hidden select-none ${
                fasilitas.image ? "cursor-zoom-in" : ""
              }`}
              onClick={() => {
                if (fasilitas.image) {
                  setActiveImage({ src: fasilitas.image, title: fasilitas.nama })
                }
              }}
            >
              {fasilitas.image ? (
                <>
                  <img
                    src={fasilitas.image}
                    alt={fasilitas.nama}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  {/* Subtle hover overlay badge */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <ImageIcon className="h-3.5 w-3.5" /> Klik untuk Zoom
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-slate-200/50 group-hover:scale-105 transition-transform duration-700 ease-in-out"></div>
                  <div className="relative z-10 flex flex-col items-center text-slate-400">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-center px-4">
                      Tempat Foto {fasilitas.nama}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col flex-grow">
              <h4 className="text-xl font-extrabold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                {fasilitas.nama}
              </h4>
              <p className="text-slate-500 leading-relaxed text-sm font-medium flex-grow">
                {fasilitas.deskripsi}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Lightbox Modal for Zoom */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 md:p-10 transition-all duration-300 animate-in fade-in"
          onClick={() => setActiveImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-4 right-4 z-[110] bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors backdrop-blur-sm shadow-md"
            aria-label="Tutup"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image container */}
          <div
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image/card itself
          >
            <img
              src={activeImage.src}
              alt={activeImage.title}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            {/* Image caption */}
            <div className="mt-4 bg-white/10 backdrop-blur-md text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-lg border border-white/5 text-center max-w-md">
              {activeImage.title}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
