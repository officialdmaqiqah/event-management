import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: pengajuan } = await supabase
    .from('pengajuan_peminjaman')
    .select('id')
    .eq('nomor_pengajuan', 'PJM-20260714-0003')
    .single()
    
  if (pengajuan) {
    const { data: logs } = await supabase
      .from('notification_logs')
      .select('message')
      .eq('related_event_request_id', pengajuan.id)
      .eq('status', 'sent')
      .ilike('message', '%PENGAJUAN DISETUJUI%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      
    if (logs) {
      console.log(logs.message)
    }
  }
}
run()
