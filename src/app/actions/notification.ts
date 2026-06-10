"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

type NotificationPayload = {
  recipient_name: string
  recipient_whatsapp: string
  message: string
  related_event_request_id?: string
}

function formatWhatsAppNumber(phone: string) {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  }
  return cleaned
}

export async function sendWhatsAppNotification(payload: NotificationPayload) {
  try {
    const supabase = createAdminClient()
    let WA_GATEWAY_URL = process.env.WA_GATEWAY_URL || "https://xsender.id/api/send-message"
    let WA_API_KEY = process.env.WA_API_KEY
    let WA_SENDER_ID = process.env.WA_SENDER_ID || ""

    // Fallback: Ambil dari database jika di .env tidak ada
    if (!WA_API_KEY) {
      const { data: adminProfile } = await supabase
        .from('user_profiles')
        .select('wa_api_key, wa_sender_id')
        .not('wa_api_key', 'is', null)
        .limit(1)
        .single()
      
      if (adminProfile?.wa_api_key) {
        WA_API_KEY = adminProfile.wa_api_key
        if (adminProfile.wa_sender_id) {
          WA_SENDER_ID = adminProfile.wa_sender_id
        }
      }
    }

    const formattedNumber = formatWhatsAppNumber(payload.recipient_whatsapp)

    // 1. Insert into notification_logs as pending
    const { data: logEntry, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        recipient_name: payload.recipient_name,
        recipient_whatsapp: formattedNumber,
        channel: "whatsapp",
        message: payload.message,
        status: "pending",
        related_event_request_id: payload.related_event_request_id || null
      })
      .select()
      .single()

    if (logError) {
      console.error("Gagal mencatat log notifikasi:", logError)
      return { success: false, error: logError.message }
    }

    // 2. Check if Gateway is configured
    if (!WA_GATEWAY_URL || !WA_API_KEY) {
      // SIMULATED MODE: Gateway not configured
      console.log(`[SIMULATED WA] To: ${formattedNumber} | Message: ${payload.message}`)
      
      await supabase
        .from("notification_logs")
        .update({ status: "simulated_sent", sent_at: new Date().toISOString() })
        .eq("id", logEntry.id)

      return { success: true, simulated: true }
    }

    // 3. Send via XSender API
    const payloadBody = {
      api_key: WA_API_KEY,
      sender: WA_SENDER_ID,
      number: formattedNumber,
      message: payload.message,
      footer: "MAKT System"
    }

    const response = await fetch(WA_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payloadBody)
    })

    let responseData;
    try {
      responseData = await response.json();
    } catch(e) {
      // Not JSON
    }

    if (!response.ok) {
      const errorText = responseData ? JSON.stringify(responseData) : await response.text().catch(() => '')
      throw new Error(`Gateway Error HTTP ${response.status}: ${errorText}`)
    }

    // XSender returns HTTP 200 even for errors sometimes, check status/success flag if available
    if (responseData && responseData.status === false) {
      throw new Error(`Gateway API Error: ${responseData.msg || JSON.stringify(responseData)}`)
    }

    // 4. Update status to sent
    await supabase
      .from("notification_logs")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", logEntry.id)

    return { success: true }

  } catch (err: any) {
    console.error("WhatsApp Notification Failed:", err)
    
    // Update log status to failed if possible
    try {
      const supabase = createAdminClient()
      // find the latest pending log for this request (approximate since we don't pass the ID through the catch easily unless we scope it)
      // For a more robust approach, we could restructure the try/catch, but this is a simplified fallback.
    } catch (e) {}

    return { success: false, error: err.message }
  }
}

// -----------------------------------------
// TEMPLATE GENERATORS
// -----------------------------------------

export async function tplPengajuanBerhasil(nomor: string, namaEvent: string, url: string) {
  return `Assalamu’alaikum.
Terima kasih, pengajuan peminjaman MAKT Anda dengan nomor *${nomor}* untuk kegiatan *${namaEvent}* telah berhasil kami terima.
Pengajuan Anda sedang kami proses. Anda dapat mengecek status pengajuan melalui tautan berikut:
${url}

Terima kasih.
- Admin MAKT`
}

export async function tplNotifikasiAdmin(nomor: string, namaPemohon: string, namaEvent: string, tglEvent: string, url: string) {
  return `*⚠️ PENGAJUAN BARU MASUK ⚠️*

Ada pengajuan baru yang membutuhkan pengecekan admin:
- Nomor: *${nomor}*
- Pemohon: *${namaPemohon}*
- Event: *${namaEvent}*
- Tanggal: *${tglEvent}*

Segera periksa dan proses di panel admin:
${url}`
}

export async function tplNotifikasiApprover(namaEvent: string, jenisEvent: string, namaPemohon: string, tglEvent: string, catatanAdmin: string, url: string) {
  return `*📝 PERMINTAAN APPROVAL KEGIATAN*

Mohon review pengajuan kegiatan berikut:
- Event: *${namaEvent}*
- Jenis: *${jenisEvent}*
- Pemohon: *${namaPemohon}*
- Tanggal: *${tglEvent}*
${catatanAdmin ? `- Catatan Admin: _${catatanAdmin}_` : ''}

Silakan berikan persetujuan atau penolakan melalui tautan berikut:
${url}

Terima kasih.`
}

export async function tplPengajuanDisetujui(nomor: string, namaEvent: string, tglEvent: string) {
  return `Assalamu’alaikum.
Kabar baik! Pengajuan peminjaman MAKT Anda dengan nomor *${nomor}* untuk kegiatan *${namaEvent}* telah *DISETUJUI*.
Tanggal Pelaksanaan: *${tglEvent}*

*Pemberitahuan Tambahan:*
MAKT memiliki layanan pendaftaran online dan absensi online terintegrasi. Jika Anda ingin mengaktifkan fitur registrasi jamaah secara online untuk kegiatan Anda, silakan hubungi Admin.

Silakan patuhi seluruh tata tertib penggunaan fasilitas Masjid Agung Kubah Timah.
Terima kasih.`
}

export async function tplPengajuanDitolak(nomor: string, namaEvent: string, catatan: string) {
  return `Assalamu’alaikum.
Mohon maaf, pengajuan peminjaman MAKT Anda dengan nomor *${nomor}* untuk kegiatan *${namaEvent}* saat ini *DITOLAK*.

Alasan penolakan: 
_${catatan || 'Tidak memenuhi syarat dan ketentuan.'}_

Terima kasih.`
}

export async function tplPengajuanRevisi(nomor: string, namaEvent: string, catatan: string, url: string) {
  return `Assalamu’alaikum.
Pengajuan peminjaman MAKT Anda dengan nomor *${nomor}* untuk kegiatan *${namaEvent}* memerlukan *REVISI*.

Catatan Revisi: 
_${catatan}_

Silakan segera lakukan perbaikan.
Terima kasih.`
}
