/**
 * run_migration.js
 * Jalankan: node run_migration.js
 * 
 * Script ini membaca file migration SQL dan menjalankannya
 * ke Supabase via supabase-js dengan service_role key.
 * 
 * PENTING: Butuh SUPABASE_SERVICE_ROLE_KEY di .env.local
 * Cari di: Supabase Dashboard → Project Settings → API → service_role
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

// Baca dari .env.local secara manual
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di .env.local');
  process.exit(1);
}

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local');
  console.error('');
  console.error('Tambahkan ke .env.local:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ... (dari Supabase Dashboard → Settings → API)');
  console.error('');
  console.error('ALTERNATIF: Jalankan SQL langsung di Supabase SQL Editor:');
  console.error('  https://supabase.com/dashboard/project/nrsblpmhbkdgjsxiinpp/sql/new');
  console.error('');
  console.error('File migration yang perlu dijalankan (urut):');
  
  const migDir = path.join(__dirname, 'supabase', 'migrations');
  const files  = fs.readdirSync(migDir).sort();
  files.forEach(f => console.error('  ' + f));
  process.exit(1);
}

// Jalankan SQL via Supabase REST
async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const url   = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL); // via pg_net (jika aktif)
    // Kita pakai endpoint /sql Supabase Admin API
    const body  = JSON.stringify({ query: sql });
    const host  = new URL(SUPABASE_URL).hostname;
    const opts  = {
      hostname: host,
      path    : '/rest/v1/rpc/exec_sql',
      method  : 'POST',
      headers : {
        'Content-Type'  : 'application/json',
        'Authorization' : `Bearer ${SERVICE_KEY}`,
        'apikey'        : SERVICE_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const migDir = path.join(__dirname, 'supabase', 'migrations');
  const files  = fs.readdirSync(migDir).sort().filter(f => f.endsWith('.sql'));

  console.log(`\n=== MAKT Migration Runner ===`);
  console.log(`Project: ${SUPABASE_URL}`);
  console.log(`Ditemukan ${files.length} file migration\n`);

  // Cek konektivitas dahulu
  console.log('Catatan: Script ini memerlukan service_role key untuk eksekusi DDL.');
  console.log('Jika mengalami error, gunakan Supabase SQL Editor manual.\n');

  for (const file of files) {
    const filePath = path.join(migDir, file);
    const sql      = fs.readFileSync(filePath, 'utf-8');
    console.log(`▶ Menjalankan: ${file} (${sql.length} chars)...`);
    
    try {
      const result = await runSQL(sql);
      if (result.status >= 200 && result.status < 300) {
        console.log(`  ✓ Berhasil (HTTP ${result.status})`);
      } else {
        console.log(`  ⚠ HTTP ${result.status}: ${result.data}`);
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }
  }

  console.log('\n=== Selesai ===');
}

main().catch(console.error);
