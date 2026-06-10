const { createClient } = require('@supabase/supabase-js');
const url = 'https://nrsblpmhbkdgjsxiinpp.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY';

const supabase = createClient(url, key);

async function test() {
  const { data: list, error: listError } = await supabase.from("pengajuan_peminjaman").select("id, nama_event, jenis_event");
  if (listError) return console.error("List Error:", listError);
  
  for (const item of list) {
    const { data, error } = await supabase.from("pengajuan_peminjaman").select("*").eq("id", item.id).single();
    if (error) console.error(`Error on ${item.id}:`, error.message);
    
    // Check if jenis_event fetch fails
    const { data: jEvent, error: jError } = await supabase
        .from("jenis_event")
        .select("*")
        .eq("name", data.jenis_event)
        .maybeSingle()
    if (jError) console.error(`jenis_event Error on ${item.id}:`, jError.message);
  }
  console.log("Checked all pengajuan");
}

test();
