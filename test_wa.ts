import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function testWA() {
  const { data: config, error } = await supabase.rpc('get_wa_config')
  console.log('DB Config:', config)

  if (config) {
    const payload = {
      api_key: config.api_key,
      sender: config.sender,
      number: '6281949098789',
      message: 'Test dari script backend node',
      footer: 'MAKT System'
    }

    console.log('Sending payload:', payload)
    
    try {
      const res = await fetch('https://xsender.id/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      console.log('Status:', res.status)
      const data = await res.json()
      console.log('Response:', data)
    } catch (e) {
      console.error('Fetch Error:', e)
    }
  }
}
testWA()
