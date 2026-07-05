import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const newConfig = {
    api_key: 'raRmjxN5P9CI7O63PKtFifPhZliRDf',
    sender: '6287791134515',
    is_enabled: true
  }

  const { data, error } = await supabase
    .from('settings')
    .upsert({ key: 'wa_config', value: newConfig, updated_at: new Date().toISOString() })
    .select()

  if (error) {
    console.error("Error updating config:", error)
  } else {
    console.log("Successfully updated wa_config:", data)
  }
}

run()
