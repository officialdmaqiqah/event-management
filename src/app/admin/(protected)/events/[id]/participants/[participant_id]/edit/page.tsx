"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

export default function EditParticipantPage({ params }: { params: { id: string, participant_id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    whatsapp: "",
    gender: "",
    organization: "",
    status: "registered",
  })

  useEffect(() => {
    fetchParticipant()
  }, [])

  const fetchParticipant = async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', params.participant_id)
      .single()

    if (error || !data) {
      setError("Peserta tidak ditemukan")
      setFetching(false)
      return
    }

    setFormData({
      full_name: data.full_name || "",
      whatsapp: data.whatsapp || "",
      gender: data.gender || "",
      organization: data.organization || "",
      status: data.status || "registered",
    })
    setFetching(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('participants')
      .update({
        full_name: formData.full_name,
        whatsapp: formData.whatsapp,
        gender: formData.gender,
        organization: formData.organization,
        status: formData.status,
      })
      .eq('id', params.participant_id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      router.push(`/admin/events/${params.id}`)
      router.refresh()
    }
  }

  if (fetching) return <div className="p-10 flex h-screen items-center justify-center"><div className="animate-pulse text-indigo-500 font-semibold">Memuat Data Peserta...</div></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Edit Peserta</h1>
        <Link href={`/admin/events/${params.id}`}>
          <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">Batal</Button>
        </Link>
      </div>

      <Card className="glass shadow-xl border-t-4 border-t-indigo-500">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-xl">Data Diri Peserta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input id="full_name" name="full_name" required value={formData.full_name} onChange={handleChange} className="bg-white/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input id="whatsapp" name="whatsapp" required value={formData.whatsapp} onChange={handleChange} className="bg-white/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <select
                  id="gender"
                  name="gender"
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="" disabled>Pilih Jenis Kelamin</option>
                  <option value="Pria">Pria</option>
                  <option value="Wanita">Wanita</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Instansi / Organisasi</Label>
              <Input id="organization" name="organization" value={formData.organization} onChange={handleChange} className="bg-white/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Kehadiran</Label>
              <select
                id="status"
                name="status"
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="registered">Terdaftar (Belum Hadir)</option>
                <option value="attended">Hadir (Checked In)</option>
              </select>
            </div>
            
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-6 rounded-b-xl border-t border-slate-100 mt-4">
            <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all">
              {loading ? "Menyimpan Perubahan..." : "Update Peserta"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
