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

async function update() {
  const tpl = "*Pengingat Approval [Tertunda > 24 Jam]*\n\nBpk/Ibu. *{{nama_approver}}*,\nKami mengingatkan bahwa terdapat pengajuan kegiatan yang **masih menunggu keputusan Anda lebih dari 24 jam**\n\nDaftar kegiatan :\n{{event_list}}\n\nMohon segera periksa dan berikan keputusan melalui tautan berikut:\n{{link_approval}}\n\nTerima kasih."
  
  const { data, error } = await supabase
      .from('user_profiles')
      .update({ wa_approval_reminder_template: tpl })
      .neq('id', 'dummy') // dummy condition to update all
      
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Successfully updated template in DB')
  }
}

update()
