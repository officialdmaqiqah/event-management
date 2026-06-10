import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase
    .from('pengajuan_peminjaman')
    .select('id, nama_event, judul_kajian, nama_ustadz, nama_pemohon')
    .like('nomor_pengajuan', 'RUTIN-%')

  if (error) {
    console.error(error)
    return
  }

  for (const row of data) {
    let namaEvent = row.nama_event;
    let newJudul = row.judul_kajian;
    let newUstadz = row.nama_ustadz;

    if (!newJudul && !newUstadz && namaEvent.includes(' bersama ')) {
       const parts = namaEvent.split(' bersama ');
       newJudul = parts[0].trim();
       newUstadz = parts[1].trim();
       namaEvent = newJudul;
    } else if (!newJudul && !newUstadz) {
       newJudul = namaEvent;
    }

    const { error: updateError } = await supabase
      .from('pengajuan_peminjaman')
      .update({
        nama_event: namaEvent,
        judul_kajian: newJudul,
        nama_ustadz: newUstadz,
        nama_pemohon: 'DKM MAKT'
      })
      .eq('id', row.id)
      
    if (updateError) {
      console.error(`Failed to update ${row.id}`, updateError)
    } else {
      console.log(`Updated ${row.id}: Event: ${namaEvent}, Judul: ${newJudul}, Ustadz: ${newUstadz}`)
    }
  }
}

run()
