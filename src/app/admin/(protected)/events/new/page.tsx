"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"

const toDatetimeLocal = (isoString: string) => {
  if (!isoString) return ""
  try {
    const date = new Date(isoString)
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  } catch (e) {
    return ""
  }
}

function NewEventForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  })

  const showDialog = (type: DialogType, title: string, message: string) => {
    setDialogState({ isOpen: true, type, title, message })
  }

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    organizer_name: "",
    organizer_contact: "",
    description: "",
    agenda: "",
    location: "",
    start_datetime: "",
    end_datetime: "",
    quota: "",
    status: "draft" as 'draft' | 'published' | 'cancelled' | 'completed',
    registration_slug: "",
    requires_registration: true,
    latitude: "",
    longitude: "",
    radius_meters: "100",
    checkin_start_datetime: "",
    checkin_end_datetime: "",
  })

  useEffect(() => {
    const titleParam = searchParams.get("title") || ""
    const typeParam = searchParams.get("type") || ""
    const orgName = searchParams.get("organizer_name") || ""
    const orgContact = searchParams.get("organizer_contact") || ""
    const desc = searchParams.get("description") || ""
    const loc = searchParams.get("location") || ""
    const start = searchParams.get("start_datetime") || ""
    const end = searchParams.get("end_datetime") || ""
    
    if (titleParam || orgName || desc) {
      setFormData(prev => ({
        ...prev,
        title: titleParam,
        type: typeParam,
        organizer_name: orgName,
        organizer_contact: orgContact,
        description: desc,
        location: loc,
        start_datetime: toDatetimeLocal(start),
        end_datetime: toDatetimeLocal(end),
        registration_slug: titleParam.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      }))
    }
  }, [searchParams])

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [customFields, setCustomFields] = useState<{ id: string, name: string, label: string, type: string, required: boolean }[]>([])

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { 
      id: Date.now().toString(), 
      name: `field_${Date.now()}`, 
      label: "Pertanyaan Baru", 
      type: "text", 
      required: false 
    }])
  }

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id))
  }

  const updateCustomField = (id: string, field: string, value: any) => {
    setCustomFields(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, [field]: value }
      }
      return f
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'banner') setBannerFile(e.target.files[0])
      if (type === 'logo') setLogoFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.end_datetime && new Date(formData.end_datetime) < new Date(formData.start_datetime)) {
      setError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.")
      setLoading(false)
      return
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("Sesi Anda telah berakhir. Silakan login kembali.")
      setLoading(false)
      return
    }

    let banner_url = null
    let logo_url = null

    // Upload Banner
    if (bannerFile) {
      const fileExt = bannerFile.name.split('.').pop()
      const fileName = `${user.id}_banner_${Date.now()}.${fileExt}`
      const { data, error: uploadError } = await supabase.storage
        .from('event_assets')
        .upload(fileName, bannerFile)
      
      if (uploadError) {
        setError("Gagal mengunggah banner: " + uploadError.message)
        setLoading(false)
        return
      }
      banner_url = supabase.storage.from('event_assets').getPublicUrl(fileName).data.publicUrl
    }

    // Upload Logo
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${user.id}_logo_${Date.now()}.${fileExt}`
      const { data, error: uploadError } = await supabase.storage
        .from('event_assets')
        .upload(fileName, logoFile)
      
      if (uploadError) {
        setError("Gagal mengunggah logo: " + uploadError.message)
        setLoading(false)
        return
      }
      logo_url = supabase.storage.from('event_assets').getPublicUrl(fileName).data.publicUrl
    }

    const { error: insertError } = await supabase.from('events').insert([
      {
        user_id: user.id,
        banner_url,
        logo_url,
        title: formData.title,
        type: formData.type,
        organizer_name: formData.organizer_name,
        organizer_contact: formData.organizer_contact,
        description: formData.description,
        agenda: formData.agenda,
        location: formData.location,
        start_datetime: new Date(formData.start_datetime).toISOString(),
        end_datetime: formData.end_datetime ? new Date(formData.end_datetime).toISOString() : null,
        quota: formData.quota ? parseInt(formData.quota) : null,
        status: formData.status,
        registration_slug: formData.registration_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        requires_registration: String(formData.requires_registration) === 'true',
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        radius_meters: parseInt(formData.radius_meters) || 100,
        checkin_start_datetime: formData.checkin_start_datetime ? new Date(formData.checkin_start_datetime).toISOString() : null,
        checkin_end_datetime: formData.checkin_end_datetime ? new Date(formData.checkin_end_datetime).toISOString() : null,
        custom_fields: customFields,
      }
    ])

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Buat Event Baru</h1>
        <Link href="/admin">
          <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">Kembali</Button>
        </Link>
      </div>

      <Card className="glass shadow-xl border-t-4 border-t-indigo-500">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-xl">Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}
            
            {/* Section 1: Informasi Utama */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 font-semibold">Nama Event <span className="text-red-500">*</span></Label>
                <Input id="title" name="title" required value={formData.title} onChange={handleChange} className="bg-gray-50 focus:bg-white transition-colors text-lg py-6" placeholder="Contoh: Seminar Nasional Teknologi 2026" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_slug" className="text-gray-700 font-semibold">Slug URL Link <span className="text-red-500">*</span></Label>
                <Input id="registration_slug" name="registration_slug" required value={formData.registration_slug} onChange={handleChange} placeholder="e.g. seminar-it-2026" className="bg-gray-50 font-mono text-sm" />
                <p className="text-xs text-gray-500">Link pendaftaran akan menjadi: event.kubahtimah.com/<strong>{formData.registration_slug || '...'}</strong></p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-gray-700 font-semibold">Tipe Event <span className="text-red-500">*</span></Label>
                  <Input id="type" name="type" required value={formData.type} onChange={handleChange} className="bg-gray-50" placeholder="Contoh: Seminar, Workshop, dll" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quota" className="text-gray-700 font-semibold">Kuota Maksimal Peserta</Label>
                  <Input id="quota" name="quota" type="number" min="1" value={formData.quota} onChange={handleChange} placeholder="Kosongkan jika tidak terbatas" className="bg-gray-50" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Section 2: Waktu & Tempat */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Waktu & Tempat Pelaksanaan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_datetime" className="text-gray-700 font-semibold">Tanggal & Waktu Mulai <span className="text-red-500">*</span></Label>
                  <Input id="start_datetime" name="start_datetime" type="datetime-local" required value={formData.start_datetime} onChange={handleChange} className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_datetime" className="text-gray-700 font-semibold">Tanggal & Waktu Selesai</Label>
                  <Input id="end_datetime" name="end_datetime" type="datetime-local" value={formData.end_datetime} onChange={handleChange} className="bg-gray-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-700 font-semibold">Nama Lokasi / Tempat <span className="text-red-500">*</span></Label>
                <Input id="location" name="location" required value={formData.location} onChange={handleChange} className="bg-gray-50" placeholder="Contoh: Gedung Serbaguna Kubah Timah" />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Section 3: Media & Gambar */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Media Promosi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="banner" className="text-gray-700 font-semibold">Banner / Flyer Event</Label>
                  <Input 
                    id="banner" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'banner')} 
                    className="bg-white cursor-pointer" 
                  />
                  <p className="text-xs text-gray-500">Format: JPG/PNG. Maks 2MB. Rekomendasi: Rasio 16:9 (cth: 1920x1080px).</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo" className="text-gray-700 font-semibold">Logo Penyelenggara</Label>
                  <Input 
                    id="logo" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'logo')} 
                    className="bg-white cursor-pointer" 
                  />
                  <p className="text-xs text-gray-500">Format: PNG transparan disarankan.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-4">
              <h3 className="font-semibold text-indigo-900">Sistem Pendaftaran & Absensi</h3>
              
              <div className="space-y-2">
                <Label htmlFor="requires_registration">Sistem Kehadiran *</Label>
                <select
                  id="requires_registration"
                  name="requires_registration"
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white/80 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  value={String(formData.requires_registration)}
                  onChange={handleChange}
                >
                  <option value="true">Wajib Daftar Dulu (Pre-Registration)</option>
                  <option value="false">Langsung Absen di Tempat (Direct Check-in)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.requires_registration.toString() === 'true' 
                    ? "Peserta mendaftar jauh hari dan mendapatkan E-Ticket QR Code." 
                    : "Peserta hanya membuka link pada hari H untuk absen kehadiran (tanpa tiket)."}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="block text-indigo-800">Geotagging Lokasi (Opsional untuk pembatasan radius absen)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        showDialog('error', 'GPS Tidak Didukung', 'Browser Anda tidak mendukung deteksi lokasi (GPS).');
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setFormData(prev => ({
                            ...prev,
                            latitude: position.coords.latitude.toString(),
                            longitude: position.coords.longitude.toString()
                          }));
                        },
                        (err) => {
                          showDialog('error', 'Gagal Mendapatkan Lokasi', 'Gagal mendapatkan lokasi GPS. Pastikan izin lokasi diaktifkan di browser Anda.');
                        },
                        { enableHighAccuracy: true }
                      );
                    }}
                  >
                    📍 Gunakan Lokasi Saat Ini
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                    <Input id="latitude" name="latitude" type="number" step="any" placeholder="-6.200000" value={formData.latitude} onChange={handleChange} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                    <Input id="longitude" name="longitude" type="number" step="any" placeholder="106.816666" value={formData.longitude} onChange={handleChange} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="radius_meters" className="text-xs">Radius (Meter)</Label>
                    <Input id="radius_meters" name="radius_meters" type="number" min="1" value={formData.radius_meters} onChange={handleChange} className="bg-white" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-6">Kosongkan latitude/longitude jika tidak ingin membatasi absen berdasarkan lokasi GPS.</p>
                
                <Label className="block text-indigo-800 mt-6">Batas Waktu Absen (Check-in Window)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkin_start_datetime" className="text-xs">Waktu Mulai Buka Absen</Label>
                    <Input id="checkin_start_datetime" name="checkin_start_datetime" type="datetime-local" value={formData.checkin_start_datetime} onChange={handleChange} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkin_end_datetime" className="text-xs">Waktu Tutup Absen (Opsional)</Label>
                    <Input id="checkin_end_datetime" name="checkin_end_datetime" type="datetime-local" value={formData.checkin_end_datetime} onChange={handleChange} className="bg-white" />
                  </div>
                </div>
                <p className="text-xs text-slate-500">Jika diisi, peserta tidak bisa melakukan self check-in di luar rentang waktu ini.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quota">Kuota Maksimal Peserta</Label>
              <Input id="quota" name="quota" type="number" min="1" value={formData.quota} onChange={handleChange} placeholder="Kosongkan jika tidak terbatas" className="bg-white/50" />
            </div>

            {/* Custom Form Builder */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-amber-900">Custom Form Builder (Premium)</h3>
                  <p className="text-xs text-amber-700">Tambahkan pertanyaan ekstra untuk formulir pendaftaran.</p>
                </div>
                <Button type="button" size="sm" onClick={addCustomField} className="bg-amber-600 hover:bg-amber-700">
                  + Tambah Kolom
                </Button>
              </div>

              {customFields.length > 0 && (
                <div className="space-y-4 mt-4">
                  {customFields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-white rounded-lg border border-amber-200 shadow-sm relative">
                      <button 
                        type="button" 
                        onClick={() => removeCustomField(field.id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 font-bold"
                      >
                        ✕
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Pertanyaan (Label)</Label>
                          <Input 
                            value={field.label} 
                            onChange={(e) => updateCustomField(field.id, 'label', e.target.value)} 
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Tipe Input</Label>
                          <select
                            className="flex h-8 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm"
                            value={field.type}
                            onChange={(e) => updateCustomField(field.id, 'type', e.target.value)}
                          >
                            <option value="text">Teks Pendek</option>
                            <option value="textarea">Teks Panjang</option>
                            <option value="number">Angka</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input 
                            type="checkbox" 
                            id={`req_${field.id}`}
                            checked={field.required}
                            onChange={(e) => updateCustomField(field.id, 'required', e.target.checked)}
                          />
                          <Label htmlFor={`req_${field.id}`} className="text-xs cursor-pointer">Wajib Diisi</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="organizer_name">Nama Penyelenggara</Label>
                <Input id="organizer_name" name="organizer_name" value={formData.organizer_name} onChange={handleChange} className="bg-white/50" placeholder="Opsional (Cth: BEM Fasilkom)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizer_contact">Kontak Penyelenggara</Label>
                <Input id="organizer_contact" name="organizer_contact" value={formData.organizer_contact} onChange={handleChange} className="bg-white/50" placeholder="Opsional (Cth: 0812...)" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <textarea 
                id="description" 
                name="description" 
                className="flex min-h-[100px] w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                value={formData.description} 
                onChange={handleChange} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Rilis</Label>
              <select
                id="status"
                name="status"
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">Draft (Belum dibuka)</option>
                <option value="published">Published (Dibuka untuk publik)</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-6 rounded-b-xl border-t border-slate-100 mt-4">
            <Button type="submit" disabled={loading} className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
              {loading ? "Menyimpan Data..." : "Simpan Event Sekarang"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <CustomDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onCancel={closeDialog}
        onConfirm={closeDialog}
      />
    </div>
  )
}

export default function NewEventPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
      </div>
    }>
      <NewEventForm />
    </Suspense>
  )
}
