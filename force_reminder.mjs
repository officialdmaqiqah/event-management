import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: config } = await supabase.rpc('get_wa_config')
  if (!config || !config.api_key) return console.log("No config")

  // Target specific pengajuan
  const { data: pendingPengajuan } = await supabase
    .from('pengajuan_peminjaman')
    .select('id, nomor_pengajuan, status, jenis_event, current_approval_level, updated_at, last_reminder_sent_at, nama_event, tanggal_mulai, nama_pemohon')
    .eq('nomor_pengajuan', 'PJM-20260630-0002')

  if (!pendingPengajuan || pendingPengajuan.length === 0) return console.log("Pengajuan not found")

  const approverMap = new Map()

  for (const pengajuan of pendingPengajuan) {
    const { data: jEvent } = await supabase.from('jenis_event').select('id').eq('name', pengajuan.jenis_event).single()
    if (!jEvent) continue

    const { data: workflow } = await supabase.from('workflow_approval').select('user_id, jabatan').eq('jenis_event_id', jEvent.id).eq('level', pengajuan.current_approval_level).single()
    if (!workflow) continue

    let profileQuery = supabase.from('user_profiles').select('full_name, whatsapp')
    if (workflow.user_id) profileQuery = profileQuery.eq('user_id', workflow.user_id)
    else if (workflow.jabatan) profileQuery = profileQuery.ilike('jabatan', workflow.jabatan)

    const { data: profiles } = await profileQuery.limit(1)
    const profile = profiles && profiles.length > 0 ? profiles[0] : null
    if (!profile || !profile.whatsapp) continue

    const group = approverMap.get(profile.whatsapp) || {
      whatsapp: profile.whatsapp,
      nama_approver: profile.full_name || workflow.jabatan,
      events: []
    }
    
    let tgl = '-'
    if (pengajuan.tanggal_mulai) tgl = new Date(pengajuan.tanggal_mulai).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    
    group.events.push(`1. ${pengajuan.nama_event || 'Event'}, ${tgl}, ${pengajuan.nama_pemohon || '-'}`)
    approverMap.set(profile.whatsapp, group)
  }

  for (const group of Array.from(approverMap.values())) {
    let formattedNumber = group.whatsapp.replace(/\D/g, '')
    if (formattedNumber.startsWith('0')) formattedNumber = '62' + formattedNumber.substring(1)

    let messageBody = "*Pengingat Approval [Tertunda > 24 Jam]*\n\nBpk/Ibu. *" + group.nama_approver + "*,\nKami mengingatkan bahwa terdapat pengajuan kegiatan yang **masih menunggu keputusan Anda lebih dari 24 jam**\n\nDaftar kegiatan :\n" + group.events.join('\n') + "\n\nMohon segera periksa dan berikan keputusan melalui tautan berikut:\nhttps://event.kubahtimah.com/admin/approval\n\nTerima kasih."

    const payload = {
      api_key: config.api_key,
      sender: config.sender,
      number: formattedNumber,
      message: messageBody,
      footer: "MAKT System"
    }

    console.log("Sending to:", formattedNumber)
    const res = await fetch('https://xsender.id/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    console.log("Response:", await res.json())
  }
}

run()
