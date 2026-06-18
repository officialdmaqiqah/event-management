import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=');
    env[key.trim()] = rest.join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

async function check() {
  const resEvents = await fetch(`${supabaseUrl}/rest/v1/events?select=*`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const events = await resEvents.json();

  const resPengajuan = await fetch(`${supabaseUrl}/rest/v1/pengajuan_peminjaman?select=*`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const pengajuan = await resPengajuan.json();

  console.log("EVENTS:");
  for (const ev of events || []) {
    if (ev.title.includes('Musyawarah')) {
      console.log(`- ${ev.title} (ID: ${ev.id})`);
      console.log(`  request_id: ${ev.event_request_id}`);
      const req = pengajuan?.find(p => p.id === ev.event_request_id);
      if (req) {
        console.log(`  -> Linked to pengajuan: ${req.nama_event} (privacy: ${req.privacy_event})`);
      } else {
        console.log(`  -> No linked pengajuan found!`);
      }
    }
  }

  console.log("\nPENGAJUAN with Musyawarah:");
  for (const p of pengajuan || []) {
    if (p.nama_event.includes('Musyawarah')) {
      console.log(`- ${p.nama_event} (ID: ${p.id}, privacy: ${p.privacy_event}, status: ${p.status})`);
    }
  }
}

check();
