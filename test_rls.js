const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const serviceRoleKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabaseAnon = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function test() {
  const { data: allData, error } = await supabaseAdmin.from('participants').select('id, ticket_code');
  console.log('Admin Data count:', allData ? allData.length : 0);
  console.log('Admin Error:', error);
  
  if (allData && allData.length > 0) {
    const { data: publicData } = await supabaseAnon.from('participants').select('*').eq('id', allData[0].id);
    console.log('Public Data fetched:', publicData);
  }
}

test();
