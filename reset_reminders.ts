import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function reset() {
  const { data, error } = await supabase
    .from('pengajuan_peminjaman')
    .update({ last_reminder_sent_at: null })
    .in('status', ['submitted', 'under_review'])
  console.log('Reset complete:', error || 'Success')
}
reset()
