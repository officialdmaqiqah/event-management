"use client"

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackAnalyticsEvent } from '@/app/actions/analytics'

export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const trackedUrl = useRef<string | null>(null)

  useEffect(() => {
    // Bangun full URL/Path yang dikunjungi
    let currentUrl = pathname
    if (searchParams && searchParams.toString()) {
      currentUrl += '?' + searchParams.toString()
    }

    // Cegah pelacakan ganda untuk URL yang persis sama
    if (trackedUrl.current !== currentUrl) {
      trackedUrl.current = currentUrl
      
      // Kirim event page_view ke backend
      trackAnalyticsEvent('page_view', currentUrl).catch(console.error)
    }
  }, [pathname, searchParams])

  // Komponen ini tidak me-render apapun
  return null
}
