import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { 
      number, 
      nama, 
      event_id, 
      event_title, 
      link_tiket, 
      footer,
      template_type, // 'registration' | 'approval_request' | 'approval_result' | 'reminder' | 'minutes' | 'approval_reminder'
      // Additional variables for other templates
      nama_approver,
      pemohon,
      link_approval,
      status_pengajuan,
      catatan,
      link_notulen,
      count,
      event_list
    } = await req.json()

    if (!number) {
      return NextResponse.json({ error: 'Missing phone number' }, { status: 400 })
    }

    // Default Config System
    let activeConfig = {
      api_key: "",
      sender: "",
      message_template: "",
      approval_request_template: "",
      approval_result_template: "",
      reminder_template: "",
      minutes_template: "",
      approval_reminder_template: "",
      is_enabled: false
    }

    // 1. Ambil config system dari database melalui secure RPC
    const { data: sysConfig, error: configError } = await supabase.rpc('get_wa_config')
    if (!configError && sysConfig) {
      activeConfig = { ...activeConfig, ...sysConfig }
    }

    // 2. Jika ada event_id, periksa apakah pembuat event adalah Premium dan punya config sendiri
    if (event_id) {
      const { data: userProfile, error: profileError } = await supabase.rpc('get_user_profile_by_event', { evt_id: event_id })
      
      if (!profileError && userProfile && userProfile.is_premium) {
        if (userProfile.wa_api_key && userProfile.wa_sender_id) {
          activeConfig.api_key = userProfile.wa_api_key
          activeConfig.sender = userProfile.wa_sender_id
          if (userProfile.wa_message_template) activeConfig.message_template = userProfile.wa_message_template
          if (userProfile.wa_approval_request_template) activeConfig.approval_request_template = userProfile.wa_approval_request_template
          if (userProfile.wa_approval_result_template) activeConfig.approval_result_template = userProfile.wa_approval_result_template
          if (userProfile.wa_reminder_template) activeConfig.reminder_template = userProfile.wa_reminder_template
          if (userProfile.wa_minutes_template) activeConfig.minutes_template = userProfile.wa_minutes_template
          if (userProfile.wa_approval_reminder_template) activeConfig.approval_reminder_template = userProfile.wa_approval_reminder_template
          
          console.log("Using Premium Custom WA Config for event:", event_id)
        }
      }
    }
    
    // Jika notifikasi WA dinonaktifkan di level sistem dan tidak di override
    if (!activeConfig.api_key) {
      console.log("No WA API Key configured. Skipping.")
      return NextResponse.json({ success: true, message: 'WA not configured' })
    }

    // Format phone number (ensure starts with 62)
    let formattedNumber = number.replace(/\D/g, '')
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1)
    }

    // Pilih Template Berdasarkan template_type
    const type = template_type || 'registration'
    let messageBody = ""

    if (type === 'registration') {
      const defaultTpl = "*Pendaftaran Sukses!*\n\nHalo {{nama}},\nTerima kasih telah mendaftar di acara *{{event}}*.\n\nBerikut adalah tautan E-Ticket Anda:\n{{link_tiket}}\n\nMohon simpan pesan ini dan klik tautan di atas untuk melakukan absen (check-in) saat acara berlangsung.\n\nTerima kasih."
      messageBody = activeConfig.message_template || defaultTpl
      messageBody = messageBody.replace(/\{\{nama\}\}/g, nama || "")
      messageBody = messageBody.replace(/\{\{event\}\}/g, event_title || "")
      messageBody = messageBody.replace(/\{\{link_tiket\}\}/g, link_tiket || "")

    } else if (type === 'approval_request') {
      const defaultTpl = "*Pemberitahuan Approval Baru*\n\nHalo {{nama_approver}},\nTerdapat pengajuan baru untuk kegiatan *{{nama_event}}* oleh *{{pemohon}}* yang memerlukan persetujuan Anda.\n\nSilakan periksa dan berikan keputusan melalui tautan berikut:\n{{link_approval}}\n\nTerima kasih."
      messageBody = activeConfig.approval_request_template || defaultTpl
      messageBody = messageBody.replace(/\{\{nama_approver\}\}/g, nama_approver || "")
      messageBody = messageBody.replace(/\{\{nama_event\}\}/g, event_title || "")
      messageBody = messageBody.replace(/\{\{pemohon\}\}/g, pemohon || "")
      messageBody = messageBody.replace(/\{\{link_approval\}\}/g, link_approval || "")

    } else if (type === 'approval_result') {
      const defaultTpl = "*Informasi Status Pengajuan*\n\nHalo {{nama_pemohon}},\nPengajuan kegiatan *{{nama_event}}* Anda telah berstatus: *{{status_pengajuan}}*.\n\nCatatan: {{catatan}}\n\nSilakan cek detail lengkapnya di sini:\n{{link_status}}\n\nTerima kasih."
      messageBody = activeConfig.approval_result_template || defaultTpl
      messageBody = messageBody.replace(/\{\{nama_pemohon\}\}/g, pemohon || "")
      messageBody = messageBody.replace(/\{\{nama_event\}\}/g, event_title || "")
      messageBody = messageBody.replace(/\{\{status_pengajuan\}\}/g, status_pengajuan || "")
      messageBody = messageBody.replace(/\{\{catatan\}\}/g, catatan || "-")
      messageBody = messageBody.replace(/\{\{link_status\}\}/g, link_tiket || "")

    } else if (type === 'reminder') {
      const defaultTpl = "*Pengingat Acara BESOK*\n\nHalo {{nama}},\nKami mengingatkan bahwa acara *{{nama_event}}* akan berlangsung esok hari.\n\nMohon siapkan tiket Anda untuk absensi:\n{{link_tiket}}\n\nSampai jumpa di lokasi!"
      messageBody = activeConfig.reminder_template || defaultTpl
      messageBody = messageBody.replace(/\{\{nama\}\}/g, nama || "")
      messageBody = messageBody.replace(/\{\{nama_event\}\}/g, event_title || "")
      messageBody = messageBody.replace(/\{\{link_tiket\}\}/g, link_tiket || "")

    } else if (type === 'minutes') {
      const defaultTpl = "*Publikasi Notulen Rapat*\n\nPemberitahuan: Notulen hasil rapat *{{nama_event}}* telah diterbitkan secara resmi.\n\nSilakan baca selengkapnya dan tindak lanjuti hasil keputusannya melalui tautan berikut:\n{{link_notulen}}\n\nTerima kasih."
      messageBody = activeConfig.minutes_template || defaultTpl
      messageBody = messageBody.replace(/\{\{nama_event\}\}/g, event_title || "")
      messageBody = messageBody.replace(/\{\{link_notulen\}\}/g, link_notulen || "")
    } else if (type === 'approval_reminder') {
      const defaultTpl = "*Pengingat Approval [Tertunda > 24 Jam]*\n\nHalo {{nama_approver}},\nKami mengingatkan bahwa terdapat pengajuan kegiatan *{{nama_event}}* oleh *{{pemohon}}* yang **masih menunggu keputusan Anda lebih dari 24 jam**.\n\nMohon segera periksa dan berikan keputusan melalui tautan berikut:\n{{link_approval}}\n\nTerima kasih."
      messageBody = activeConfig.approval_reminder_template || defaultTpl
      messageBody = messageBody.replace(/\{\{nama_approver\}\}/g, nama_approver || "")
      messageBody = messageBody.replace(/\{\{nama_event\}\}/g, event_title || "")
      messageBody = messageBody.replace(/\{\{pemohon\}\}/g, pemohon || "")
      messageBody = messageBody.replace(/\{\{link_approval\}\}/g, link_approval || "")
    } else if (type === 'approval_reminder_summary') {
      const defaultTpl = "*Pengingat Approval [Tertunda > 24 Jam]*\n\nBpk/Ibu. *{{nama_approver}}*,\nKami mengingatkan bahwa terdapat pengajuan kegiatan yang **masih menunggu keputusan Anda lebih dari 24 jam**\n\nDaftar kegiatan :\n{{event_list}}\n\nMohon segera periksa dan berikan keputusan melalui tautan berikut:\n{{link_approval}}\n\nTerima kasih."
      // Kita gunakan defaultTpl jika custom tidak tersedia
      messageBody = defaultTpl
      messageBody = messageBody.replace(/\{\{nama_approver\}\}/g, nama_approver || "")
      // @ts-ignore
      messageBody = messageBody.replace(/\{\{count\}\}/g, String(count || ""))
      // @ts-ignore
      messageBody = messageBody.replace(/\{\{event_list\}\}/g, event_list || "")
      messageBody = messageBody.replace(/\{\{link_approval\}\}/g, link_approval || "")
    }

    const payload = {
      api_key: activeConfig.api_key,
      sender: activeConfig.sender,
      number: formattedNumber,
      message: messageBody,
      footer: footer || "MAKT System"
    }

    const response = await fetch('https://xsender.id/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    console.log('WA API XSender Response:', data)
    
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('WA API Error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
