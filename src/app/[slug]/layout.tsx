import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"

export async function generateMetadata({ 
  params,
  searchParams
}: { 
  params: { slug: string }
  searchParams?: { v?: string }
}): Promise<Metadata> {
  const supabase = createClient()
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('registration_slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!event) {
    return {
      title: 'Event - Masjid Agung Kubah Timah',
      description: 'Jadwal kegiatan Masjid Agung Kubah Timah',
    }
  }

  const titleText = `${event.title} - Masjid Agung Kubah Timah`
  const descText = event.description || `Hadirilah kegiatan ${event.title} di Masjid Agung Kubah Timah`

  const versionParam = searchParams?.v || (event.updated_at ? new Date(event.updated_at).getTime() : Date.now())
  const pageUrl = `https://event.kubahtimah.com/${params.slug}?v=${versionParam}`

  let bannerUrl = event.banner_url
  if (bannerUrl) {
    bannerUrl = `${bannerUrl}${bannerUrl.includes('?') ? '&' : '?'}v=${versionParam}`
  }

  return {
    title: titleText,
    description: descText,
    openGraph: {
      title: event.title,
      description: descText,
      url: pageUrl,
      siteName: 'Masjid Agung Kubah Timah',
      images: bannerUrl ? [
        {
          url: bannerUrl,
          width: 800,
          height: 600,
          alt: event.title,
        }
      ] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: descText,
      images: bannerUrl ? [bannerUrl] : [],
    }
  }
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
