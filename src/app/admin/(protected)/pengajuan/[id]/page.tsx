"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"
import Link from "next/link"
import { 
  Calendar, Clock, MapPin, User, Building, Phone, Mail, 
  FileText, CheckCircle, XCircle, AlertCircle, Shield, 
  ArrowLeft, ExternalLink, FileDown, Send, Edit3, Lock, Award, ShieldCheck, Loader2, UploadCloud
} from "lucide-react"
import { useRouter } from "next/navigation"
import { 
  sendWhatsAppNotification, 
  tplPengajuanDisetujui, 
  tplPengajuanDitolak, 
  tplPengajuanRevisi, 
  tplNotifikasiApprover 
} from "@/app/actions/notification"

type Pengajuan = {
  id: string
  nomor_pengajuan: string
  status: 'draft' | 'submitted' | 'under_review' | 'revision_requested' | 'approved' | 'rejected' | 'cancelled'
  tipe_pemohon: 'pribadi' | 'lembaga' | 'komunitas' | 'instansi'
  nama_pemohon: string
  nama_lembaga: string | null
  whatsapp: string
  email: string
  alamat: string
  nama_event: string
  jenis_event: string
  tujuan_peminjaman: string
  deskripsi_kegiatan: string
  estimasi_peserta: number
  tanggal_mulai: string
  tanggal_selesai: string
  area_fasilitas: string[]
  kebutuhan_tambahan: string | null
  url_surat_peminjaman: string | null
  url_proposal: string | null
  url_flyer?: string | null
  catatan_tambahan: string | null
  catatan_admin: string | null
  privacy_event: 'detail_publik' | 'umum_saja' | 'rahasia' | 'publik_terbatas'
  reviewed_by: string | null
  reviewed_at: string | null
  current_approval_level: number
  created_at: string
  nama_ustadz?: string
  judul_kajian?: string
}

type TimelineItem = {
  id: string
  status_lama: string | null
  status_baru: string
  catatan: string | null
  dibuat_oleh_nama: string | null
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText },
  submitted: { label: "Submitted", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  under_review: { label: "Dalam Review", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  revision_requested: { label: "Butuh Revisi", color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle },
  approved: { label: "Disetujui", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Ditolak", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  cancelled: { label: "Dibatalkan", color: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
    hour12: false
  }).format(d).replace(/\./g, ':')
}

const generateUniqueSlug = (title: string) => {
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  return `${baseSlug}-${randomSuffix}`
}

