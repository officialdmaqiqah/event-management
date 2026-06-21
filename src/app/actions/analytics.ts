"use server"

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

export async function trackAnalyticsEvent(eventType: string, path: string, metadata: any = {}) {
  try {
    const supabase = createClient()
    const headersList = headers()
    
    // Dapatkan IP pengunjung
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : (realIp || 'unknown')
    
    // Dapatkan User Agent
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Hash IP agar privasi tetap terjaga (tidak menyimpan raw IP)
    const ipHash = crypto.createHash('sha256').update(ip + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).digest('hex').substring(0, 16)

    // Simpan ke database
    const { error } = await supabase.from('analytics_events').insert([
      {
        event_type: eventType,
        path: path,
        ip_hash: ipHash,
        user_agent: userAgent,
        metadata: metadata
      }
    ])

    if (error) {
      console.error('Error tracking analytics:', error)
    }
  } catch (error) {
    // Diam-diam gagal agar tidak mengganggu aplikasi utama
    console.error('Failed to track analytics event', error)
  }
}

export async function getAnalyticsSummary() {
  try {
    const supabase = createClient()
    
    // Mengambil data analitik 30 hari terakhir
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_type, ip_hash, path, created_at, metadata')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (error || !data) return null

    const summary = {
      totalViews: 0,
      uniqueVisitors: new Set(),
      shares: {
        wa: 0,
        telegram: 0,
        facebook: 0,
        x: 0,
        native: 0
      },
      downloads: {
        flyer: 0,
        ics: 0
      },
      topPages: {} as Record<string, number>
    }

    data.forEach(event => {
      // Hitung Unique Visitors
      summary.uniqueVisitors.add(event.ip_hash)

      if (event.event_type === 'page_view') {
        summary.totalViews++
        // Hitung Top Pages
        summary.topPages[event.path] = (summary.topPages[event.path] || 0) + 1
      } 
      else if (event.event_type === 'share_wa') summary.shares.wa++
      else if (event.event_type === 'share_telegram') summary.shares.telegram++
      else if (event.event_type === 'share_facebook') summary.shares.facebook++
      else if (event.event_type === 'share_x') summary.shares.x++
      else if (event.event_type === 'share_native') summary.shares.native++
      else if (event.event_type === 'download_flyer') summary.downloads.flyer++
      else if (event.event_type === 'download_ics') summary.downloads.ics++
    })

    // Format top pages agar mudah di-render
    const topPagesArray = Object.entries(summary.topPages)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5) // Ambil 5 halaman teratas

    return {
      totalViews: summary.totalViews,
      uniqueVisitors: summary.uniqueVisitors.size,
      shares: summary.shares,
      downloads: summary.downloads,
      topPages: topPagesArray
    }
  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    return null
  }
}
