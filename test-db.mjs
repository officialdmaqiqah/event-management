import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log("=== PENGAJUAN PEMINJAMAN COLUMNS ===")
  const { data: pData } = await supabase.from('pengajuan_peminjaman').select('*').limit(1)
  if (pData && pData.length > 0) {
    console.log(Object.keys(pData[0]))
  }

  console.log("\n=== EVENTS COLUMNS ===")
  const { data: eData } = await supabase.from('events').select('*').limit(1)
  if (eData && eData.length > 0) {
    console.log(Object.keys(eData[0]))
  }
}

run()
