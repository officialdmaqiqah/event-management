import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBucket() {
  const { data, error } = await supabase.storage.getBucket('pengajuan_assets')
  console.log("Bucket info:", data, error)
  
  if (error) {
    console.log("Bucket might not exist.")
    const { error: createError } = await supabase.storage.createBucket('pengajuan_assets', { public: true })
    console.log("Create bucket error:", createError)
  }
}

checkBucket()
