import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log("=== TRYING TO INSERT INTO NOTIFICATION_LOGS WITH ANON KEY ===")
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzMwODMsImV4cCI6MjA5NjI0OTA4M30.9LvHmhDAHIKbe1HQHeMc8rvlRZi-E7bSen9U9qt52Sw'
  const anonClient = createClient(supabaseUrl, anonKey)

  const { data, error } = await anonClient.from('notification_logs').insert({
    recipient_name: 'Test RLS',
    recipient_whatsapp: '628123456789',
    channel: 'whatsapp',
    message: 'Test RLS',
    status: 'pending'
  }).select()
  
  if (error) console.error(error)
  console.log("Result:", data)
}

run()
