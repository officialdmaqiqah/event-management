import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendWhatsAppNotification } from '@/app/actions/notification'

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calculate tomorrow's start and end date bounds in Asia/Jakarta timezone
    const nowWibStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
    const todayWib = new Date(nowWibStr)
    
    // Start of tomorrow (00:00:00 WIB)
    const tomorrowWibStart = new Date(todayWib.getFullYear(), todayWib.getMonth(), todayWib.getDate() + 1, 0, 0, 0)
    // End of tomorrow (23:59:59 WIB)
    const tomorrowWibEnd = new Date(todayWib.getFullYear(), todayWib.getMonth(), todayWib.getDate() + 1, 23, 59, 59)

    const tomorrowStartISO = tomorrowWibStart.toISOString()
    const tomorrowEndISO = tomorrowWibEnd.toISOString()

    // 1. Fetch approved pengajuan starting tomorrow
    const { data: approvedPengajuan, error: fetchError } = await supabase
      .from('pengajuan_peminjaman')
      .select('id, nomor_pengajuan, status, nama_event, jenis_event, nama_pemohon, nama_lembaga, whatsapp, email, tanggal_mulai, tanggal_selesai, area_fasilitas, estimasi_peserta, nama_ustadz, judul_kajian, deskripsi_kegiatan, is_multi_day_daily, tujuan_peminjaman')
      .eq('status', 'approved')
      .gte('tanggal_mulai', tomorrowStartISO)
      .lte('tanggal_mulai', tomorrowEndISO)

    if (fetchError) {
      console.error('Error fetching approved pengajuan for H-1 reminder:', fetchError)
      return NextResponse.json({ error: 'Database error', details: fetchError }, { status: 500 })
    }

    if (!approvedPengajuan || approvedPengajuan.length === 0) {
      return NextResponse.json({ message: 'No approved events scheduled for tomorrow' })
    }

    // 2. Filter OUT routine MAKT events (non-routine events only)
    const targetEvents = approvedPengajuan.filter(ev => {
      const isRutinNum = ev.nomor_pengajuan?.toUpperCase().startsWith('RUTIN-')
      const isRutinDaily = ev.is_multi_day_daily === true
      const isRutinTujuan = ev.tujuan_peminjaman?.toLowerCase().includes('kajian rutin')
      return !isRutinNum && !isRutinDaily && !isRutinTujuan
    })

    if (targetEvents.length === 0) {
      return NextResponse.json({ message: 'Only routine MAKT events found for tomorrow, no applicant events to remind.' })
    }

    // 3. Filter out events that ALREADY have an H-1 reminder sent
    const { data: existingLogs } = await supabase
      .from('pengajuan_timeline')
      .select('pengajuan_id')
      .in('pengajuan_id', targetEvents.map(e => e.id))
      .ilike('catatan', '%[REMINDER_H1_OPERASIONAL]%')

    const alreadyRemindedIds = new Set((existingLogs || []).map(l => l.pengajuan_id))
    const unremindedEvents = targetEvents.filter(e => !alreadyRemindedIds.has(e.id))

    if (unremindedEvents.length === 0) {
      return NextResponse.json({ message: 'All tomorrow events have already been reminded to Manajer Operasional.' })
    }

    // 4. Find recipient: Ustadz Roni (Manajer Operasional MAKT)
    let managerPhone = '6282175426357'
    let managerName = 'Ust. Roni Wijaya Ningrat'

    const { data: managerProfiles } = await supabase
      .from('user_profiles')
      .select('full_name, whatsapp, jabatan, system_role')
      .or('system_role.eq.admin_makt,jabatan.ilike.%Manajer Operasional%,full_name.ilike.%Roni%')
      .not('whatsapp', 'is', null)
      .limit(1)

    if (managerProfiles && managerProfiles.length > 0 && managerProfiles[0].whatsapp) {
      managerPhone = managerProfiles[0].whatsapp
      managerName = managerProfiles[0].full_name || managerName
    }

    // 5. Build agenda summary message
    const formattedDateStr = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta'
    }).format(tomorrowWibStart)

    let messageBody = `🔔 *PENGINGAT H-1 AGENDA KEGIATAN MAKT* 🔔\n`
    messageBody += `*Masjid Agung Kubah Timah*\n\n`
    messageBody += `Assalamu'alaikum Wr. Wb.\n`
    messageBody += `Yth. *${managerName}* (Manajer Operasional MAKT),\n\n`
    messageBody += `Mengingatkan bahwa **ESOK HARI** (*${formattedDateStr}*), terdapat ${unremindedEvents.length} agenda kegiatan dari pemohon yang disetujui di sistem:\n\n`

    unremindedEvents.forEach((ev, idx) => {
      let timeStr = '-'
      try {
        const start = new Date(ev.tanggal_mulai)
        const end = new Date(ev.tanggal_selesai)
        const startT = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
        const endT = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
        timeStr = `${startT} - ${endT} WIB`
      } catch (e) {}

      const lokasi = Array.isArray(ev.area_fasilitas) ? ev.area_fasilitas.join(', ') : (ev.area_fasilitas || 'Masjid Agung Kubah Timah')

      messageBody += `📌 *${idx + 1}. ${ev.nama_event}*\n`
      messageBody += `• *Pemohon:* ${ev.nama_pemohon || '-'}${ev.nama_lembaga ? ` (${ev.nama_lembaga})` : ''}\n`
      messageBody += `• *Jenis Event:* ${ev.jenis_event || '-'}\n`
      messageBody += `• *Waktu:* ${timeStr}\n`
      messageBody += `• *Lokasi:* ${lokasi}\n`
      if (ev.nama_ustadz) messageBody += `• *Narasumber/Ustadz:* Ust. ${ev.nama_ustadz}\n`
      if (ev.estimasi_peserta) messageBody += `• *Est. Peserta:* ${ev.estimasi_peserta} orang\n`
      if (ev.whatsapp) messageBody += `• *Kontak Pemohon:* ${ev.whatsapp}\n`
      messageBody += `\n`
    })

    messageBody += `Mohon kesiapan sarana, prasarana, serta koordinasi tim operasional lapangan.\n\n`
    messageBody += `Detail selengkapnya dapat dilihat di:\nhttps://event.kubahtimah.com/admin/kalender\n\n`
    messageBody += `Terima kasih.\n---\n*Sistem Event MAKT*`

    // 6. Send WA notification
    const waResult = await sendWhatsAppNotification({
      recipient_name: managerName,
      recipient_whatsapp: managerPhone,
      message: messageBody
    })

    // 7. Log to pengajuan_timeline for each event so it won't repeat
    const remindedEventIds: string[] = []
    if (waResult.success) {
      for (const ev of unremindedEvents) {
        const { error: logErr } = await supabase.from('pengajuan_timeline').insert({
          pengajuan_id: ev.id,
          status_lama: 'approved',
          status_baru: 'approved',
          catatan: '[REMINDER_H1_OPERASIONAL] Pengingat H-1 kegiatan dikirim ke Manajer Operasional (Ust. Roni)',
          dibuat_oleh_nama: 'Cron H-1 Operasional'
        })
        if (!logErr) remindedEventIds.push(ev.id)
      }
    }

    return NextResponse.json({
      success: waResult.success,
      message: `H-1 reminder sent to ${managerName} (${managerPhone}) for ${unremindedEvents.length} event(s).`,
      reminded_events: unremindedEvents.map(e => ({ id: e.id, title: e.nama_event, date: e.tanggal_mulai })),
      wa_result: waResult
    })

  } catch (error: any) {
    console.error('Error in H-1 reminder cron:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
