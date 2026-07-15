import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

const formatIndonesianDate = (isoString) => {
  try {
    const d = new Date(isoString)
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
    }).format(d).replace(/\./g, ':') + ' WIB'
  } catch (e) {
    return isoString
  }
}

async function run() {
  const { data: config } = await supabase.rpc('get_wa_config')
  if (!config || !config.api_key) return console.log("No config")

  const targetIds = ['PJM-20260707-0002', 'PJM-20260708-0002']
  const { data: pendingPengajuan } = await supabase
    .from('pengajuan_peminjaman')
    .select('*')
    .in('nomor_pengajuan', targetIds)

  if (!pendingPengajuan || pendingPengajuan.length === 0) {
    return console.log("Pengajuan not found")
  }

  for (const pengajuan of pendingPengajuan) {
    console.log(`Processing ${pengajuan.nomor_pengajuan}...`)

    // 1. Resend to Pemohon
    let formattedPemohonNumber = pengajuan.whatsapp.replace(/\D/g, '')
    if (formattedPemohonNumber.startsWith('0')) formattedPemohonNumber = '62' + formattedPemohonNumber.substring(1)

    const urlPemohon = `https://event.kubahtimah.com/status/${pengajuan.id}`
    const msgPemohon = `*✅ PENGAJUAN BERHASIL TERKIRIM*\n\nAssalamu'alaikum warahmatullahi wabarakatuh\n\nTerima kasih, pengajuan peminjaman fasilitas Masjid Agung Kubah Timah (MAKT) Anda telah berhasil kami terima dengan rincian:\n\n▪️ *No. Tiket:* ${pengajuan.nomor_pengajuan}\n▪️ *Nama Kegiatan:* ${pengajuan.nama_event}\n\nSaat ini pengajuan Anda sedang dalam tahap *Pengecekan Admin* dan akan diteruskan ke Pejabat terkait untuk proses persetujuan.\n\n🔍 *Lacak Status Pengajuan:*\nAnda dapat memantau perkembangan status permohonan Anda kapan saja melalui tautan berikut:\n${urlPemohon}\n\nSalam,\nSekretariat MAKT`
    
    console.log("Sending to pemohon:", formattedPemohonNumber)
    await fetch('https://xsender.id/api/send-message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: config.api_key, sender: config.sender, number: formattedPemohonNumber, message: msgPemohon, footer: "MAKT System" })
    })

    // 2. Find Approver and Resend to Approver
    const { data: jEvent } = await supabase.from('jenis_event').select('id').eq('name', pengajuan.jenis_event).single()
    if (!jEvent) {
      console.log(`No jenis event found for ${pengajuan.jenis_event}`)
      continue
    }

    const { data: workflow } = await supabase.from('workflow_approval').select('user_id, jabatan').eq('jenis_event_id', jEvent.id).eq('level', pengajuan.current_approval_level).single()
    if (!workflow) {
      console.log(`No workflow level ${pengajuan.current_approval_level} found`)
      continue
    }

    let profileQuery = supabase.from('user_profiles').select('full_name, whatsapp')
    if (workflow.user_id) profileQuery = profileQuery.eq('user_id', workflow.user_id)
    else if (workflow.jabatan) profileQuery = profileQuery.ilike('jabatan', workflow.jabatan)

    const { data: profiles } = await profileQuery.limit(1)
    const profile = profiles && profiles.length > 0 ? profiles[0] : null
    if (!profile || !profile.whatsapp) {
       console.log(`Approver not found or missing WA`)
       continue
    }

    let formattedApproverNumber = profile.whatsapp.replace(/\D/g, '')
    if (formattedApproverNumber.startsWith('0')) formattedApproverNumber = '62' + formattedApproverNumber.substring(1)
    
    const approverName = profile.full_name || workflow.jabatan || 'Bapak/Ibu'
    
    const msgApprover = `📝 *PERMINTAAN APPROVAL KEGIATAN*\n\nAssalamualaikum Bpk/Ibu *${approverName}*\nTerdapat pengajuan baru di *Sistem Management Event System Masjid Agung Kubah Timah*.\n\nMohon review pengajuan kegiatan berikut:\n- Event : *${pengajuan.nama_event}*\n- Jenis : *${pengajuan.jenis_event}*\n- Pemohon : *${pengajuan.nama_pemohon}*\n- Tanggal Event : *${formatIndonesianDate(pengajuan.tanggal_mulai)}*\n\nSilakan berikan persetujuan atau penolakan melalui tautan berikut:\nhttps://event.kubahtimah.com/admin/approval\n\nTerima kasih.`

    console.log("Sending to approver:", formattedApproverNumber)
    await fetch('https://xsender.id/api/send-message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: config.api_key, sender: config.sender, number: formattedApproverNumber, message: msgApprover, footer: "MAKT System" })
    })
  }
}
run()
