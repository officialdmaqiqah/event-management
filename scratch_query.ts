import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_URL'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_KEY'

// We need to read from .env.local
import * as fs from 'fs'
import * as dotenv from 'dotenv'

const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function run() {
  console.log("Checking duplicates...")
  const { data: p } = await supabase.from('pengajuan_peminjaman').select('id, nama_event, tanggal_mulai').ilike('nama_event', '%Shubuh%')
  const { data: e } = await supabase.from('events').select('id, title, event_request_id, start_datetime').ilike('title', '%Shubuh%')
  
  console.log('Pengajuan Shubuh total:', p?.length)
  console.log(p?.slice(0, 5))
  
  console.log('Events Shubuh total:', e?.length)
  console.log(e?.slice(0, 5))
}
run()
