import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: user, error: uErr } = await supabase.from('user_profiles').select('*').eq('email', 'pemudamasjidagungkubahtimah@gmail.com');
  console.log('User:', user, uErr);

  const { data: event, error: eErr } = await supabase.from('pengajuan_peminjaman').select('*').eq('nomor_pengajuan', 'PJM-20260623-0001');
  console.log('Event:', event, eErr);
  
  if (user && user.length > 0 && event && event.length > 0) {
      if (!event[0].user_id) {
          console.log('Event user_id is null. Assigning to user...');
          const { error: updErr } = await supabase.from('pengajuan_peminjaman').update({ user_id: user[0].user_id }).eq('id', event[0].id);
          console.log('Update error:', updErr);
      } else {
          console.log('Event user_id is:', event[0].user_id, 'while user user_id is:', user[0].user_id);
      }
  }
}
run();
