import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"
import CalendarClient from "./CalendarClient"

export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: { event?: string; v?: string } 
}): Promise<Metadata> {
  const eventId = searchParams.event

  if (!eventId) {
    return {
      title: "Kalender Kegiatan - Masjid Agung Kubah Timah",
      description: "Jadwal kegiatan dan pemakaian fasilitas Masjid Agung Kubah Timah.",
      openGraph: {
        title: "Kalender Kegiatan - Masjid Agung Kubah Timah",
        description: "Jadwal kegiatan dan pemakaian fasilitas Masjid Agung Kubah Timah.",
        url: "https://event.kubahtimah.com/kalender",
        siteName: "Masjid Agung Kubah Timah",
        type: "website",
      }
    }
  }

  const supabase = createClient()
  let titleText = "Kalender Kegiatan - Masjid Agung Kubah Timah"
  let descText = "Jadwal kegiatan dan pemakaian fasilitas Masjid Agung Kubah Timah."
  let imageUrl = ""
  let updatedAt = ""

  // 1. Cek di tabel events (karena public event ID disimpan di events)
  const { data: pubEvent } = (await supabase
    .from('events')
    .select('title, description, banner_url, updated_at')
    .eq('id', eventId)
    .maybeSingle()) as any

  if (pubEvent) {
    titleText = `${pubEvent.title} - Masjid Agung Kubah Timah`
    descText = pubEvent.description || `Hadirilah kegiatan ${pubEvent.title} di Masjid Agung Kubah Timah.`
    imageUrl = pubEvent.banner_url || ""
    updatedAt = pubEvent.updated_at || ""
  } else {
    // 2. Cek di tabel pengajuan_peminjaman
    const { data: pengajuan } = (await supabase
      .from('pengajuan_peminjaman')
      .select('nama_event, deskripsi_kegiatan, url_flyer, updated_at')
      .eq('id', eventId)
      .maybeSingle()) as any

    if (pengajuan) {
      titleText = `${pengajuan.nama_event} - Masjid Agung Kubah Timah`
      descText = pengajuan.deskripsi_kegiatan || `Hadirilah kegiatan ${pengajuan.nama_event} di Masjid Agung Kubah Timah.`
      imageUrl = pengajuan.url_flyer || ""
      updatedAt = pengajuan.updated_at || ""
    }
  }

  const versionParam = searchParams.v || (updatedAt ? new Date(updatedAt).getTime() : Date.now())
  const pageUrl = `https://event.kubahtimah.com/kalender?event=${eventId}&v=${versionParam}`

  if (imageUrl) {
    imageUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}v=${versionParam}`
  }

  return {
    title: titleText,
    description: descText,
    openGraph: {
      title: titleText,
      description: descText,
      url: pageUrl,
      siteName: 'Masjid Agung Kubah Timah',
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: titleText,
        }
      ] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: titleText,
      description: descText,
      images: imageUrl ? [imageUrl] : [],
    }
  }
}

export default function CalendarPage() {
  return <CalendarClient />
}
