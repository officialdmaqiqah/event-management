"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Lock, Smartphone, Send, KeyRound } from "lucide-react"

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    wa_api_key: "",
    wa_sender_id: "",
    wa_message_template: ""
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
        setFormData({
          wa_api_key: data.wa_api_key || "",
          wa_sender_id: data.wa_sender_id || "",
          wa_message_template: data.wa_message_template || "*Pendaftaran Sukses!*\n\nHalo {{nama}},\nTerima kasih telah mendaftar di acara *{{event}}*.\n\nBerikut adalah tautan tiket Anda:\n{{link_tiket}}\n\nTerima kasih."
        })
      }
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setSuccess(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        wa_api_key: formData.wa_api_key,
        wa_sender_id: formData.wa_sender_id,
        wa_message_template: formData.wa_message_template
      })
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 flex items-center justify-center"><div className="animate-pulse text-indigo-500 font-semibold">Memuat Pengaturan...</div></div>

  if (!profile?.is_premium) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-10">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan WhatsApp</h1>
        
        <Card className="border-t-4 border-t-slate-300 shadow-xl glass overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Lock className="w-48 h-48" />
          </div>
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Lock className="w-6 h-6 text-slate-500" /> Fitur Premium Terkunci
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Kirim WhatsApp notifikasi otomatis langsung dari Nomor Pribadi Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4 pt-6">
            <p className="text-slate-600">
              Dengan fitur Premium, Anda dapat:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-700">
                <div className="bg-indigo-100 p-1.5 rounded-full"><Smartphone className="w-4 h-4 text-indigo-600" /></div>
                Menghubungkan API XSender (Fonnte/Watzap) Anda sendiri.
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <div className="bg-indigo-100 p-1.5 rounded-full"><Send className="w-4 h-4 text-indigo-600" /></div>
                Mengubah isi teks template WhatsApp pendaftaran sesuka hati.
              </li>
            </ul>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border border-amber-200">
              <h3 className="font-bold text-amber-900 mb-2">Tertarik mencoba?</h3>
              <p className="text-amber-800 text-sm mb-4">
                Layanan ini tersedia dengan biaya hanya <strong>Rp 250.000 / Tahun</strong>. Semua fitur premium akan langsung aktif untuk akun Anda.
              </p>
              <a href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20ingin%20upgrade%20akun%20Acaraku.id%20saya%20ke%20Premium." target="_blank" rel="noreferrer">
                <Button className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
                  Hubungi Admin via WA
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan WhatsApp</h1>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1 border border-amber-200">
          <ShieldCheck className="w-4 h-4" /> AKUN PREMIUM
        </span>
      </div>

      <Card className="glass shadow-xl border-t-4 border-t-indigo-500">
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-500" /> Konfigurasi API
            </CardTitle>
            <CardDescription>
              Masukkan kredensial API WhatsApp (XSender) Anda di bawah ini agar pesan terkirim dari nomor Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 border border-green-200">
                Pengaturan WhatsApp berhasil disimpan!
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wa_api_key">XSender API Key</Label>
                <Input 
                  id="wa_api_key" 
                  name="wa_api_key" 
                  value={formData.wa_api_key} 
                  onChange={handleChange} 
                  className="font-mono bg-white/50" 
                  placeholder="Misal: raRmjxN5P9CI..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wa_sender_id">Sender Device ID (Nomor WA Anda)</Label>
                <Input 
                  id="wa_sender_id" 
                  name="wa_sender_id" 
                  value={formData.wa_sender_id} 
                  onChange={handleChange} 
                  className="font-mono bg-white/50" 
                  placeholder="Misal: 62812345678"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <Label htmlFor="wa_message_template">Template Pesan Otomatis</Label>
              <CardDescription className="text-xs mb-2">
                Gunakan variabel berikut: <code>{"{{nama}}"}</code>, <code>{"{{event}}"}</code>, <code>{"{{link_tiket}}"}</code>
              </CardDescription>
              <textarea 
                id="wa_message_template" 
                name="wa_message_template" 
                rows={8}
                value={formData.wa_message_template} 
                onChange={handleChange} 
                className="flex w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
            </div>
            
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-6 rounded-b-xl border-t border-slate-100 mt-4">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto h-11 px-8 font-semibold bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
