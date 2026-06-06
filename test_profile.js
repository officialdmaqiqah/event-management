const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  console.log("Mencoba login...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin123@admin.com',
    password: 'suksesterus',
  });

  if (authError) {
    console.error('Gagal login:', authError.message);
    return;
  }
  
  console.log("Login sukses! User ID:", authData.user.id);
  
  console.log("Mengecek tabel user_profiles...");
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Gagal mengambil profil:', profileError.message);
    console.log("Details:", profileError);
  } else {
    console.log('Data profil ditemukan:', profileData);
  }
}

checkProfile();
