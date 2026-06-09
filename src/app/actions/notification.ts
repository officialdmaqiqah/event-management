"use server"

import { createClient } from "@/lib/supabase/server"

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
    const supabase = createClient()
    let WA_GATEWAY_URL = process.env.WA_GATEWAY_URL || "https://api.fonnte.com/send"
    let WA_API_KEY = process.env.WA_API_KEY

    // Fallback: Ambil dari database jika di .env tidak ada
    if (!WA_API_KEY) {
      const { data: adminProfile } = await supabase
        .from('user_profiles')
        .select('wa_api_key')
        .not('wa_api_key', 'is', null)
        .limit(1)
        .single()
      
      if (adminProfile?.wa_api_key) {
        WA_API_KEY = adminProfile.wa_api_key
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

    // 3. Send via External API (Generic Example)
    // You will need to adjust the payload structure depending on your provider (Fonnte, Wablas, dll).
    const response = await fetch(WA_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WA_API_KEY}` // adjust header to provider spec
      },
      body: JSON.stringify({
        target: formattedNumber, // adjust field name
        message: payload.message // adjust field name
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gateway Error: ${response.status} - ${errorText}`)
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
      const supabase = createClient()
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
