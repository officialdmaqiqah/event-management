import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const correctName = "Deklarasi IPTNI Babel & Upgrading Konsep Thibb Nabawi"
  
  // 1. Update pengajuan_peminjaman
  const { data: pengajuan, error: pengajuanErr } = await supabase
    .from('pengajuan_peminjaman')
    .update({ nama_event: correctName })
    .eq('nomor_pengajuan', 'PJM-20260714-0003')
    .select('id')
    .single()
    
  if (pengajuanErr) {
    console.error("Failed to update pengajuan:", pengajuanErr)
  } else {
    console.log("Successfully updated pengajuan_peminjaman.")
    
    // 2. Update events table
    const { error: eventErr } = await supabase
      .from('events')
      .update({ title: correctName })
      .eq('event_request_id', pengajuan.id)
      
    if (eventErr) {
      console.error("Failed to update events:", eventErr)
    } else {
      console.log("Successfully updated events.")
    }
  }
}
run()
