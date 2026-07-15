import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: config } = await supabase.rpc('get_wa_config')
  if (!config || !config.api_key) return console.log("No config")

  const testNumbers = ['6282176172233']
  
  for (const number of testNumbers) {
      console.log("Sending simple text to:", number)
      try {
          const response = await fetch('https://xsender.id/api/send-message', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: config.api_key, sender: config.sender, number: number, message: "Tes notifikasi tanpa link", footer: "MAKT" })
          })
          const responseData = await response.json()
          console.log(`XSender response for ${number}:`, responseData)
      } catch (e) {
          console.error("XSender error:", e)
      }
  }
}
run()
