"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"
import Link from "next/link"
import { Calendar, Users, MapPin, FileText, ChevronRight, ChevronLeft, CheckCircle2, Building2, User, Phone, Mail, ClipboardList } from "lucide-react"
import { useRouter } from "next/navigation"

const AREA_OPTIONS = [
  "Ruang Utama (Masjid)",
  "Aula Serbaguna",
  "Halaman Utama",
  "Ruang Rapat Lt. 1",
  "Ruang Rapat Lt. 2",
  "Perpustakaan",
  "Lapangan Parkir",
  "Ruang Kelas / TPQ",
]

type Step = 1 | 2 | 3

export default function AjukanPeminjamanPage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [jenisEventOptions, setJenisEventOptions] = useState<string[]>([
    "Kajian / Pengajian",
    "Seminar / Workshop",
    "Rapat / Musyawarah",
    "Nikah / Akad",
    "Sosial / Bakti Sosial",
    "Olahraga / Lomba",
    "Pendidikan / Pelatihan",
    "Kebudayaan / Seni",
    "Lainnya",
  ])

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("jenis_event")
          .select("name")
          .eq("is_active", true)
          .order("name", { ascending: true })

        if (!error && data && data.length > 0) {
          setJenisEventOptions(data.map(d => d.name))
        }
      } catch (err) {
        console.error("Gagal load jenis event:", err)
      }
    }
    fetchEventTypes()
  }, [])

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean; type: DialogType; title: string; message: string;
  }>({ isOpen: false, type: 'alert', title: '', message: '' })

  // Step 1: Data Pemohon
  const [pemohon, setPemohon] = useState({
    tipe_pemohon: "",
    nama_pemohon: "",
    nama_lembaga: "",
    whatsapp: "",
    email: "",
    alamat: "",
  })

  // Step 2: Data Event
  const [event, setEvent] = useState({
    nama_event: "",
    jenis_event: "",
    tujuan_peminjaman: "",
    deskripsi_kegiatan: "",
    estimasi_peserta: "",
    tanggal_mulai: "",
    jam_mulai: "",
    tanggal_selesai: "",
    jam_selesai: "",
    area_fasilitas: [] as string[],
    area_lainnya: "",
    kebutuhan_tambahan: "",
    catatan_tambahan: "",
  })

  // Step 3: Lampiran
  const [suratFile, setSuratFile] = useState<File | null>(null)
  const [proposalFile, setProposalFile] = useState<File | null>(null)

  const showDialog = (type: DialogType, title: string, message: string) => {
    setDialogState({ isOpen: true, type, title, message })
  }
  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }))

  const handlePemohonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setPemohon(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => { const n = { ...prev }; delete n[e.target.name]; return n })
  }

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEvent(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) setErrors(prev => { const n = { ...prev }; delete n[e.target.name]; return n })
  }

  const toggleArea = (area: string) => {
    setEvent(prev => ({
      ...prev,
      area_fasilitas: prev.area_fasilitas.includes(area)
        ? prev.area_fasilitas.filter(a => a !== area)
        : [...prev.area_fasilitas, area]
    }))
  }

  const validateStep1 = () => {
    const errs: Record<string, string> = {}
    if (!pemohon.tipe_pemohon) errs.tipe_pemohon = "Tipe pemohon wajib dipilih"
    if (!pemohon.nama_pemohon.trim()) errs.nama_pemohon = "Nama pemohon wajib diisi"
    if (["lembaga","komunitas","instansi"].includes(pemohon.tipe_pemohon) && !pemohon.nama_lembaga.trim())
      errs.nama_lembaga = "Nama lembaga wajib diisi untuk tipe ini"
    if (!pemohon.whatsapp.trim()) errs.whatsapp = "Nomor WhatsApp wajib diisi"
    else if (!/^(08|628|\+628)\d{7,12}$/.test(pemohon.whatsapp.replace(/\s|-/g,'')))
      errs.whatsapp = "Format nomor WhatsApp tidak valid (contoh: 08123456789)"
    if (!pemohon.email.trim()) errs.email = "Email wajib diisi"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pemohon.email)) errs.email = "Format email tidak valid"
    if (!pemohon.alamat.trim()) errs.alamat = "Alamat wajib diisi"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateStep2 = () => {
    const errs: Record<string, string> = {}
    if (!event.nama_event.trim()) errs.nama_event = "Nama event wajib diisi"
    if (!event.jenis_event) errs.jenis_event = "Jenis event wajib dipilih"
    if (!event.tujuan_peminjaman.trim()) errs.tujuan_peminjaman = "Tujuan peminjaman wajib diisi"
    if (!event.deskripsi_kegiatan.trim()) errs.deskripsi_kegiatan = "Deskripsi kegiatan wajib diisi"
    if (!event.estimasi_peserta || parseInt(event.estimasi_peserta) < 1) errs.estimasi_peserta = "Estimasi peserta harus minimal 1"
    if (!event.tanggal_mulai) errs.tanggal_mulai = "Tanggal mulai wajib diisi"
    if (!event.jam_mulai) errs.jam_mulai = "Jam mulai wajib diisi"
    if (!event.tanggal_selesai) errs.tanggal_selesai = "Tanggal selesai wajib diisi"
    if (!event.jam_selesai) errs.jam_selesai = "Jam selesai wajib diisi"
    if (event.tanggal_mulai && event.jam_mulai && event.tanggal_selesai && event.jam_selesai) {
      const mulai = new Date(`${event.tanggal_mulai}T${event.jam_mulai}`)
      const selesai = new Date(`${event.tanggal_selesai}T${event.jam_selesai}`)
      if (selesai <= mulai) errs.jam_selesai = "Waktu selesai harus setelah waktu mulai"
    }
    const allAreas = [...event.area_fasilitas, ...(event.area_lainnya.trim() ? [event.area_lainnya.trim()] : [])]
    if (allAreas.length === 0) errs.area_fasilitas = "Pilih minimal satu area/fasilitas"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateFile = (file: File) => {
    const allowed = ['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) return "Format file tidak didukung. Gunakan PDF, JPG, PNG, DOC, atau DOCX."
    if (file.size > 10 * 1024 * 1024) return "Ukuran file maksimal 10MB."
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'surat' | 'proposal') => {
    if (!e.target.files?.[0]) return
    const file = e.target.files[0]
    const fileError = validateFile(file)
    if (fileError) {
      showDialog('error', 'File Tidak Valid', fileError)
      e.target.value = ''
      return
    }
    if (type === 'surat') setSuratFile(file)
    else setProposalFile(file)
  }

  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split('.').pop()
    const fileName = `${prefix}_${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('pengajuan_assets').upload(fileName, file)
    if (error) throw new Error("Gagal upload file: " + error.message)
    return supabase.storage.from('pengajuan_assets').getPublicUrl(fileName).data.publicUrl
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      let urlSurat = null
      let urlProposal = null

      if (suratFile) urlSurat = await uploadFile(suratFile, 'surat')
      if (proposalFile) urlProposal = await uploadFile(proposalFile, 'proposal')

      const allAreas = [
        ...event.area_fasilitas,
        ...(event.area_lainnya.trim() ? [event.area_lainnya.trim()] : [])
      ]

      const payload = {
        tipe_pemohon: pemohon.tipe_pemohon,
        nama_pemohon: pemohon.nama_pemohon.trim(),
        nama_lembaga: pemohon.nama_lembaga.trim() || null,
        whatsapp: pemohon.whatsapp.trim(),
        email: pemohon.email.trim(),
        alamat: pemohon.alamat.trim(),
        nama_event: event.nama_event.trim(),
        jenis_event: event.jenis_event,
        tujuan_peminjaman: event.tujuan_peminjaman.trim(),
        deskripsi_kegiatan: event.deskripsi_kegiatan.trim(),
        estimasi_peserta: parseInt(event.estimasi_peserta),
        tanggal_mulai: new Date(`${event.tanggal_mulai}T${event.jam_mulai}`).toISOString(),
        tanggal_selesai: new Date(`${event.tanggal_selesai}T${event.jam_selesai}`).toISOString(),
        area_fasilitas: allAreas,
        kebutuhan_tambahan: event.kebutuhan_tambahan.trim() || null,
        url_surat_peminjaman: urlSurat,
        url_proposal: urlProposal,
        catatan_tambahan: event.catatan_tambahan.trim() || null,
      }

      const { data, error } = await supabase.rpc('submit_pengajuan', { pengajuan_data: payload })
      if (error) throw error

      const nomor = data?.nomor_pengajuan || 'PJM-UNKNOWN'
      router.push(`/ajukan-peminjaman/sukses?nomor=${nomor}`)
    } catch (err: any) {
      showDialog('error', 'Gagal Mengirim', err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const prevStep = () => {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  const steps = [
    { num: 1, label: "Data Pemohon", icon: User },
    { num: 2, label: "Data Event", icon: Calendar },
    { num: 3, label: "Lampiran & Kirim", icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-10 px-4">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xl mb-4 hover:text-indigo-800 transition-colors">
          <Calendar className="h-6 w-6" />
          Kubah Timah Events
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Ajukan Peminjaman Fasilitas
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Masjid Agung Kubah Timah — Pengajuan akan diproses dalam 1–3 hari kerja.</p>
      </div>

      {/* Step Indicator */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-center gap-0">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.num
            const isDone = step > s.num
            return (
              <div key={s.num} className="flex items-center">
                <div className={`flex flex-col items-center gap-1.5 transition-all`}>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-300 ${
                    isDone ? 'bg-green-500 text-white' :
                    isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                    'bg-white text-slate-400 border-2 border-slate-200'
                  }`}>
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${isActive ? 'text-indigo-700' : isDone ? 'text-green-600' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-6 transition-all duration-300 ${step > s.num ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* ==================== STEP 1: DATA PEMOHON ==================== */}
        {step === 1 && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-xl" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2"><User className="h-5 w-5 text-indigo-600" /> Data Pemohon</CardTitle>
              <CardDescription>Isi informasi penanggungjawab pengajuan ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Tipe Pemohon */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Tipe Pemohon <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['pribadi','lembaga','komunitas','instansi'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setPemohon(p => ({...p, tipe_pemohon: t})); setErrors(e => {const n={...e}; delete n.tipe_pemohon; return n}) }}
                      className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                        pemohon.tipe_pemohon === t
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {errors.tipe_pemohon && <p className="text-red-500 text-xs mt-1">{errors.tipe_pemohon}</p>}
              </div>

              {/* Nama Pemohon */}
              <div className="space-y-2">
                <Label htmlFor="nama_pemohon" className="text-slate-700 font-semibold">Nama Lengkap Pemohon <span className="text-red-500">*</span></Label>
                <Input id="nama_pemohon" name="nama_pemohon" value={pemohon.nama_pemohon} onChange={handlePemohonChange} placeholder="Nama lengkap penanggungjawab" className="h-11" />
                {errors.nama_pemohon && <p className="text-red-500 text-xs">{errors.nama_pemohon}</p>}
              </div>

              {/* Nama Lembaga (kondisional) */}
              {["lembaga","komunitas","instansi"].includes(pemohon.tipe_pemohon) && (
                <div className="space-y-2">
                  <Label htmlFor="nama_lembaga" className="text-slate-700 font-semibold">
                    Nama {pemohon.tipe_pemohon === 'instansi' ? 'Instansi' : pemohon.tipe_pemohon === 'komunitas' ? 'Komunitas' : 'Lembaga'} <span className="text-red-500">*</span>
                  </Label>
                  <Input id="nama_lembaga" name="nama_lembaga" value={pemohon.nama_lembaga} onChange={handlePemohonChange}
                    placeholder={`Nama resmi ${pemohon.tipe_pemohon}`} className="h-11" />
                  {errors.nama_lembaga && <p className="text-red-500 text-xs">{errors.nama_lembaga}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-slate-700 font-semibold">Nomor WhatsApp <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="whatsapp" name="whatsapp" value={pemohon.whatsapp} onChange={handlePemohonChange} placeholder="08123456789" className="pl-9 h-11" />
                  </div>
                  {errors.whatsapp && <p className="text-red-500 text-xs">{errors.whatsapp}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold">Alamat Email <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="email" name="email" type="email" value={pemohon.email} onChange={handlePemohonChange} placeholder="email@domain.com" className="pl-9 h-11" />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>
              </div>

              {/* Alamat */}
              <div className="space-y-2">
                <Label htmlFor="alamat" className="text-slate-700 font-semibold">Alamat Lengkap <span className="text-red-500">*</span></Label>
                <textarea
                  id="alamat" name="alamat" value={pemohon.alamat} onChange={handlePemohonChange}
                  placeholder="Alamat lengkap pemohon / lembaga"
                  className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
                />
                {errors.alamat && <p className="text-red-500 text-xs">{errors.alamat}</p>}
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl font-semibold">
                  Lanjut: Data Event <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== STEP 2: DATA EVENT ==================== */}
        {step === 2 && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-xl" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" /> Data Event & Fasilitas</CardTitle>
              <CardDescription>Detail kegiatan yang akan diselenggarakan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nama Event */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nama_event" className="text-slate-700 font-semibold">Nama Event / Kegiatan <span className="text-red-500">*</span></Label>
                  <Input id="nama_event" name="nama_event" value={event.nama_event} onChange={handleEventChange} placeholder="Contoh: Seminar Nasional Teknologi 2026" className="h-11" />
                  {errors.nama_event && <p className="text-red-500 text-xs">{errors.nama_event}</p>}
                </div>

                {/* Jenis Event */}
                <div className="space-y-2">
                  <Label htmlFor="jenis_event" className="text-slate-700 font-semibold">Jenis Event <span className="text-red-500">*</span></Label>
                  <select id="jenis_event" name="jenis_event" value={event.jenis_event} onChange={handleEventChange}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <option value="">-- Pilih Jenis Event --</option>
                    {jenisEventOptions.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                  {errors.jenis_event && <p className="text-red-500 text-xs">{errors.jenis_event}</p>}
                </div>

                {/* Estimasi Peserta */}
                <div className="space-y-2">
                  <Label htmlFor="estimasi_peserta" className="text-slate-700 font-semibold">Estimasi Peserta <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input id="estimasi_peserta" name="estimasi_peserta" type="number" min="1" value={event.estimasi_peserta} onChange={handleEventChange} placeholder="Jumlah peserta" className="pl-9 h-11" />
                  </div>
                  {errors.estimasi_peserta && <p className="text-red-500 text-xs">{errors.estimasi_peserta}</p>}
                </div>
              </div>

              {/* Tujuan Peminjaman */}
              <div className="space-y-2">
                <Label htmlFor="tujuan_peminjaman" className="text-slate-700 font-semibold">Tujuan Peminjaman <span className="text-red-500">*</span></Label>
                <Input id="tujuan_peminjaman" name="tujuan_peminjaman" value={event.tujuan_peminjaman} onChange={handleEventChange} placeholder="Tujuan utama kegiatan ini" className="h-11" />
                {errors.tujuan_peminjaman && <p className="text-red-500 text-xs">{errors.tujuan_peminjaman}</p>}
              </div>

              {/* Deskripsi Kegiatan */}
              <div className="space-y-2">
                <Label htmlFor="deskripsi_kegiatan" className="text-slate-700 font-semibold">Deskripsi Kegiatan <span className="text-red-500">*</span></Label>
                <textarea
                  id="deskripsi_kegiatan" name="deskripsi_kegiatan" value={event.deskripsi_kegiatan} onChange={handleEventChange}
                  placeholder="Jelaskan secara singkat rangkaian kegiatan yang akan dilakukan..."
                  className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
                />
                {errors.deskripsi_kegiatan && <p className="text-red-500 text-xs">{errors.deskripsi_kegiatan}</p>}
              </div>

              {/* Waktu */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-4">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2"><Calendar className="h-4 w-4" /> Jadwal Pelaksanaan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tanggal_mulai" className="text-slate-700 font-semibold text-sm">Tanggal Mulai <span className="text-red-500">*</span></Label>
                    <Input id="tanggal_mulai" name="tanggal_mulai" type="date" value={event.tanggal_mulai} onChange={handleEventChange} className="h-10 bg-white" />
                    {errors.tanggal_mulai && <p className="text-red-500 text-xs">{errors.tanggal_mulai}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jam_mulai" className="text-slate-700 font-semibold text-sm">Jam Mulai <span className="text-red-500">*</span></Label>
                    <Input id="jam_mulai" name="jam_mulai" type="time" value={event.jam_mulai} onChange={handleEventChange} className="h-10 bg-white" />
                    {errors.jam_mulai && <p className="text-red-500 text-xs">{errors.jam_mulai}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tanggal_selesai" className="text-slate-700 font-semibold text-sm">Tanggal Selesai <span className="text-red-500">*</span></Label>
                    <Input id="tanggal_selesai" name="tanggal_selesai" type="date" value={event.tanggal_selesai} onChange={handleEventChange} className="h-10 bg-white" />
                    {errors.tanggal_selesai && <p className="text-red-500 text-xs">{errors.tanggal_selesai}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jam_selesai" className="text-slate-700 font-semibold text-sm">Jam Selesai <span className="text-red-500">*</span></Label>
                    <Input id="jam_selesai" name="jam_selesai" type="time" value={event.jam_selesai} onChange={handleEventChange} className="h-10 bg-white" />
                    {errors.jam_selesai && <p className="text-red-500 text-xs">{errors.jam_selesai}</p>}
                  </div>
                </div>
              </div>

              {/* Area / Fasilitas */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" /> Area / Fasilitas yang Dipinjam <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AREA_OPTIONS.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => { toggleArea(area); setErrors(e => {const n={...e}; delete n.area_fasilitas; return n}) }}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold text-left transition-all ${
                        event.area_fasilitas.includes(area)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      {event.area_fasilitas.includes(area) && <span className="mr-1">✓</span>}
                      {area}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="area_lainnya" className="text-xs text-slate-500">Area lainnya (opsional)</Label>
                  <Input id="area_lainnya" name="area_lainnya" value={event.area_lainnya} onChange={handleEventChange}
                    placeholder="Tuliskan area lain yang dibutuhkan..." className="h-9 text-sm" />
                </div>
                {errors.area_fasilitas && <p className="text-red-500 text-xs">{errors.area_fasilitas}</p>}
              </div>

              {/* Kebutuhan Tambahan */}
              <div className="space-y-2">
                <Label htmlFor="kebutuhan_tambahan" className="text-slate-700 font-semibold">Kebutuhan Tambahan</Label>
                <textarea
                  id="kebutuhan_tambahan" name="kebutuhan_tambahan" value={event.kebutuhan_tambahan} onChange={handleEventChange}
                  placeholder="Contoh: Proyektor, Sound System, Meja Registrasi, dll (opsional)"
                  className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <Button onClick={prevStep} variant="outline" className="h-12 px-6 rounded-xl">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl font-semibold">
                  Lanjut: Lampiran <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ==================== STEP 3: LAMPIRAN & KIRIM ==================== */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-green-500 rounded-t-xl" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-600" /> Lampiran & Catatan</CardTitle>
                <CardDescription>Upload dokumen pendukung (opsional, maks 10MB per file)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="surat" className="text-slate-700 font-semibold">Surat Peminjaman</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
                      <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 mb-2">PDF, JPG, PNG, DOC, DOCX</p>
                      <input id="surat" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => handleFileChange(e, 'surat')}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                      {suratFile && <p className="text-xs text-green-600 mt-2 font-medium">✓ {suratFile.name}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proposal" className="text-slate-700 font-semibold">Proposal Kegiatan</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
                      <ClipboardList className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 mb-2">PDF, JPG, PNG, DOC, DOCX</p>
                      <input id="proposal" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => handleFileChange(e, 'proposal')}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                      {proposalFile && <p className="text-xs text-green-600 mt-2 font-medium">✓ {proposalFile.name}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catatan_tambahan" className="text-slate-700 font-semibold">Catatan Tambahan</Label>
                  <textarea
                    id="catatan_tambahan" name="catatan_tambahan" value={event.catatan_tambahan} onChange={handleEventChange}
                    placeholder="Informasi lain yang ingin Anda sampaikan kepada pengelola (opsional)..."
                    className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ringkasan */}
            <Card className="shadow-lg border-0 bg-indigo-50/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-indigo-900">📋 Ringkasan Pengajuan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1 text-slate-700">
                <p><span className="font-semibold">Pemohon:</span> {pemohon.nama_pemohon} {pemohon.nama_lembaga ? `(${pemohon.nama_lembaga})` : ''}</p>
                <p><span className="font-semibold">Event:</span> {event.nama_event} — {event.jenis_event}</p>
                <p><span className="font-semibold">Waktu:</span> {event.tanggal_mulai} {event.jam_mulai} s/d {event.tanggal_selesai} {event.jam_selesai}</p>
                <p><span className="font-semibold">Area:</span> {[...event.area_fasilitas, ...(event.area_lainnya ? [event.area_lainnya] : [])].join(', ') || '-'}</p>
                <p><span className="font-semibold">Estimasi Peserta:</span> {event.estimasi_peserta} orang</p>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={prevStep} variant="outline" className="h-12 px-6 rounded-xl">
                <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="h-12 px-10 rounded-xl font-bold text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl shadow-green-200 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Mengirim...</span>
                ) : (
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Kirim Pengajuan</span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-slate-500">
        Sudah punya nomor pengajuan?{" "}
        <Link href="/cek-status" className="text-indigo-600 hover:underline font-semibold">Cek Status Pengajuan</Link>
      </div>

      <CustomDialog isOpen={dialogState.isOpen} type={dialogState.type} title={dialogState.title} message={dialogState.message} onCancel={closeDialog} onConfirm={closeDialog} />
    </div>
  )
}
