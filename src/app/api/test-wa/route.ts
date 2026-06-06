import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    const { number } = await req.json()

    if (!number) {
      return NextResponse.json({ error: 'Nomor tujuan tidak boleh kosong' }, { status: 400 })
    }

    // Ambil config dari database melalui secure RPC
    const { data: config, error: configError } = await supabase.rpc('get_wa_config')
    
    if (configError || !config) {
      return NextResponse.json({ error: 'Gagal mengambil konfigurasi WA' }, { status: 500 })
    }

    if (!config.api_key || !config.sender) {
      return NextResponse.json({ error: 'API Key atau Nomor Pengirim belum diatur' }, { status: 400 })
    }

    // Format phone number
    let formattedNumber = number.replace(/\D/g, '')
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1)
    }

    // Data dummy untuk uji coba
    const dummyNama = "Budi Uji Coba"
    const dummyEvent = "Seminar Event Management"
    const dummyLink = "https://example.com/ticket/DUMMY123"
    
    // Ganti variabel pada template
    let messageBody = config.message_template || "Ini adalah pesan uji coba dari Event Management."
    messageBody = messageBody.replace(/\{\{nama\}\}/g, dummyNama)
    messageBody = messageBody.replace(/\{\{event\}\}/g, dummyEvent)
    messageBody = messageBody.replace(/\{\{link_tiket\}\}/g, dummyLink)

    const payload = {
      api_key: config.api_key,
      sender: config.sender,
      number: formattedNumber,
      message: messageBody,
      footer: "Pesan Sistem - Uji Coba"
    }

    // Call XSender API
    const res = await fetch("https://xsender.id/api/send-message", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await res.json()
    console.log("XSender Test WA Response:", result)

    if (result.status) {
      return NextResponse.json({ success: true, message: 'Pesan terkirim' })
    } else {
      return NextResponse.json({ error: result.msg || 'Gagal mengirim pesan melalui gateway' }, { status: 400 })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
