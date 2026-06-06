import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { number, nama, event_id, event_title, link_tiket, footer } = await req.json()

    if (!number || !nama) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Default Config System
    let activeConfig = {
      api_key: "",
      sender: "",
      message_template: "",
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
          if (userProfile.wa_message_template) {
            activeConfig.message_template = userProfile.wa_message_template
          }
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

    // Default template jika belum diatur di database
    const defaultTemplate = "*Pendaftaran Sukses!*\n\nHalo {{nama}},\nTerima kasih telah mendaftar di acara *{{event}}*.\n\nBerikut adalah tautan E-Ticket Anda:\n{{link_tiket}}\n\nMohon simpan pesan ini dan klik tautan di atas untuk melakukan absen (check-in) saat acara berlangsung.\n\nTerima kasih."
    
    // Ganti variabel pada template
    let messageBody = activeConfig.message_template || defaultTemplate
    messageBody = messageBody.replace(/\{\{nama\}\}/g, nama)
    messageBody = messageBody.replace(/\{\{event\}\}/g, event_title || "")
    messageBody = messageBody.replace(/\{\{link_tiket\}\}/g, link_tiket || "")

    const payload = {
      api_key: activeConfig.api_key,
      sender: activeConfig.sender,
      number: formattedNumber,
      message: messageBody,
      footer: footer || "Acaraku.id Platform"
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
