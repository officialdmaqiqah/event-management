"use client"

import { useEffect, useState } from "react"
import { getAnalyticsSummary } from "@/app/actions/analytics"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, Users, Share2, Download, MousePointerClick, RefreshCw } from "lucide-react"

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const result = await getAnalyticsSummary()
    setData(result)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Statistik Pengunjung
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan kunjungan dan interaksi jamaah selama 30 hari terakhir.
          </p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl h-28 border border-slate-100"></div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-500">Total Kunjungan</CardTitle>
                <MousePointerClick className="w-4 h-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{data.totalViews.toLocaleString()}</div>
                <p className="text-xs text-slate-400 mt-1">Halaman dilihat</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-500">Pengunjung Unik</CardTitle>
                <Users className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{data.uniqueVisitors.toLocaleString()}</div>
                <p className="text-xs text-slate-400 mt-1">Berdasarkan perangkat</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-500">Total Bagikan</CardTitle>
                <Share2 className="w-4 h-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {Object.values(data.shares).reduce((a: any, b: any) => a + b, 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Kali event dibagikan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-500">Unduh & Simpan</CardTitle>
                <Download className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {Object.values(data.downloads).reduce((a: any, b: any) => a + b, 0)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Flyer & kalender diunduh</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Halaman Terpopuler</CardTitle>
                <CardDescription>Top 5 halaman paling banyak dilihat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topPages.length > 0 ? data.topPages.map((page: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate" title={page.path}>
                          {page.path === '/' ? '/ (Beranda)' : page.path}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {page.views}
                      </span>
                    </div>
                  )) : (
                    <div className="text-sm text-slate-500 text-center py-4">Belum ada data kunjungan.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detail Interaksi</CardTitle>
                <CardDescription>Rincian platform berbagi dan unduhan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bagikan Ke</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>WhatsApp</span>
                        <span className="font-semibold text-slate-800">{data.shares.wa}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-500"></span>WA Status / IG Story</span>
                        <span className="font-semibold text-slate-800">{data.shares.native}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-sky-500"></span>Telegram</span>
                        <span className="font-semibold text-slate-800">{data.shares.telegram}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-600"></span>Facebook</span>
                        <span className="font-semibold text-slate-800">{data.shares.facebook}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-black"></span>X (Twitter)</span>
                        <span className="font-semibold text-slate-800">{data.shares.x}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Unduhan</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Download Flyer</span>
                        <span className="font-semibold text-slate-800">{data.downloads.flyer}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Simpan Kalender (ICS)</span>
                        <span className="font-semibold text-slate-800">{data.downloads.ics}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <p className="text-sm font-medium">Gagal memuat data statistik. Pastikan Anda telah menjalankan script SQL untuk membuat tabel analytics_events di database Supabase.</p>
        </div>
      )}
    </div>
  )
}
