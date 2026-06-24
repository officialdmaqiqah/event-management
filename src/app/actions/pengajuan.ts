'use server'

import { createAdminClient } from "@/lib/supabase/server"
import { sendWhatsAppNotification, tplNotifikasiApprover, tplNotifikasiAdmin } from "./notification"

export async function submitRevisiAction(data: {
  nomor_pengajuan: string;
  kontak: string;
  updates: any;
  catatan_revisi: string;
}) {
  try {
    const supabaseAdmin = createAdminClient()
    const { nomor_pengajuan, kontak, updates, catatan_revisi } = data

    // 1. Verify pengajuan
    const { data: pData, error: pError } = await supabaseAdmin
      .from("pengajuan_peminjaman")
      .select("*")
      .eq("nomor_pengajuan", nomor_pengajuan.toUpperCase().trim())
      .maybeSingle()

    if (pError) throw pError
    if (!pData) throw new Error("Pengajuan tidak ditemukan")

    // Verifikasi kontak
    let formattedWA = kontak.trim().replace(/\D/g, '')
    if (formattedWA.startsWith('0')) formattedWA = '62' + formattedWA.substring(1)
    else if (formattedWA.startsWith('8')) formattedWA = '62' + formattedWA

    const waMatch = pData.whatsapp === formattedWA || pData.whatsapp === kontak.trim()
    const emailMatch = pData.email && pData.email.toLowerCase() === kontak.trim().toLowerCase()
    
    if (!waMatch && !emailMatch) {
      throw new Error("Verifikasi kontak gagal. Anda tidak memiliki akses.")
    }

    if (pData.status !== 'revision_requested') {
      throw new Error("Pengajuan ini tidak dalam status Butuh Revisi.")
    }

    // 2. Clear old approvals
    const { error: delError } = await supabaseAdmin
      .from("pengajuan_approvals")
      .delete()
      .eq("pengajuan_id", pData.id)

    if (delError) throw delError

    // 3. Get lowest workflow level
    const { data: jEvent } = await supabaseAdmin.from("jenis_event").select("id").eq("name", pData.jenis_event).maybeSingle()
    let firstLevel = 1
    let step1: any = null
    if (jEvent) {
      const { data: steps } = await supabaseAdmin
        .from("workflow_approval")
        .select("*")
        .eq("jenis_event_id", jEvent.id)
        .eq("is_active", true)
        .order("level", { ascending: true })
        .limit(1)
      if (steps && steps.length > 0) {
        firstLevel = steps[0].level
        step1 = steps[0]
      }
    }

    // 4. Update pengajuan_peminjaman
    const updatePayload = {
      ...updates,
      status: 'under_review',
      current_approval_level: firstLevel
    }

    const { error: updateError } = await supabaseAdmin
      .from("pengajuan_peminjaman")
      .update(updatePayload)
      .eq("id", pData.id)

    if (updateError) throw updateError

    // 5. Log Timeline
    const tCatatan = catatan_revisi 
      ? `Pengajuan direvisi oleh pemohon. Catatan: ${catatan_revisi}`
      : `Pengajuan direvisi oleh pemohon dan dikirim ulang ke tahap review.`
      
    const { error: tError } = await supabaseAdmin
      .from("pengajuan_timeline")
      .insert({
        pengajuan_id: pData.id,
        status_lama: pData.status,
        status_baru: 'under_review',
        catatan: tCatatan,
        dibuat_oleh_nama: "Pemohon"
      })

    if (tError) throw tError

    // 6. Send WA Notification to Admin/Approver
    const isLocal = process.env.NODE_ENV === 'development'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (isLocal ? 'http://localhost:3000' : 'https://event.kubahtimah.com')
    const adminUrl = `${appUrl}/admin/pengajuan/${pData.id}`

    let adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "081234567890" 
    let adminName = "Admin MAKT"
    let sysTemplate = null

    try {
      if (step1) {
        let q = supabaseAdmin.from('user_profiles').select('full_name, whatsapp').not('whatsapp', 'is', null).neq('whatsapp', '')
        if (step1.user_id) q = q.eq('user_id', step1.user_id)
        else if (step1.jabatan) q = q.ilike('jabatan', step1.jabatan)
        else q = q.eq('system_role', 'super_admin')

        const { data: approvers } = await q.limit(1)
        if (approvers && approvers.length > 0 && approvers[0].whatsapp) {
          adminPhone = approvers[0].whatsapp
          adminName = approvers[0].full_name || step1.jabatan || adminName
        }
      }
      
      const { data: superAdmins } = await supabaseAdmin.from('user_profiles')
        .select('full_name, whatsapp, wa_approval_request_template')
        .eq('system_role', 'super_admin')
        .limit(1)
        
      if (superAdmins && superAdmins.length > 0) {
        sysTemplate = superAdmins[0].wa_approval_request_template
        if (adminPhone === "081234567890" && superAdmins[0].whatsapp) {
          adminPhone = superAdmins[0].whatsapp
          adminName = superAdmins[0].full_name || "Super Admin"
        }
      }

      let waMessage = ""
      const tglEvent = updates.tanggal_mulai || pData.tanggal_mulai
      let tglFormat = tglEvent
      try {
        const d = new Date(tglEvent)
        tglFormat = new Intl.DateTimeFormat('id-ID', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
        }).format(d).replace(/\./g, ':') + ' WIB'
      } catch (e) {}

      if (sysTemplate) {
        waMessage = sysTemplate
          .replace(/{{nama_approver}}/g, adminName)
          .replace(/{{nama_event}}/g, updates.nama_event || pData.nama_event)
          .replace(/{{jenis_event}}/g, updates.jenis_event || pData.jenis_event || '-')
          .replace(/{{tanggal_event}}/g, tglFormat)
          .replace(/{{pemohon}}/g, pData.nama_pemohon)
          .replace(/{{link_approval}}/g, adminUrl)
      } else {
        waMessage = await tplNotifikasiApprover(
          updates.nama_event || pData.nama_event, 
          updates.jenis_event || pData.jenis_event, 
          pData.nama_pemohon, 
          tglEvent, 
          catatan_revisi, 
          adminUrl, 
          adminName
        )
      }

      // Prepend it's a revision
      waMessage = `*[UPDATE REVISI PENGAJUAN]*\n\nPemohon telah mengirimkan revisi untuk pengajuan ini.\n\n` + waMessage

      await sendWhatsAppNotification({
        recipient_name: adminName,
        recipient_whatsapp: adminPhone,
        message: waMessage,
        related_event_request_id: pData.id
      })
    } catch (err) {
      console.error("Gagal kirim WA revisi ke admin:", err)
    }

    return { success: true }
  } catch (error: any) {
    console.error("submitRevisiAction error:", error)
    return { error: error.message || "Terjadi kesalahan saat menyimpan revisi" }
  }
}
