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

  const { data: pengajuan } = await supabase
    .from('pengajuan_peminjaman')
    .select('*')
    .eq('nomor_pengajuan', 'PJM-20260708-0002')
    .single()

  if (!pengajuan) {
    return console.log("Pengajuan not found")
  }

  let formattedPemohonNumber = pengajuan.whatsapp.replace(/\D/g, '')
  if (formattedPemohonNumber.startsWith('0')) formattedPemohonNumber = '62' + formattedPemohonNumber.substring(1)

  const msgPemohon = `*🎉 PENGAJUAN DISETUJUI*

Assalamu'alaikum warahmatullahi wabarakatuh

Kabar baik! Pengajuan peminjaman fasilitas MAKT Anda telah *DISETUJUI* sepenuhnya:

▪️ *No. Tiket:* ${pengajuan.nomor_pengajuan}
▪️ *Nama Kegiatan:* ${pengajuan.nama_event}
▪️ *Waktu Pelaksanaan:* ${formatIndonesianDate(pengajuan.tanggal_mulai)}

*Pemberitahuan Tambahan:*
Jika Anda membutuhkan layanan pendaftaran jamaah online (E-Ticket) & absensi terintegrasi untuk acara ini, silakan hubungi Admin MAKT.

Mohon selalu mematuhi tata tertib kebersihan dan keamanan selama menggunakan fasilitas Masjid.

Salam,
Sekretariat MAKT`
  
  console.log("Sending to pemohon:", formattedPemohonNumber)
  
  try {
      const response = await fetch('https://xsender.id/api/send-message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: config.api_key, sender: config.sender, number: formattedPemohonNumber, message: msgPemohon, footer: "MAKT System" })
      })
      const responseData = await response.json()
      console.log("XSender response:", responseData)
  } catch (e) {
      console.error("XSender error:", e)
  }
}
run()
