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
    let supabase;
    try {
      supabase = createAdminClient()
    } catch (e) {
      // Fallback if service_role_key is missing
      supabase = createClient()
    }

    let WA_GATEWAY_URL = process.env.WA_GATEWAY_URL || "https://xsender.id/api/send-message"
    let WA_API_KEY = process.env.WA_API_KEY
    let WA_SENDER_ID = process.env.WA_SENDER_ID || ""

    // Fallback: Ambil dari database melalui secure RPC agar tidak terhalang RLS
    if (!WA_API_KEY) {
      const { data: config, error: configError } = await supabase.rpc('get_wa_config')
      
      if (!configError && config && config.api_key) {
        WA_API_KEY = config.api_key
        if (config.sender) {
          WA_SENDER_ID = config.sender
        }
      }
    }

    const formattedNumber = formatWhatsAppNumber(payload.recipient_whatsapp)

    // 1. Insert into notification_logs as pending
    let logEntry: any = null;
    try {
      const { data, error: logError } = await supabase
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
        
      if (!logError && data) {
        logEntry = data;
      } else if (logError) {
        console.error("Gagal mencatat log notifikasi (mungkin RLS anon key):", logError)
      }
    } catch (e) {
      console.error("Error saat mencatat log notifikasi:", e)
    }

    // 2. Check if Gateway is configured
    if (!WA_GATEWAY_URL || !WA_API_KEY) {
      // SIMULATED MODE: Gateway not configured
      console.log(`[SIMULATED WA] To: ${formattedNumber} | Message: ${payload.message}`)
      
      if (logEntry) {
        await supabase
          .from("notification_logs")
          .update({ status: "simulated_sent", sent_at: new Date().toISOString() })
          .eq("id", logEntry.id)
      }

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

    if (responseData.status) {
      if (logEntry) {
        await supabase
          .from("notification_logs")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", logEntry.id)
      }
      return { success: true, data: responseData }
    } else {
      console.error("API Gateway XSender mengembalikan error:", responseData.msg)
      if (logEntry) {
        await supabase
          .from("notification_logs")
          .update({ status: "failed", error_message: responseData.msg })
          .eq("id", logEntry.id)
      }
      return { success: false, error: responseData.msg }
    }
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

function formatIndonesianDate(isoString: string) {
  try {
    const d = new Date(isoString)
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(d).replace(/\./g, ':') + ' WIB'
  } catch (e) {
    return isoString
  }
}

export async function tplPengajuanBerhasil(nomor: string, namaEvent: string, url: string) {
  return `*✅ PENGAJUAN BERHASIL TERKIRIM*

Assalamu'alaikum warahmatullahi wabarakatuh

Terima kasih, pengajuan peminjaman fasilitas Masjid Agung Kubah Timah (MAKT) Anda telah berhasil kami terima dengan rincian:

▪️ *No. Tiket:* ${nomor}
▪️ *Nama Kegiatan:* ${namaEvent}

Saat ini pengajuan Anda sedang dalam tahap *Pengecekan Admin* dan akan diteruskan ke Pejabat terkait untuk proses persetujuan.

🔍 *Lacak Status Pengajuan:*
Anda dapat memantau perkembangan status permohonan Anda kapan saja melalui tautan berikut:
${url}

Salam,
Sekretariat MAKT`
}

export async function tplNotifikasiAdmin(nomor: string, namaPemohon: string, namaEvent: string, tglEvent: string, url: string) {
  const formattedDate = formatIndonesianDate(tglEvent)
  return `*⚠️ PENGAJUAN BARU MASUK ⚠️*

Ada pengajuan baru yang membutuhkan pengecekan admin:
- Nomor: *${nomor}*
- Pemohon: *${namaPemohon}*
- Event: *${namaEvent}*
- Tanggal: *${formattedDate}*

Segera periksa dan proses di panel admin:
${url}`
}

export async function tplNotifikasiApprover(namaEvent: string, jenisEvent: string, namaPemohon: string, tglEvent: string, catatanAdmin: string, url: string, namaApprover: string = "Bapak/Ibu") {
  const formattedDate = formatIndonesianDate(tglEvent)
  return `📝 *PERMINTAAN APPROVAL KEGIATAN*

Assalamualaikum Bpk/Ibu *${namaApprover}*
Terdapat pengajuan baru di *Sistem Management Event System Masjid Agung Kubah Timah*.

Mohon review pengajuan kegiatan berikut:
- Event : *${namaEvent}*
- Jenis : *${jenisEvent}*
- Pemohon : *${namaPemohon}*
- Tanggal Event : *${formattedDate}*${catatanAdmin ? `\n- Catatan : _${catatanAdmin}_` : ''}

Silakan berikan persetujuan atau penolakan melalui tautan berikut:
${url}

Terima kasih.`
}

export async function tplPengajuanDisetujui(nomor: string, namaEvent: string, tglEvent: string) {
  const formattedDate = formatIndonesianDate(tglEvent)
  return `*🎉 PENGAJUAN DISETUJUI*

Assalamu'alaikum warahmatullahi wabarakatuh

Kabar baik! Pengajuan peminjaman fasilitas MAKT Anda telah *DISETUJUI* sepenuhnya:

▪️ *No. Tiket:* ${nomor}
▪️ *Nama Kegiatan:* ${namaEvent}
▪️ *Waktu Pelaksanaan:* ${formattedDate}

*Pemberitahuan Tambahan:*
Jika Anda membutuhkan layanan pendaftaran jamaah online (E-Ticket) & absensi terintegrasi untuk acara ini, silakan hubungi Admin MAKT.

Mohon selalu mematuhi tata tertib kebersihan dan keamanan selama menggunakan fasilitas Masjid.

Salam,
Sekretariat MAKT`
}

export async function tplPengajuanDitolak(nomor: string, namaEvent: string, catatan: string) {
  return `*❌ PENGAJUAN DITOLAK*

Assalamu'alaikum warahmatullahi wabarakatuh

Mohon maaf, pengajuan peminjaman fasilitas MAKT Anda terpaksa kami *TOLAK* dengan rincian berikut:

▪️ *No. Tiket:* ${nomor}
▪️ *Nama Kegiatan:* ${namaEvent}

*Alasan Penolakan:* 
_${catatan || 'Tidak memenuhi syarat dan ketentuan penggunaan fasilitas masjid.'}_

Kami memohon maaf atas ketidaknyamanan ini. Terima kasih atas partisipasi Anda.

Salam,
Sekretariat MAKT`
}

export async function tplPengajuanRevisi(nomor: string, namaEvent: string, catatan: string, url: string) {
  return `*⚠️ PENGAJUAN BUTUH REVISI*

Assalamu'alaikum warahmatullahi wabarakatuh

Pengajuan peminjaman fasilitas MAKT Anda memerlukan sedikit *PERBAIKAN / REVISI* dengan rincian:

▪️ *No. Tiket:* ${nomor}
▪️ *Nama Kegiatan:* ${namaEvent}
▪️ *Catatan Revisi:* 
_${catatan}_

*Langkah-langkah Perbaikan:*
1. Klik tautan status pengajuan di bawah ini.
2. Temukan dan klik tombol *"Mulai Revisi"* pada kotak peringatan berwarna oranye.
3. Perbaiki data jadwal/pemateri atau unggah ulang dokumen terbaru (Proposal, Surat, Flyer) sesuai Catatan Revisi.
4. Jangan lupa tambahkan balasan catatan untuk Reviewer (jika perlu).
5. Klik *"Kirim Ulang Revisi"* untuk menyelesaikan perbaikan Anda.

Silakan lakukan perbaikan secepatnya melalui tautan di bawah ini:
${url}

Terima kasih.

Salam,
Sekretariat MAKT`
}

export async function getApproverInfo(nextStep: any) {
  const supabaseAdmin = createAdminClient()
  let approverPhone = "081234567890"
  let approverName = "Approver MAKT"
  
  if (!nextStep) return { approverPhone, approverName }

  let query = supabaseAdmin.from('user_profiles').select('full_name, whatsapp').not('whatsapp', 'is', null).neq('whatsapp', '')
  if (nextStep.user_id) {
    query = query.eq('user_id', nextStep.user_id)
  } else if (nextStep.jabatan) {
    query = query.ilike('jabatan', nextStep.jabatan)
  } else {
    query = query.eq('system_role', 'super_admin')
  }
  
  const { data: approvers } = await query.limit(1)
  if (approvers && approvers.length > 0 && approvers[0].whatsapp) {
    approverPhone = approvers[0].whatsapp
    approverName = approvers[0].full_name || nextStep.jabatan || approverName
  }

  return { approverPhone, approverName }
}

export async function getSuperAdminTemplate(type: 'request' | 'result' | 'reminder' | 'minutes') {
  const supabaseAdmin = createAdminClient()
  const { data: sysAdmin } = await supabaseAdmin.from('user_profiles')
    .select('*')
    .eq('system_role', 'super_admin')
    .limit(1)
    
  if (sysAdmin && sysAdmin.length > 0) {
    if (type === 'request') return sysAdmin[0].wa_approval_request_template
    if (type === 'result') return sysAdmin[0].wa_approval_result_template
    if (type === 'reminder') return sysAdmin[0].wa_reminder_template
    if (type === 'minutes') return sysAdmin[0].wa_minutes_template
  }
  return null
}
