import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function addFlyerColumn() {
  const { error } = await supabase.rpc('execute_sql', {
    sql_query: `
      ALTER TABLE pengajuan_peminjaman ADD COLUMN IF NOT EXISTS url_flyer text;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS url_flyer text;
    `
  })

  if (error) {
    console.error("Error adding column:", error)
  } else {
    console.log("Column url_flyer added successfully.")
  }
}

addFlyerColumn()
