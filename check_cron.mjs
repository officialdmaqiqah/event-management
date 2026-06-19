import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=')
    env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '')
  }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const query = supabase
      .from('pengajuan_peminjaman')
      .select('id, nomor_pengajuan, status, jenis_event, current_approval_level, updated_at, last_reminder_sent_at, nama_event')
      .in('status', ['submitted', 'under_review'])
      .lt('updated_at', twentyFourHoursAgo)
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${twentyFourHoursAgo}`)
      
  const { data, error } = await query
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Pending > 24h:', data?.length)
  console.log('Data:', data)
  
  // also check without the time condition to see how many total are pending
  const { data: allPending } = await supabase
      .from('pengajuan_peminjaman')
      .select('id, nomor_pengajuan, status, updated_at, last_reminder_sent_at')
      .in('status', ['submitted', 'under_review'])
  console.log('All pending count:', allPending?.length)
  console.log('All pending details:', allPending)
}

check()
