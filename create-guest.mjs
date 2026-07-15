import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createGuest() {
  console.log("Mencari atau membuat user guest...");
  
  const email = 'guest@kubahtimah.com';
  const password = 'Guest123!';
  
  // Create or get user
  let { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Mentor Tamu'
    }
  });

  let userId;

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      console.log("Akun guest sudah ada di sistem, memperbarui role...");
      // Ambil user ID
      const { data: usersData, error: errGet } = await supabase.auth.admin.listUsers();
      const user = usersData?.users.find(u => u.email === email);
      if (user) userId = user.id;
    } else {
      console.error("Gagal membuat user:", error);
      process.exit(1);
    }
  } else {
    userId = data.user.id;
    console.log("Akun guest berhasil dibuat dengan ID:", userId);
  }

  if (userId) {
    // Tunggu sedikit agar trigger pembuatan profile selesai
    await new Promise(r => setTimeout(r, 2000));
    
    // Update role ke viewer
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        system_role: 'viewer',
        is_approved: true,
        full_name: 'Mentor Tamu (Guest)'
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error("Gagal update role di profile:", profileError);
    } else {
      console.log("✅ Berhasil mengatur role 'viewer' untuk akun guest!");
      console.log(`\nSilakan gunakan kredensial berikut untuk login:`);
      console.log(`Email:    ${email}`);
      console.log(`Password: ${password}`);
    }
  }
}

createGuest();
