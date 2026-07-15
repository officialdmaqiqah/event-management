import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const targetId = '68e2b6fc-fddb-4d27-ba0d-f5f81287b6e3'
  
  // check in events
  const { data: eventData, error: eventErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', targetId)
    .maybeSingle()
    
  console.log("Found in events table by ID:", !!eventData, eventData?.id)
  
  // check if it's pengajuan_id
  const { data: eventByReqId } = await supabase
    .from('events')
    .select('*')
    .eq('event_request_id', targetId)
    .maybeSingle()
    
  console.log("Found in events table by event_request_id:", !!eventByReqId, eventByReqId?.id)
  
  // check in pengajuan_peminjaman
  const { data: pengajuanData } = await supabase
    .from('pengajuan_peminjaman')
    .select('*')
    .eq('id', targetId)
    .maybeSingle()
    
  console.log("Found in pengajuan_peminjaman table by ID:", !!pengajuanData, pengajuanData?.nomor_pengajuan)
  
}
run()
