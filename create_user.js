const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function signUp() {
  console.log("Mencoba mendaftarkan user...");
  const { data, error } = await supabase.auth.signUp({
    email: 'admin123@admin.com',
    password: 'suksesterus',
  });

  if (error) {
    console.error('Gagal:', error.message);
  } else {
    console.log('Berhasil membuat akun! Pastikan "Confirm Email" di Supabase dimatikan jika ingin langsung login tanpa verifikasi email.');
  }
}

signUp();
