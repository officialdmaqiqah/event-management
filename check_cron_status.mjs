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

async function checkStatus() {
  const { data: pengajuan, error } = await supabase
    .from('pengajuan_peminjaman')
    .select('id, nomor_pengajuan, status, updated_at, last_reminder_sent_at')
    .in('status', ['submitted', 'under_review'])
    
  if (error) {
    console.error('Error fetching data:', error)
    return
  }
  
  console.log('--- Pending Pengajuan ---')
  console.log(`Total pending: ${pengajuan.length}`)
  
  const now = new Date()
  
  pengajuan.forEach(p => {
    const updated = new Date(p.updated_at)
    const diffHours = (now - updated) / (1000 * 60 * 60)
    
    let reminderText = 'Never'
    if (p.last_reminder_sent_at) {
      const reminder = new Date(p.last_reminder_sent_at)
      const rDiff = (now - reminder) / (1000 * 60 * 60)
      reminderText = `${rDiff.toFixed(1)} hours ago (${reminder.toISOString()})`
    }
    
    console.log(`- [${p.status}] ${p.nomor_pengajuan}`)
    console.log(`  Updated: ${diffHours.toFixed(1)} hours ago (${updated.toISOString()})`)
    console.log(`  Last Reminder: ${reminderText}`)
  })
}

checkStatus()
