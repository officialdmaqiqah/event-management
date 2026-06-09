import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_URL'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: profiles } = await supabase.from('user_profiles').select('full_name, jabatan, whatsapp')
  console.log('User Profiles:', profiles)
  
  const { data: wf } = await supabase.from('workflow_approval').select('*')
  console.log('Workflow Steps:', wf)
}
run()
