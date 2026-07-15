import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log("Checking PJM-20260714-0003...")
  
  const { data: pengajuan, error } = await supabase
    .from('pengajuan_peminjaman')
    .select('*')
    .eq('nomor_pengajuan', 'PJM-20260714-0003')
    .single()
    
  if (error) {
    console.log("Error finding pengajuan:", error)
    return
  }
  
  console.log("Pengajuan Status:", pengajuan.status)
  console.log("WhatsApp Number:", pengajuan.whatsapp)
  
  console.log("Checking notification logs for this pengajuan id:", pengajuan.id)
  
  const { data: logs, error: logsError } = await supabase
    .from('notification_logs')
    .select('*')
    .eq('related_event_request_id', pengajuan.id)
    .order('created_at', { ascending: false })
    
  if (logsError) {
    console.log("Error finding logs:", logsError)
  } else {
    console.log("Logs count:", logs?.length)
    logs?.forEach(log => {
      console.log(`- ${log.created_at} | ${log.status} | To: ${log.recipient_whatsapp} | Msg: ${log.message.substring(0, 30)}... | Error: ${log.error_message}`)
    })
  }
}

run()
