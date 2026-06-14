import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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

  return {
    title: titleText,
    description: descText,
    openGraph: {
      title: event.title,
      description: descText,
      url: `https://event.kubahtimah.com/${params.slug}`,
      siteName: 'Masjid Agung Kubah Timah',
      images: event.banner_url ? [
        {
          url: event.banner_url,
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
      images: event.banner_url ? [event.banner_url] : [],
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