export default function AdminPengajuanDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createClient()
  const router = useRouter()

  const [pengajuan, setPengajuan] = useState<Pengajuan | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)

  // Workflow states
  const [isApprover, setIsApprover] = useState(false)
  const [currentStep, setCurrentStep] = useState<any>(null)
  const [allWorkflowSteps, setAllWorkflowSteps] = useState<any[]>([])
  const [approvalsList, setApprovalsList] = useState<any[]>([])

  // Internal notes and privacy states
  const [catatanAdmin, setCatatanAdmin] = useState("")
  const [privacyEvent, setPrivacyEvent] = useState<'detail_publik' | 'umum_saja' | 'rahasia'>("umum_saja")

  // Modal / Dialog states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean; type: DialogType; title: string; message: string; action: () => void;
  }>({ isOpen: false, type: 'alert', title: '', message: '', action: () => {} })

  // Custom reason for Rejection or Revision
  const [showReasonInput, setShowReasonInput] = useState(false)
  const [targetStatus, setTargetStatus] = useState<string>("")
  const [statusReason, setStatusReason] = useState("")

  // Inline edit states
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [isEditingTujuan, setIsEditingTujuan] = useState(false)
  const [editTujuanVal, setEditTujuanVal] = useState("")
  const [isEditingKajian, setIsEditingKajian] = useState(false)
  const [editUstadzVal, setEditUstadzVal] = useState("")
  const [editJudulVal, setEditJudulVal] = useState("")
  const [editNamaEventVal, setEditNamaEventVal] = useState("")

  // Edit states for Informasi Pemohon
  const [isEditingPemohon, setIsEditingPemohon] = useState(false)
  const [editPemohon, setEditPemohon] = useState<Partial<Pengajuan>>({})

  // Edit states for Rincian Event
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [editEvent, setEditEvent] = useState<Partial<Pengajuan>>({})

  // Edit states for Jadwal Pelaksanaan
  const [isEditingJadwal, setIsEditingJadwal] = useState(false)
  const [editJadwal, setEditJadwal] = useState<{tanggal_mulai: string, tanggal_selesai: string}>({tanggal_mulai: "", tanggal_selesai: ""})

  // Format utility for datetime-local
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


  useEffect(() => {
    fetchUserAndData()
  }, [id])

  const fetchUserAndData = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      // Get current logged-in user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      let prof = null
      if (user) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()
        prof = profileData
        setCurrentUserProfile(profileData)
      }

      // Validasi id harus berupa UUID, jika tidak, tampilkan error atau anggap tidak ditemukan
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        setLoading(false);
        setErrorMsg("ID pengajuan tidak valid. Pastikan tautan yang Anda buka benar.");
        return;
      }

      // Get Application Detail
      const { data: pData, error: pError } = await supabase
        .from("pengajuan_peminjaman")
        .select("*")
        .eq("id", id)
        .single()

      if (pError) throw pError
      setPengajuan(pData as Pengajuan)
      setCatatanAdmin(pData.catatan_admin || "")
      setPrivacyEvent(pData.privacy_event || "umum_saja")

      // Get Timeline List
      const { data: tData, error: tError } = await supabase
        .from("pengajuan_timeline")
        .select("*")
        .eq("pengajuan_id", id)
        .order("created_at", { ascending: false })

      if (tError) throw tError
      setTimeline(tData || [])

      // Get Approvals List
      const { data: appData } = await supabase
        .from("pengajuan_approvals")
        .select("*")
        .eq("pengajuan_id", id)
        .order("workflow_level", { ascending: true })
      setApprovalsList(appData || [])

      // Fetch Event Type details to resolve workflow steps
      const { data: jEvent } = await supabase
        .from("jenis_event")
        .select("*")
        .eq("name", pData.jenis_event)
        .maybeSingle()

      let steps: any[] = []
      if (jEvent) {
        const { data: stepsData } = await supabase
          .from("workflow_approval")
          .select("*")
          .eq("jenis_event_id", jEvent.id)
          .eq("is_active", true)
          .order("level", { ascending: true })
        steps = stepsData || []
      }
      setAllWorkflowSteps(steps)

      // Calculate if current user can approve
      const isSuperAdmin = prof?.system_role === 'super_admin' || user?.email === 'officialsiyoyok@gmail.com' || user?.email === 'yahya@example.com'
      setIsSuperAdminUser(isSuperAdmin)
      let approverCheck = false
      let stepFound = null

      if (isSuperAdmin) {
        approverCheck = true
        if (pData.current_approval_level && steps.length > 0) {
          stepFound = steps.find(s => s.level === pData.current_approval_level)
        }
      } else if (pData.current_approval_level && steps.length > 0) {
        const currentStepObj = steps.find(s => s.level === pData.current_approval_level)
        if (currentStepObj) {
          stepFound = currentStepObj
          const matchesJabatan = prof?.jabatan && prof.jabatan.trim().toLowerCase() === currentStepObj.jabatan.trim().toLowerCase()
          const matchesUserId = !currentStepObj.user_id || currentStepObj.user_id === user.id
          if (matchesJabatan && matchesUserId) {
            approverCheck = true
          }
        }
      } else if (steps.length === 0 && !['approved', 'rejected', 'cancelled'].includes(pData.status)) {
        // Fallback: If no workflow steps are defined, any approved admin can approve
        approverCheck = true
      }

      setIsApprover(approverCheck)
      setCurrentStep(stepFound)

    } catch (err: any) {
      console.error(err)
      setErrorMsg("Gagal mengambil rincian data pengajuan: " + (err.message || err.toString()))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!pengajuan) return
    setUpdating(true)
    try {
      const { error } = await supabase
        .from("pengajuan_peminjaman")
        .update({
          catatan_admin: catatanAdmin.trim() || null,
          privacy_event: privacyEvent
        })
        .eq("id", pengajuan.id)

      if (error) throw error

      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Sukses',
        message: 'Catatan internal dan pengaturan privasi berhasil disimpan.',
        action: () => {}
      })
      
      // Update local state
      setPengajuan(prev => prev ? { ...prev, catatan_admin: catatanAdmin.trim() || null, privacy_event: privacyEvent } : null)

    } catch (err: any) {
      console.error(err)
      setDialogState({
        isOpen: true,
        type: 'error',
        title: 'Simpan Gagal',
        message: err.message || 'Terjadi kesalahan saat menyimpan catatan.',
        action: () => {}
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveTujuan = async () => {
    if (!pengajuan) return
    setUpdating(true)
    try {
      const { error } = await supabase
        .from("pengajuan_peminjaman")
        .update({ tujuan_peminjaman: editTujuanVal })
        .eq("id", pengajuan.id)

      if (error) throw error
      
      setPengajuan(prev => prev ? { ...prev, tujuan_peminjaman: editTujuanVal } : null)
      setIsEditingTujuan(false)
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Berhasil',
        message: 'Tujuan peminjaman berhasil diperbarui.',
        action: () => {}
      })
    } catch (err: any) {
      console.error(err)
      setDialogState({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: err.message || 'Gagal menyimpan perubahan.',
        action: () => {}
      })
    } finally {
      setUpdating(false)
    }
  }

  const updateField = async (field: keyof Pengajuan, value: any) => {
    if (!pengajuan) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("pengajuan_peminjaman")
        .update({ [field]: value })
        .eq("id", pengajuan.id);

      if (error) throw error;
      setPengajuan(prev => prev ? { ...prev, [field]: value } : null);
      
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Berhasil',
        message: `Detail ${field.replace('_', ' ')} berhasil diperbarui.`,
        action: () => {}
      });
    } catch (err: any) {
      console.error(err);
      setDialogState({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: err.message || 'Gagal menyimpan perubahan.',
        action: () => {}
      });
    } finally {
      setUpdating(false);
    }
  }

  const triggerStatusChange = (newStatus: string, requireReason = false) => {
    setTargetStatus(newStatus)
    setStatusReason("")
    if (requireReason) {
      setShowReasonInput(true)
    } else {
      let actionVerb = "menyetujui"
      if (newStatus === "under_review") actionVerb = "memproses"
      if (newStatus === "cancelled") actionVerb = "membatalkan"

      setDialogState({
        isOpen: true,
        type: 'confirm',
        title: 'Konfirmasi Persetujuan',
        message: `Apakah Anda yakin ingin menyetujui (Approve) tingkat persetujuan saat ini?`,
        action: () => executeStatusChange(newStatus, "")
      })
    }
  }

  const executeStatusChange = async (status: string, reasonText: string) => {
    if (!pengajuan || !currentUser) return
    setUpdating(true)
    try {
      const emailAdmin = currentUser.email || 'Admin'
      const nameAdmin = currentUserProfile?.full_name || emailAdmin
      const roleAdmin = currentUserProfile?.system_role === 'super_admin' ? 'Superadmin' : (currentUserProfile?.jabatan || 'Admin')
      
      const currentLvl = pengajuan.current_approval_level || 1

      // 1. Record the decision in pengajuan_approvals
      if (['approved', 'rejected', 'revision_requested'].includes(status)) {
        const { error: appError } = await supabase
          .from("pengajuan_approvals")
          .insert({
            pengajuan_id: pengajuan.id,
            workflow_level: currentLvl,
            status: status,
            catatan: reasonText.trim() || null,
            approver_id: currentUser.id,
            approver_nama: nameAdmin,
            approver_jabatan: roleAdmin
          })
        if (appError) throw appError
      }

      let nextStatus = status
      let nextLevelVal: number | null = currentLvl
      let timelineCatatan = reasonText.trim()

      if (status === 'approved') {
        // Find if there is a next level in workflow steps
        const nextStepObj = allWorkflowSteps.find(s => s.level > currentLvl)
        
        if (nextStepObj) {
          nextStatus = 'under_review'
          nextLevelVal = nextStepObj.level
          timelineCatatan = `Persetujuan Level ${currentLvl} disetujui oleh ${nameAdmin} (${roleAdmin}). Menunggu persetujuan Level ${nextLevelVal} (${nextStepObj.jabatan}).`
        } else {
          // Final Level Approved!
          nextStatus = 'approved'
          nextLevelVal = null
          timelineCatatan = `Persetujuan disetujui penuh di seluruh tingkatan (Level ${currentLvl} disetujui oleh ${nameAdmin}).`
        }
      } else if (status === 'rejected') {
        nextStatus = 'rejected'
        nextLevelVal = null
        timelineCatatan = `Pengajuan ditolak pada Level ${currentLvl} oleh ${nameAdmin} (${roleAdmin}). Alasan: ${reasonText}`
      } else if (status === 'revision_requested') {
        nextStatus = 'revision_requested'
        // level stays the same, waiting for resubmission to clear it
        timelineCatatan = `Revisi berkas diminta pada Level ${currentLvl} oleh ${nameAdmin} (${roleAdmin}). Catatan: ${reasonText}`
      } else if (status === 'cancelled') {
        nextStatus = 'cancelled'
        nextLevelVal = null
        timelineCatatan = `Pengajuan dibatalkan oleh ${nameAdmin}.`
      }

      // 2. Update pengajuan_peminjaman
      const updatePayload: Record<string, any> = {
        status: nextStatus,
        current_approval_level: nextLevelVal
      }

      if (nextStatus === 'approved') {
        updatePayload.reviewed_by = currentUser.id
        updatePayload.reviewed_at = new Date().toISOString()
      }

      const { error: pError } = await supabase
        .from("pengajuan_peminjaman")
        .update(updatePayload)
        .eq("id", pengajuan.id)

      if (pError) throw pError

      // 3. Write to Timeline
      const { error: tError } = await supabase
        .from("pengajuan_timeline")
        .insert({
          pengajuan_id: pengajuan.id,
          status_lama: pengajuan.status,
          status_baru: nextStatus,
          catatan: timelineCatatan,
          dibuat_oleh: currentUser.id,
          dibuat_oleh_nama: `${nameAdmin} (${roleAdmin})`
        })

      if (tError) throw tError

      // 4. AUTOMATIC EVENT CREATION IF APPROVED FULLY
      if (nextStatus === 'approved' && pengajuan.privacy_event === 'detail_publik') {
        const slug = generateUniqueSlug(pengajuan.nama_event)
        const locationStr = pengajuan.area_fasilitas.join(", ")
        
        const { error: evtError } = await supabase
          .from("events")
          .insert({
            title: pengajuan.nama_event,
            type: pengajuan.jenis_event,
            description: pengajuan.deskripsi_kegiatan,
            location: locationStr,
            start_datetime: pengajuan.tanggal_mulai,
            end_datetime: pengajuan.tanggal_selesai,
            status: 'published',
            registration_slug: slug,
            requires_registration: false,
            user_id: currentUser.id,
            event_request_id: pengajuan.id,
            banner_url: pengajuan.url_flyer || null,
            url_flyer: pengajuan.url_flyer || null
          })
        
        if (evtError) {
          console.error("Gagal auto-create event kalender:", evtError)
          // we don't crash, but log it
        } else {
          // Log timeline for event creation
          await supabase
            .from("pengajuan_timeline")
            .insert({
              pengajuan_id: pengajuan.id,
              status_lama: 'approved',
              status_baru: 'approved',
              catatan: `Event secara otomatis diterbitkan ke Kalender Publik. Slug: /${slug}`,
              dibuat_oleh: currentUser.id,
              dibuat_oleh_nama: "Sistem Otomatisasi"
            })
        }
      }

      // Close inputs
      setShowReasonInput(false)
      
      // --- WhatsApp Notifications Hook ---
      try {
        const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        const statusUrl = `${appUrl}/cek-status?nomor=${pengajuan.nomor_pengajuan}`
        const adminUrl = `${appUrl}/admin/pengajuan/${pengajuan.id}`
        const waNumber = pengajuan.whatsapp

        if (waNumber) {
          if (nextStatus === 'approved') {
            await sendWhatsAppNotification({
              recipient_name: pengajuan.nama_pemohon,
              recipient_whatsapp: waNumber,
              message: await tplPengajuanDisetujui(pengajuan.nomor_pengajuan, pengajuan.nama_event, pengajuan.tanggal_mulai),
              related_event_request_id: pengajuan.id
            })
          } else if (nextStatus === 'rejected') {
            await sendWhatsAppNotification({
              recipient_name: pengajuan.nama_pemohon,
              recipient_whatsapp: waNumber,
              message: await tplPengajuanDitolak(pengajuan.nomor_pengajuan, pengajuan.nama_event, reasonText),
              related_event_request_id: pengajuan.id
            })
          } else if (nextStatus === 'revision_requested') {
            await sendWhatsAppNotification({
              recipient_name: pengajuan.nama_pemohon,
              recipient_whatsapp: waNumber,
              message: await tplPengajuanRevisi(pengajuan.nomor_pengajuan, pengajuan.nama_event, reasonText, statusUrl),
              related_event_request_id: pengajuan.id
            })
          }
        }
        
        if (nextStatus === 'under_review') {
          let approverPhone = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "081234567890"
          let approverName = "Approver MAKT"
          
          if (nextLevelVal) {
            try {
              const nextStep = allWorkflowSteps.find((s: any) => s.level === nextLevelVal)
              if (nextStep) {
                const { getApproverInfo } = await import('@/app/actions/notification')
                const info = await getApproverInfo(nextStep)
                approverPhone = info.approverPhone
                approverName = info.approverName
              }
            } catch (err) {
              console.error("Gagal mendapatkan WA approver:", err)
            }
          }

          // Ambil custom template dari super_admin jika ada
          let customWaMessage = ""
          try {
            const { getSuperAdminTemplate } = await import('@/app/actions/notification')
            const tpl = await getSuperAdminTemplate('request')
            
            if (tpl) {
              let tglFormat = pengajuan.tanggal_mulai || '';
              if (tglFormat) {
                try {
                  tglFormat = new Intl.DateTimeFormat('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
                  }).format(new Date(tglFormat)).replace(/\./g, ':') + ' WIB';
                } catch (e) {}
              }
              
              customWaMessage = tpl
                .replace(/{{nama_approver}}/g, approverName)
                .replace(/{{nama_event}}/g, pengajuan.nama_event)
                .replace(/{{jenis_event}}/g, pengajuan.jenis_event || '-')
                .replace(/{{tanggal_event}}/g, tglFormat)
                .replace(/{{pemohon}}/g, pengajuan.nama_pemohon)
                .replace(/{{link_approval}}/g, adminUrl)
            }
          } catch (e) {
            console.error("Gagal load custom template", e)
          }

          await sendWhatsAppNotification({
            recipient_name: approverName,
            recipient_whatsapp: approverPhone,
            message: customWaMessage || await tplNotifikasiApprover(pengajuan.nama_event, pengajuan.jenis_event, pengajuan.nama_pemohon, pengajuan.tanggal_mulai, reasonText, adminUrl, approverName),
            related_event_request_id: pengajuan.id
          })
        }
      } catch (waErr) {
        console.error("Gagal mengirim WA dari client:", waErr)
      }
      // --- End Hook ---
      
      // Re-fetch data
      await fetchUserAndData()

      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Perubahan Berhasil',
        message: `Keputusan berhasil disimpan. Status saat ini: ${STATUS_CONFIG[nextStatus as keyof typeof STATUS_CONFIG]?.label || nextStatus}`,
        action: () => {}
      })

    } catch (err: any) {
      console.error(err)
      setDialogState({
        isOpen: true,
        type: 'error',
        title: 'Perubahan Gagal',
        message: err.message || 'Gagal menyimpan persetujuan.',
        action: () => {}
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleResubmit = async () => {
    if (!pengajuan || !currentUser) return
    setUpdating(true)
    try {
      const emailAdmin = currentUser.email || 'Admin'
      const nameAdmin = currentUserProfile?.full_name || emailAdmin
      
      // 1. Delete previous approval decisions so workflow starts clean
      const { error: delError } = await supabase
        .from("pengajuan_approvals")
        .delete()
        .eq("pengajuan_id", pengajuan.id)
      
      if (delError) throw delError

      // 2. Resolve first level
      const firstLevel = allWorkflowSteps.length > 0 ? Math.min(...allWorkflowSteps.map(s => s.level)) : 1

      // 3. Update pengajuan status back to under_review
      const { error: pError } = await supabase
        .from("pengajuan_peminjaman")
        .update({
          status: 'under_review',
          current_approval_level: firstLevel
        })
        .eq("id", pengajuan.id)

      if (pError) throw pError

      // 4. Log timeline
      const { error: tError } = await supabase
        .from("pengajuan_timeline")
        .insert({
          pengajuan_id: pengajuan.id,
          status_lama: pengajuan.status,
          status_baru: 'under_review',
          catatan: "Pengajuan dikirim ulang setelah revisi. Menghapus log approval sebelumnya untuk memulai kembali dari Level 1.",
          dibuat_oleh: currentUser.id,
          dibuat_oleh_nama: nameAdmin
        })

      if (tError) throw tError

      await fetchUserAndData()

      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Kirim Ulang Berhasil',
        message: 'Pengajuan telah dikirim ulang dan workflow di-restart kembali ke Level 1.',
        action: () => {}
      })

    } catch (err: any) {
      console.error(err)
      showDialog('error', 'Gagal Kirim Ulang', err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, prefix: string) => {
    if (!e.target.files || e.target.files.length === 0 || !pengajuan) return;
    const file = e.target.files[0];
    
    setUploadingField(fieldName);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', `admin_${prefix}_${pengajuan.nomor_pengajuan}`);
      
      const { uploadFileAction } = await import('@/app/actions/upload');
      const result = await uploadFileAction(formData);
      
      if (result.error) throw new Error(result.error);
      
      const { error: dbError } = await supabase
        .from('pengajuan_peminjaman')
        .update({ [fieldName]: result.url })
        .eq('id', pengajuan.id);
        
      if (dbError) throw dbError;
      
      if (fieldName === 'url_flyer') {
        await supabase
          .from('events')
          .update({ banner_url: result.url })
          .eq('event_request_id', pengajuan.id);
      }
      
      setPengajuan(prev => prev ? { ...prev, [fieldName]: result.url } : prev);
      
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: 'Upload Berhasil',
        message: 'File telah berhasil diunggah dan disimpan ke database.',
        action: () => {}
      });
    } catch (err: any) {
      console.error(err);
      showDialog('error', 'Gagal Mengunggah', err.message);
    } finally {
      setUploadingField(null);
    }
  }

  const handleReasonSubmit = () => {
    if (!statusReason.trim()) {
      alert("Alasan/catatan wajib diisi.")
      return
    }
    executeStatusChange(targetStatus, statusReason)
  }

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }

  const getStepName = () => {
    if (currentStep) {
      return `${currentStep.jabatan} (Level ${currentStep.level})`
    }
    if (pengajuan && allWorkflowSteps.length > 0) {
      const step = allWorkflowSteps.find(s => s.level === pengajuan.current_approval_level)
      return step ? `${step.jabatan} (Level ${step.level})` : `Level ${pengajuan.current_approval_level}`
    }
    return "Admin"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (errorMsg || !pengajuan) {
    return (
      <div className="p-10">
        <Card className="border-red-100 bg-red-50 text-red-950 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-sm">{errorMsg || "Data pengajuan tidak ditemukan."}</span>
          </div>
        </Card>
      </div>
    )
  }

  const activeStatus = STATUS_CONFIG[pengajuan.status] || { label: pengajuan.status, color: "bg-slate-100 text-slate-700", icon: AlertCircle }
  const StatusIcon = activeStatus.icon
  const escalateToEventUrl = `/admin/events/new?from_pengajuan=${pengajuan.id}`

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Link href="/admin/pengajuan">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg hover:bg-indigo-50 border-slate-200">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 font-mono">#{pengajuan.nomor_pengajuan}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${activeStatus.color}`}>
                <StatusIcon className="h-3 w-3" />
                {activeStatus.label}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5 truncate max-w-[300px] sm:max-w-[500px]">
              {pengajuan.nama_event}
            </h1>
          </div>
        </div>

        {/* Escalate button only if approved */}
        {pengajuan.status === 'approved' && (
          <Link href={escalateToEventUrl}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-semibold text-xs sm:text-sm gap-2">
              <ExternalLink className="h-4 w-4" /> Teruskan ke MAKT Event
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Data Pemohon */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-indigo-500" />
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-950">
                  <User className="h-4.5 w-4.5 text-indigo-600" /> Informasi Pemohon
                </CardTitle>
                <CardDescription className="text-xs mt-1">Informasi identitas penanggungjawab peminjam</CardDescription>
              </div>
              {isSuperAdminUser && !isEditingPemohon && (
                <Button size="sm" variant="outline" className="h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => {
                  setEditPemohon({
                    nama_pemohon: pengajuan.nama_pemohon,
                    tipe_pemohon: pengajuan.tipe_pemohon,
                    nama_lembaga: pengajuan.nama_lembaga,
                    whatsapp: pengajuan.whatsapp,
                    email: pengajuan.email,
                    alamat: pengajuan.alamat
                  })
                  setIsEditingPemohon(true)
                }}>
                  <Edit3 className="h-3 w-3 mr-1" /> Edit Data
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
              {isEditingPemohon ? (
                <div className="col-span-1 sm:col-span-2 space-y-4 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nama Pemohon</Label>
                      <Input value={editPemohon.nama_pemohon || ''} onChange={e => setEditPemohon({...editPemohon, nama_pemohon: e.target.value})} className="h-9 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tipe Pemohon</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" 
                        value={editPemohon.tipe_pemohon || ''} 
                        onChange={e => setEditPemohon({...editPemohon, tipe_pemohon: e.target.value as any})}
                      >
                        <option value="pribadi">Pribadi</option>
                        <option value="lembaga">Lembaga</option>
                        <option value="komunitas">Komunitas</option>
                        <option value="instansi">Instansi</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nama Lembaga / Instansi</Label>
                      <Input value={editPemohon.nama_lembaga || ''} onChange={e => setEditPemohon({...editPemohon, nama_lembaga: e.target.value})} className="h-9 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nomor WhatsApp</Label>
                      <Input value={editPemohon.whatsapp || ''} onChange={e => setEditPemohon({...editPemohon, whatsapp: e.target.value})} className="h-9 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Alamat Email</Label>
                      <Input type="email" value={editPemohon.email || ''} onChange={e => setEditPemohon({...editPemohon, email: e.target.value})} className="h-9 bg-white" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Alamat Lengkap</Label>
                      <textarea value={editPemohon.alamat || ''} onChange={e => setEditPemohon({...editPemohon, alamat: e.target.value})} className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingPemohon(false)} disabled={updating}>Batal</Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updating} onClick={async () => {
                      setUpdating(true)
                      try {
                        const { error } = await supabase.from("pengajuan_peminjaman").update(editPemohon).eq("id", pengajuan.id)
                        if (error) throw error
                        setPengajuan({...pengajuan, ...editPemohon} as Pengajuan)
                        setIsEditingPemohon(false)
                      } catch (err: any) {
                        alert("Gagal menyimpan: " + err.message)
                      } finally {
                        setUpdating(false)
                      }
                    }}>
                      {updating ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Nama Pemohon</span>
                    <span className="font-semibold text-slate-800 capitalize">{pengajuan.nama_pemohon}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Tipe Pemohon</span>
                    <span className="font-semibold text-slate-800 capitalize">{pengajuan.tipe_pemohon}</span>
                  </div>
                  {pengajuan.nama_lembaga && (
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs text-slate-400 font-semibold block uppercase">Nama Lembaga / Instansi</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-slate-400" />
                        {pengajuan.nama_lembaga}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Nomor WhatsApp</span>
                    <a 
                      href={`https://wa.me/${(pengajuan.whatsapp || '').replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {pengajuan.whatsapp}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Alamat Email</span>
                    <a 
                      href={`mailto:${pengajuan.email}`} 
                      className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {pengajuan.email}
                    </a>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Alamat Lengkap</span>
                    <span className="font-medium text-slate-700 block bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {pengajuan.alamat}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Data Event */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-950">
                  <Calendar className="h-4.5 w-4.5 text-blue-600" /> Rincian Event & Fasilitas
                </CardTitle>
                <CardDescription className="text-xs mt-1">Informasi lengkap agenda dan fasilitas yang dipinjam</CardDescription>
              </div>
              {isSuperAdminUser && !isEditingEvent && (
                <Button size="sm" variant="outline" className="h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => {
                  setEditEvent({
                    nama_event: pengajuan.nama_event,
                    jenis_event: pengajuan.jenis_event,
                    estimasi_peserta: pengajuan.estimasi_peserta,
                    deskripsi_kegiatan: pengajuan.deskripsi_kegiatan
                  })
                  setIsEditingEvent(true)
                }}>
                  <Edit3 className="h-3 w-3 mr-1" /> Edit Event
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4 pt-2 text-sm">
              {isEditingEvent ? (
                <div className="space-y-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nama Event</Label>
                      <Input value={editEvent.nama_event || ''} onChange={e => setEditEvent({...editEvent, nama_event: e.target.value})} className="h-9 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Jenis Event</Label>
                      <Input value={editEvent.jenis_event || ''} onChange={e => setEditEvent({...editEvent, jenis_event: e.target.value})} className="h-9 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estimasi Peserta</Label>
                      <Input type="number" value={editEvent.estimasi_peserta || 0} onChange={e => setEditEvent({...editEvent, estimasi_peserta: parseInt(e.target.value) || 0})} className="h-9 bg-white" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Deskripsi Kegiatan</Label>
                      <textarea value={editEvent.deskripsi_kegiatan || ''} onChange={e => setEditEvent({...editEvent, deskripsi_kegiatan: e.target.value})} className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingEvent(false)} disabled={updating}>Batal</Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updating} onClick={async () => {
                      setUpdating(true)
                      try {
                        const { error } = await supabase.from("pengajuan_peminjaman").update(editEvent).eq("id", pengajuan.id)
                        if (error) throw error
                        setPengajuan({...pengajuan, ...editEvent} as Pengajuan)
                        setIsEditingEvent(false)
                      } catch (err: any) {
                        alert("Gagal menyimpan: " + err.message)
                      } finally {
                        setUpdating(false)
                      }
                    }}>
                      {updating ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Nama Event</span>
                    <span className="font-bold text-slate-800 capitalize">{pengajuan.nama_event}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Jenis Event</span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs inline-block mt-0.5">{pengajuan.jenis_event}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Estimasi Peserta</span>
                    <span className="font-semibold text-slate-800">{pengajuan.estimasi_peserta} Orang</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Waktu Pengajuan Dibuat</span>
                    <span className="font-semibold text-slate-800">{formatDate(pengajuan.created_at)}</span>
                  </div>
                </div>
              )}

              {/* Detail Khusus Kajian/Tabligh Akbar */}
              {(pengajuan.jenis_event.toLowerCase().includes('kajian') || pengajuan.jenis_event.toLowerCase().includes('tabligh') || pengajuan.nama_ustadz || pengajuan.judul_kajian) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-bold text-slate-800">Detail Kajian / Pemateri</h4>
                    {pengajuan.nama_ustadz && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-amber-200">
                        🌟 Spesial Tamu
                      </span>
                    )}
                    {isSuperAdminUser && !isEditingKajian && (
                      <button 
                        onClick={() => {
                          setEditNamaEventVal(pengajuan.nama_event || "")
                          setEditUstadzVal(pengajuan.nama_ustadz || "")
                          setEditJudulVal(pengajuan.judul_kajian || "")
                          setIsEditingKajian(true)
                        }} 
                        className="text-xs text-indigo-600 hover:underline ml-auto"
                      >
                        Edit Detail
                      </button>
                    )}
                  </div>
                  
                  {isEditingKajian ? (
                    <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200/60 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nama Event (Judul Utama)</Label>
                        <Input 
                          value={editNamaEventVal} 
                          onChange={(e) => setEditNamaEventVal(e.target.value)} 
                          placeholder="Masukkan nama event utama..."
                          className="h-9 bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nama Ustadz / Pemateri</Label>
                        <Input 
                          value={editUstadzVal} 
                          onChange={(e) => setEditUstadzVal(e.target.value)} 
                          placeholder="Masukkan nama ustadz..."
                          className="h-9 bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Judul Kajian / Tema</Label>
                        <Input 
                          value={editJudulVal} 
                          onChange={(e) => setEditJudulVal(e.target.value)} 
                          placeholder="Masukkan judul kajian..."
                          className="h-9 bg-white"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button 
                          variant="ghost" size="sm" 
                          onClick={() => setIsEditingKajian(false)}
                          disabled={updating}
                        >
                          Batal
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={async () => {
                            await updateField("nama_event", editNamaEventVal)
                            await updateField("nama_ustadz", editUstadzVal)
                            await updateField("judul_kajian", editJudulVal)
                            setIsEditingKajian(false)
                          }}
                          disabled={updating}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          {updating ? "Menyimpan..." : "Simpan Perubahan"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/30 p-3 rounded-lg border border-amber-100/50">
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold block uppercase">Nama Ustadz / Pemateri</span>
                        <span className="font-bold text-slate-800 capitalize">{pengajuan.nama_ustadz || <em className="text-slate-400 font-normal">Belum diisi</em>}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold block uppercase">Judul Kajian / Tema</span>
                        <span className="font-semibold text-slate-700 italic">{pengajuan.judul_kajian || <em className="text-slate-400 font-normal">Belum diisi</em>}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Jadwal Pelaksanaan */}
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-blue-900">Jadwal Pelaksanaan</span>
                  {isSuperAdminUser && !isEditingJadwal && (
                    <button 
                      onClick={() => {
                        setEditJadwal({
                          tanggal_mulai: toDatetimeLocal(pengajuan.tanggal_mulai),
                          tanggal_selesai: toDatetimeLocal(pengajuan.tanggal_selesai)
                        })
                        setIsEditingJadwal(true)
                      }} 
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" /> Edit Jadwal
                    </button>
                  )}
                </div>

                {isEditingJadwal ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">Mulai Kegiatan</Label>
                        <Input 
                          type="datetime-local" 
                          value={editJadwal.tanggal_mulai} 
                          onChange={e => setEditJadwal({...editJadwal, tanggal_mulai: e.target.value})}
                          className="h-9 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600">Selesai Kegiatan</Label>
                        <Input 
                          type="datetime-local" 
                          value={editJadwal.tanggal_selesai} 
                          onChange={e => setEditJadwal({...editJadwal, tanggal_selesai: e.target.value})}
                          className="h-9 bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingJadwal(false)} disabled={updating}>Batal</Button>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updating} onClick={async () => {
                        setUpdating(true)
                        try {
                          const isoMulai = new Date(editJadwal.tanggal_mulai).toISOString()
                          const isoSelesai = new Date(editJadwal.tanggal_selesai).toISOString()
                          const { error } = await supabase.from("pengajuan_peminjaman").update({
                            tanggal_mulai: isoMulai,
                            tanggal_selesai: isoSelesai
                          }).eq("id", pengajuan.id)
                          if (error) throw error
                          setPengajuan({...pengajuan, tanggal_mulai: isoMulai, tanggal_selesai: isoSelesai} as Pengajuan)
                          setIsEditingJadwal(false)
                        } catch (err: any) {
                          alert("Gagal menyimpan jadwal: " + err.message)
                        } finally {
                          setUpdating(false)
                        }
                      }}>
                        {updating ? "Menyimpan..." : "Simpan Jadwal"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-blue-900 uppercase">Mulai Kegiatan</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        {formatDate(pengajuan.tanggal_mulai)}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-blue-900 uppercase">Selesai Kegiatan</span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        {formatDate(pengajuan.tanggal_selesai)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1 group">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Tujuan Peminjaman</span>
                {isEditingTujuan ? (
                  <div className="flex gap-2 items-start mt-1">
                    <textarea 
                      className="w-full text-sm p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]" 
                      value={editTujuanVal} 
                      onChange={(e) => setEditTujuanVal(e.target.value)} 
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={handleSaveTujuan} disabled={updating} className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-[10px]">Simpan</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingTujuan(false)} className="h-7 text-[10px]">Batal</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <p className="text-slate-800 font-medium">{pengajuan.tujuan_peminjaman}</p>
                    {isSuperAdminUser && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => { setEditTujuanVal(pengajuan.tujuan_peminjaman); setIsEditingTujuan(true); }}
                        title="Edit Tujuan Peminjaman"
                      >
                        <Edit3 className="h-3 w-3 text-slate-400 hover:text-indigo-600" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {!isEditingEvent && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Deskripsi Kegiatan</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100/50 leading-relaxed text-xs whitespace-pre-wrap capitalize">
                    {pengajuan.deskripsi_kegiatan}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Fasilitas / Area Masjid yang Dipinjam</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(pengajuan.area_fasilitas || []).map((f, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-indigo-500" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {pengajuan.kebutuhan_tambahan && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Kebutuhan Logistik Tambahan</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100/50 text-xs font-medium whitespace-pre-wrap capitalize">
                    {pengajuan.kebutuhan_tambahan}
                  </p>
                </div>
              )}

              {pengajuan.catatan_tambahan && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Catatan Pemohon</span>
                  <p className="text-slate-600 bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-xs italic whitespace-pre-wrap capitalize">
                    "{pengajuan.catatan_tambahan}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Lampiran Dokumen */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="h-1 bg-cyan-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-950">
                <FileText className="h-4.5 w-4.5 text-cyan-600" /> Lampiran Surat & Proposal
              </CardTitle>
              <CardDescription className="text-xs">Dokumen pendukung untuk memverifikasi keabsahan kegiatan</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Surat Peminjaman */}
              <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-8 w-8 text-indigo-500/80 flex-shrink-0" />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 truncate">Surat Peminjaman</h5>
                    <p className="text-[10px] text-slate-400">
                      {pengajuan.url_surat_peminjaman ? "Tersedia" : "Tidak Dilampirkan"}
                    </p>
                  </div>
                </div>
                {pengajuan.url_surat_peminjaman ? (
                  <div className="flex gap-2">
                    <a href={pengajuan.url_surat_peminjaman} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1">
                        <FileDown className="h-3.5 w-3.5" /> Unduh
                      </Button>
                    </a>
                    {(isSuperAdminUser || currentUser?.id === pengajuan.user_id) && (
                      <div className="relative">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          onChange={(e) => handleAdminUpload(e, 'url_surat_peminjaman', 'surat')}
                          disabled={uploadingField === 'url_surat_peminjaman'}
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <Button variant="outline" size="sm" disabled={uploadingField === 'url_surat_peminjaman'} className="h-8 text-xs gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200">
                          {uploadingField === 'url_surat_peminjaman' ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                          Ganti
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (isSuperAdminUser || currentUser?.id === pengajuan.user_id) ? (
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => handleAdminUpload(e, 'url_surat_peminjaman', 'surat')}
                      disabled={uploadingField === 'url_surat_peminjaman'}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <Button variant="outline" size="sm" disabled={uploadingField === 'url_surat_peminjaman'} className="h-8 text-xs gap-1">
                      {uploadingField === 'url_surat_peminjaman' ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                      Upload
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" disabled className="h-8 text-xs">Kosong</Button>
                )}
              </div>

              {/* Proposal Kegiatan */}
              <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-8 w-8 text-cyan-500/80 flex-shrink-0" />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 truncate">Proposal Kegiatan</h5>
                    <p className="text-[10px] text-slate-400">
                      {pengajuan.url_proposal ? "Tersedia" : "Tidak Dilampirkan"}
                    </p>
                  </div>
                </div>
                {pengajuan.url_proposal ? (
                  <div className="flex gap-2">
                    <a href={pengajuan.url_proposal} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1">
                        <FileDown className="h-3.5 w-3.5" /> Unduh
                      </Button>
                    </a>
                    {(isSuperAdminUser || currentUser?.id === pengajuan.user_id) && (
                      <div className="relative">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          onChange={(e) => handleAdminUpload(e, 'url_proposal', 'proposal')}
                          disabled={uploadingField === 'url_proposal'}
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <Button variant="outline" size="sm" disabled={uploadingField === 'url_proposal'} className="h-8 text-xs gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200">
                          {uploadingField === 'url_proposal' ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                          Ganti
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (isSuperAdminUser || currentUser?.id === pengajuan.user_id) ? (
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => handleAdminUpload(e, 'url_proposal', 'proposal')}
                      disabled={uploadingField === 'url_proposal'}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <Button variant="outline" size="sm" disabled={uploadingField === 'url_proposal'} className="h-8 text-xs gap-1">
                      {uploadingField === 'url_proposal' ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                      Upload
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" disabled className="h-8 text-xs">Kosong</Button>
                )}
              </div>

              {/* Flyer Kegiatan */}
              <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-8 w-8 text-emerald-500/80 flex-shrink-0" />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 truncate">Flyer / Poster</h5>
                    <p className="text-[10px] text-slate-400">
                      {pengajuan.url_flyer ? "Tersedia" : "Tidak Dilampirkan"}
                    </p>
                  </div>
                </div>
                {pengajuan.url_flyer ? (
                  <div className="flex gap-2">
                    <a href={pengajuan.url_flyer} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1 text-emerald-700 hover:text-emerald-800 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                        <ExternalLink className="h-3.5 w-3.5" /> Lihat Flyer
                      </Button>
                    </a>
                    {(isSuperAdminUser || currentUser?.id === pengajuan.user_id) && (
                      <div className="relative">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          onChange={(e) => handleAdminUpload(e, 'url_flyer', 'flyer')}
                          disabled={uploadingField === 'url_flyer'}
                          accept=".png,.jpg,.jpeg,.pdf"
                        />
                        <Button variant="outline" size="sm" disabled={uploadingField === 'url_flyer'} className="h-8 text-xs gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200">
                          {uploadingField === 'url_flyer' ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                          Ganti
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (isSuperAdminUser || currentUser?.id === pengajuan.user_id) ? (
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => handleAdminUpload(e, 'url_flyer', 'flyer')}
                      disabled={uploadingField === 'url_flyer'}
                      accept=".png,.jpg,.jpeg,.pdf"
                    />
                    <Button variant="outline" size="sm" disabled={uploadingField === 'url_flyer'} className="h-8 text-xs gap-1">
                      {uploadingField === 'url_flyer' ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadCloud className="h-3 w-3" />}
                      Upload
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" disabled className="h-8 text-xs">Kosong</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Actions & Timeline) */}
        <div className="space-y-6">
          
          {/* Card 4: Action Workflow */}
          <Card className="border border-indigo-200/80 shadow-md bg-white overflow-hidden">
            <CardHeader className="bg-indigo-50/40 border-b border-indigo-100 pb-3">
              <CardTitle className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                <Edit3 className="h-4 w-4 text-indigo-600" /> Aksi Workflow Pengajuan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status Saat Ini:</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${activeStatus.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {activeStatus.label}
                </span>
                {['submitted', 'under_review', 'revision_requested'].includes(pengajuan.status) && allWorkflowSteps.length > 0 && (
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">
                    Urutan Aktif: <span className="text-indigo-600">Level {pengajuan.current_approval_level} - {getStepName()}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons based on status & isApprover check */}
              <div className="flex flex-col gap-2 pt-2">
                {isApprover && !['approved', 'rejected', 'cancelled'].includes(pengajuan.status) ? (
                  <>
                    <div className="text-[10px] text-green-700 bg-green-50 border border-green-150 p-2 rounded-lg font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      Anda berwenang memproses persetujuan level ini.
                    </div>
                    
                    <Button 
                      onClick={() => triggerStatusChange('approved')} 
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700 h-10 font-bold text-xs"
                    >
                      Setujui (Approve) Level ini
                    </Button>
                    <Button 
                      onClick={() => triggerStatusChange('revision_requested', true)} 
                      disabled={updating}
                      variant="outline"
                      className="h-10 font-bold text-xs text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      Minta Revisi Dokumen
                    </Button>
                    <Button 
                      onClick={() => triggerStatusChange('rejected', true)} 
                      disabled={updating}
                      variant="destructive"
                      className="h-10 font-semibold text-xs"
                    >
                      Tolak (Reject) Pengajuan
                    </Button>
                  </>
                ) : (
                  // Not the active approver
                  !['approved', 'rejected', 'cancelled'].includes(pengajuan.status) && (
                    <div className="text-[11px] text-amber-800 bg-amber-50/50 border border-amber-100 p-3 rounded-lg flex items-start gap-1.5 font-medium">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        Menunggu persetujuan oleh jabatan: <span className="font-bold capitalize">{getStepName()}</span>.
                        <p className="text-[9px] text-slate-400 mt-1">*Hanya pengguna dengan jabatan ini yang dapat memproses.</p>
                      </div>
                    </div>
                  )
                )}

                {/* Resubmit button if status is revision_requested */}
                {pengajuan.status === 'revision_requested' && (
                  <Button 
                    onClick={handleResubmit} 
                    disabled={updating}
                    className="bg-indigo-600 hover:bg-indigo-700 h-10 font-bold text-xs text-white"
                  >
                    Ajukan Kembali setelah Revisi
                  </Button>
                )}

                {/* Cancellation button (allow cancellation of active workflows) */}
                {!['approved', 'rejected', 'cancelled'].includes(pengajuan.status) && (
                  <Button 
                    onClick={() => triggerStatusChange('cancelled')} 
                    disabled={updating}
                    variant="ghost"
                    className="h-9 font-medium text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    Batalkan Pengajuan
                  </Button>
                )}

                {['rejected', 'cancelled'].includes(pengajuan.status) && (
                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center text-xs font-semibold text-slate-500 italic flex items-center justify-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Proses Pengajuan Telah Selesai
                  </div>
                )}

                {pengajuan.status === 'approved' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center text-xs font-semibold text-slate-500 italic flex items-center justify-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Pengajuan Telah Disetujui
                    </div>
                    <Button 
                      onClick={() => triggerStatusChange('cancelled')} 
                      disabled={updating}
                      variant="outline"
                      className="w-full h-9 font-bold text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Batalkan Persetujuan & Event
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reason Input Modal (Inline overlay for Rejection / Revision reason) */}
          {showReasonInput && (
            <Card className="border border-orange-300 shadow-lg bg-orange-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Tulis Catatan / Alasan {targetStatus === 'rejected' ? 'Penolakan' : 'Revisi'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <textarea
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  placeholder={`Tulis alasan ${targetStatus === 'rejected' ? 'penolakan' : 'revisi dokumen'} agar pemohon dapat mengetahuinya...`}
                  className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex justify-end gap-1.5 text-xs">
                  <Button variant="outline" size="sm" onClick={() => setShowReasonInput(false)} className="h-8 text-xs">Batal</Button>
                  <Button onClick={handleReasonSubmit} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs font-semibold text-white">Kirim & Ubah Status</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (Status & Action) */}
        <div className="space-y-6">

          {/* Card 5: Catatan Persetujuan Pejabat (Berjenjang) */}
          {approvalsList.length > 0 && (
            <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Award className="h-4.5 w-4.5 text-indigo-600" /> Catatan Persetujuan Pejabat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {approvalsList.map((app) => (
                  <div key={app.id} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{app.approver_nama} ({app.approver_jabatan})</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        app.status === 'approved' ? 'bg-green-50 text-green-700' :
                        app.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        Level {app.workflow_level}: {app.status === 'approved' ? 'Setuju' : app.status === 'rejected' ? 'Tolak' : 'Revisi'}
                      </span>
                    </div>
                    {app.catatan && <p className="text-slate-650 italic">"{app.catatan}"</p>}
                    <span className="text-[10px] text-slate-400 block">{formatDate(app.decided_at)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Card 6: Catatan Admin & Privacy */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-indigo-600" /> Catatan Admin & Privasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Privacy Setting */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600">Privacy Event Publik</Label>
                <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy_event" 
                      value="detail_publik"
                      checked={privacyEvent === 'detail_publik'}
                      onChange={() => setPrivacyEvent('detail_publik')}
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span>Detail Publik (Tampilkan di Kalender)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy_event" 
                      value="publik_terbatas"
                      checked={privacyEvent === 'publik_terbatas'}
                      onChange={() => setPrivacyEvent('publik_terbatas')}
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span>Khusus Internal (Tampil di Kalender dengan Label &quot;Internal / Undangan&quot;)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy_event" 
                      value="umum_saja"
                      checked={privacyEvent === 'umum_saja'}
                      onChange={() => setPrivacyEvent('umum_saja')}
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span>Umum Saja (Tampilkan Anonim / &quot;Ada Kegiatan di MAKT&quot;)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy_event" 
                      value="rahasia"
                      checked={privacyEvent === 'rahasia'}
                      onChange={() => setPrivacyEvent('rahasia')}
                      className="text-indigo-600 focus:ring-indigo-500" 
                    />
                    <span>Rahasia (Hanya Admin / Pengelola)</span>
                  </label>
                </div>
              </div>

              {/* Admin Catatan */}
              <div className="space-y-1.5">
                <Label htmlFor="catatan-admin" className="text-xs font-semibold text-slate-600">Catatan Internal Admin</Label>
                <textarea
                  id="catatan-admin"
                  value={catatanAdmin}
                  onChange={e => setCatatanAdmin(e.target.value)}
                  placeholder="Masukkan catatan internal untuk sesama admin (opsional)..."
                  className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <Button 
                onClick={handleSaveNotes} 
                disabled={updating}
                className="w-full bg-slate-800 hover:bg-slate-900 h-9 font-semibold text-xs text-white"
              >
                {updating ? "Menyimpan..." : "Simpan Catatan & Privasi"}
              </Button>
            </CardContent>
          </Card>

          {/* Card 7: Timeline History */}
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800">📋 Riwayat Aktivitas</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative pl-4 border-l border-slate-150 space-y-4 ml-1">
                {timeline.map((item) => {
                  const cfg = STATUS_CONFIG[item.status_baru as keyof typeof STATUS_CONFIG] || { label: item.status_baru, color: "bg-slate-100 text-slate-700" }

                  return (
                    <div key={item.id} className="relative">
                      {/* dot */}
                      <span className="absolute -left-[20.5px] top-1.5 h-3.5 w-3.5 rounded-full border border-slate-300 bg-white flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      </span>
                      <div className="text-[11px] text-slate-400 font-medium">{formatDate(item.created_at)}</div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">
                        Status: <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-slate-650 mt-1 leading-relaxed">{item.catatan || "Update status"}</p>
                      {item.dibuat_oleh_nama && (
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Oleh: {item.dibuat_oleh_nama}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

        </div>
        </div>

      <CustomDialog 
        isOpen={dialogState.isOpen} 
        type={dialogState.type} 
        title={dialogState.title} 
        message={dialogState.message} 
        onCancel={closeDialog} 
        onConfirm={() => { closeDialog(); dialogState.action(); }} 
      />
    </div>
  )
}
