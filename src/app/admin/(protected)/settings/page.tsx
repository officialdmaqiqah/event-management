"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Lock, Smartphone, Send, KeyRound, MessageSquare, Users, FileText, Settings, FlaskConical } from "lucide-react"
import { sendWhatsAppNotification } from "@/app/actions/notification"
export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"api" | "pemohon" | "internal">("api")

  const [formData, setFormData] = useState({
    wa_api_key: "",
    wa_sender_id: "",
    wa_message_template: "",
    wa_approval_request_template: "",
    wa_approval_result_template: "",
    wa_reminder_template: "",
    wa_minutes_template: ""
  })

  const [testNumber, setTestNumber] = useState("")
  const [testMessage, setTestMessage] = useState("Ini adalah pesan uji coba dari sistem MAKT.")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{success?: boolean, error?: string, simulated?: boolean} | null>(null)

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
          wa_message_template: data.wa_message_template || "*Pendaftaran Sukses!*\n\nHalo *{{nama}}*,\nTerima kasih telah mendaftar di acara *{{event}}*.\n\nBerikut adalah tautan tiket Anda:\n{{link_tiket}}\n\nTerima kasih.",
          wa_approval_request_template: data.wa_approval_request_template || "📝 *PERMINTAAN APPROVAL KEGIATAN*\n\nAssalamualaikum Bpk/Ibu *{{nama_approver}}*\nTerdapat pengajuan baru di *Sistem Management Event System Masjid Agung Kubah Timah*.\n\nMohon review pengajuan kegiatan berikut:\n- Event : *{{nama_event}}*\n- Jenis : *{{jenis_event}}*\n- Pemohon : *{{pemohon}}*\n- Tanggal Event : *{{tanggal_event}}*\n\nSilakan berikan persetujuan atau penolakan melalui tautan berikut:\n{{link_approval}}\n\nTerima kasih.",
          wa_approval_result_template: data.wa_approval_result_template || "*Informasi Status Pengajuan*\n\nHalo *{{nama_pemohon}}*,\nPengajuan kegiatan *{{nama_event}}* Anda telah berstatus: *{{status_pengajuan}}*.\n\nCatatan: *{{catatan}}*\n\nSilakan cek detail lengkapnya di sini:\n{{link_status}}\n\nTerima kasih.",
          wa_reminder_template: data.wa_reminder_template || "*Pengingat Acara BESOK*\n\nHalo *{{nama}}*,\nKami mengingatkan bahwa acara *{{nama_event}}* akan berlangsung esok hari.\n\nMohon siapkan tiket Anda untuk absensi:\n{{link_tiket}}\n\nSampai jumpa di lokasi!",
          wa_minutes_template: data.wa_minutes_template || "*Publikasi Notulen Rapat*\n\nPemberitahuan: Notulen hasil rapat *{{nama_event}}* telah diterbitkan secara resmi.\n\nSilakan baca selengkapnya dan tindak lanjuti hasil keputusannya melalui tautan berikut:\n{{link_notulen}}\n\nTerima kasih."
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
        wa_message_template: formData.wa_message_template,
        wa_approval_request_template: formData.wa_approval_request_template,
        wa_approval_result_template: formData.wa_approval_result_template,
        wa_reminder_template: formData.wa_reminder_template,
        wa_minutes_template: formData.wa_minutes_template
      })
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
    }
    setSaving(false)
  }

  const handleTestSend = async () => {
    if (!testNumber) {
      setTestResult({ success: false, error: "Nomor WhatsApp harus diisi" })
      return
    }
    
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await sendWhatsAppNotification({
        recipient_name: "Test User",
        recipient_whatsapp: testNumber,
        message: testMessage
      })
      setTestResult(result)
    } catch (err: any) {
      setTestResult({ success: false, error: err.message })
    } finally {
      setTesting(false)
    }
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
              <a href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20ingin%20upgrade%20akun%20Kubah%20Timah%20Events%20saya%20ke%20Premium." target="_blank" rel="noreferrer">
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
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pusat Notifikasi WhatsApp</h1>
          <p className="text-sm text-slate-500 mt-1">Atur integrasi API dan template pesan otomatis untuk seluruh sistem.</p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1 border border-amber-200">
          <ShieldCheck className="w-4 h-4" /> AKUN PREMIUM
        </span>
      </div>

      <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("api")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "api" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <Settings className="w-4 h-4" /> Koneksi API
        </button>
        <button
          onClick={() => setActiveTab("pemohon")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "pemohon" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <Users className="w-4 h-4" /> Template Peserta
        </button>
        <button
          onClick={() => setActiveTab("internal")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "internal" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <FileText className="w-4 h-4" /> Template Internal
        </button>
      </div>

      <form onSubmit={handleSave}>
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200 mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 border border-green-200 mb-6">
            Pengaturan WhatsApp berhasil disimpan!
          </div>
        )}

        <Card className="glass shadow-xl border-t-4 border-t-indigo-500 mb-6">
          
          {activeTab === "api" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-500" /> Konfigurasi API
                </CardTitle>
                <CardDescription>
                  Masukkan kredensial API WhatsApp (XSender) Anda di bawah ini agar pesan terkirim dari nomor Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wa_api_key">XSender API Key</Label>
                  <Input 
                    id="wa_api_key" 
                    name="wa_api_key" 
                    value={formData.wa_api_key} 
                    onChange={handleChange} 
                    className="font-mono bg-white/50 max-w-lg" 
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
                    className="font-mono bg-white/50 max-w-lg" 
                    placeholder="Misal: 62812345678"
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <FlaskConical className="w-5 h-5 text-indigo-500" /> Uji Coba Kirim Pesan
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 max-w-lg">
                    <div className="space-y-2">
                      <Label htmlFor="test_number">Nomor Tujuan</Label>
                      <Input 
                        id="test_number" 
                        value={testNumber} 
                        onChange={(e) => setTestNumber(e.target.value)} 
                        className="bg-white" 
                        placeholder="08123..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="test_message">Pesan Uji Coba</Label>
                      <textarea 
                        id="test_message"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        rows={3}
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                      />
                    </div>
                    
                    {testResult && (
                      <div className={`p-3 rounded-md text-sm ${testResult.success ? (testResult.simulated ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200') : 'bg-red-100 text-red-800 border-red-200'} border`}>
                        {testResult.success 
                          ? (testResult.simulated ? '✅ Berhasil (Mode Simulasi - API Key tidak diset / gateway tidak ditemukan)' : '✅ Pesan berhasil dikirim via Gateway!') 
                          : `❌ Gagal: ${testResult.error}`}
                      </div>
                    )}

                    <Button type="button" onClick={handleTestSend} disabled={testing} className="w-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                      {testing ? "Mengirim..." : "Kirim Pesan Uji Coba"}
                    </Button>
                    <p className="text-xs text-slate-500 text-center mt-2">Pastikan pengaturan API sudah disimpan sebelum melakukan uji coba.</p>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {activeTab === "pemohon" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" /> Pesan ke Pemohon / Peserta
                </CardTitle>
                <CardDescription>
                  Template notifikasi yang dikirimkan kepada pemohon atau peserta kegiatan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Pendaftaran Sukses */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    <Label htmlFor="wa_message_template" className="font-bold text-base">Pendaftaran / Pembuatan Event Sukses</Label>
                  </div>
                  <CardDescription className="text-xs mb-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <span className="font-semibold">Variabel:</span> <code>{"{{nama}}"}</code>, <code>{"{{event}}"}</code>, <code>{"{{link_tiket}}"}</code>
                  </CardDescription>
                  <textarea 
                    id="wa_message_template" name="wa_message_template" rows={6}
                    value={formData.wa_message_template} onChange={handleChange} 
                    className="flex w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Hasil Approval */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <Label htmlFor="wa_approval_result_template" className="font-bold text-base">Notifikasi Hasil Pengajuan (Approval)</Label>
                  </div>
                  <CardDescription className="text-xs mb-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <span className="font-semibold">Variabel:</span> <code>{"{{nama_pemohon}}"}</code>, <code>{"{{nama_event}}"}</code>, <code>{"{{status_pengajuan}}"}</code>, <code>{"{{catatan}}"}</code>, <code>{"{{link_status}}"}</code>
                  </CardDescription>
                  <textarea 
                    id="wa_approval_result_template" name="wa_approval_result_template" rows={6}
                    value={formData.wa_approval_result_template} onChange={handleChange} 
                    className="flex w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Reminder H-1 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-orange-500" />
                    <Label htmlFor="wa_reminder_template" className="font-bold text-base">Pengingat H-1 Acara</Label>
                  </div>
                  <CardDescription className="text-xs mb-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <span className="font-semibold">Variabel:</span> <code>{"{{nama}}"}</code>, <code>{"{{nama_event}}"}</code>, <code>{"{{link_tiket}}"}</code>
                  </CardDescription>
                  <textarea 
                    id="wa_reminder_template" name="wa_reminder_template" rows={6}
                    value={formData.wa_reminder_template} onChange={handleChange} 
                    className="flex w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                </div>
              </CardContent>
            </>
          )}

          {activeTab === "internal" && (
            <>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" /> Pesan Internal / Panitia
                </CardTitle>
                <CardDescription>
                  Template notifikasi operasional untuk pengelola, pejabat, dan panitia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Permintaan Approval Baru */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    <Label htmlFor="wa_approval_request_template" className="font-bold text-base">Permohonan Persetujuan Baru (Untuk Pejabat)</Label>
                  </div>
                  <CardDescription className="text-xs mb-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <span className="font-semibold">Variabel:</span> <code>{"{{nama_approver}}"}</code>, <code>{"{{nama_event}}"}</code>, <code>{"{{pemohon}}"}</code>, <code>{"{{link_approval}}"}</code>
                  </CardDescription>
                  <textarea 
                    id="wa_approval_request_template" name="wa_approval_request_template" rows={6}
                    value={formData.wa_approval_request_template} onChange={handleChange} 
                    className="flex w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Notulen Selesai */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <Label htmlFor="wa_minutes_template" className="font-bold text-base">Notulen / Laporan Diterbitkan</Label>
                  </div>
                  <CardDescription className="text-xs mb-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                    <span className="font-semibold">Variabel:</span> <code>{"{{nama_event}}"}</code>, <code>{"{{link_notulen}}"}</code>
                  </CardDescription>
                  <textarea 
                    id="wa_minutes_template" name="wa_minutes_template" rows={6}
                    value={formData.wa_minutes_template} onChange={handleChange} 
                    className="flex w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  />
                </div>
              </CardContent>
            </>
          )}

          <CardFooter className="bg-slate-50/50 p-6 rounded-b-xl border-t border-slate-100">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto h-11 px-8 font-semibold bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-4 h-4 mr-2" /> {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
            </Button>
          </CardFooter>

        </Card>
      </form>
    </div>
  )
}
