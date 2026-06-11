import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendWhatsAppNotification, tplPengajuanBerhasil, tplNotifikasiAdmin } from "@/app/actions/notification"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const nomor = searchParams.get("nomor")
    
    if (!nomor) {
      return NextResponse.json({ error: "Parameter 'nomor' wajib diisi" }, { status: 400 })
    }

    const supabase = createClient()
    const { data: pengajuan, error: pError } = await supabase
      .from("pengajuan_peminjaman")
      .select("*")
      .eq("nomor_pengajuan", nomor.toUpperCase().trim())
      .maybeSingle()

    if (pError) throw pError
    if (!pengajuan) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 })
    }

    const { data: timeline, error: tError } = await supabase
      .from("pengajuan_timeline")
      .select("*")
      .eq("pengajuan_id", pengajuan.id)
      .order("created_at", { ascending: false })

    if (tError) throw tError

    return NextResponse.json({ success: true, data: { pengajuan, timeline } })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createClient()

    // --- CEK BENTROK JADWAL DAN RUANGAN ---
    const mulai = new Date(body.tanggal_mulai)
    const selesai = new Date(body.tanggal_selesai)
    
    const { data: overlaps, error: overlapError } = await supabase
      .from('pengajuan_peminjaman')
      .select('nomor_pengajuan, nama_event, status')
      .in('status', ['submitted', 'under_review', 'revision_requested', 'approved'])
      .lt('tanggal_mulai', selesai.toISOString())
      .gt('tanggal_selesai', mulai.toISOString())
      .overlaps('area_fasilitas', body.area_fasilitas)
      .limit(1)

    if (overlapError) throw overlapError

    if (overlaps && overlaps.length > 0) {
      return NextResponse.json({ 
        error: `Mohon maaf, fasilitas pada waktu tersebut sudah lebih dulu dipesan untuk acara ${overlaps[0].nama_event}. Silakan sesuaikan kembali pilihan waktu atau ruangan Anda.` 
      }, { status: 400 })
    }
    // --------------------------------------

    const { data, error } = await supabase.rpc("submit_pengajuan", { pengajuan_data: body })

    if (error) throw error

    // Send WA Notifications asynchronously (fire and forget)
    if (data && data.id) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      const adminUrl = `${appUrl}/admin/pengajuan/${data.id}`
      const statusUrl = `${appUrl}/cek-status?nomor=${data.nomor_pengajuan}`
      
      // 1. To Admin
      let adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "081234567890" 
      let adminName = "Admin MAKT"

      try {
        const supabaseAdmin = createAdminClient()
        
        // Coba cari dari workflow
        const { data: jEvent } = await supabaseAdmin.from('jenis_event').select('id').eq('name', body.jenis_event).maybeSingle()
        if (jEvent) {
          const { data: wfSteps } = await supabaseAdmin.from('workflow_approval').select('*').eq('jenis_event_id', jEvent.id).eq('is_active', true).order('level', { ascending: true }).limit(1)
          if (wfSteps && wfSteps.length > 0) {
            const step1 = wfSteps[0]
            let q = supabaseAdmin.from('user_profiles').select('full_name, whatsapp').not('whatsapp', 'is', null).neq('whatsapp', '')
            if (step1.user_id) q = q.eq('user_id', step1.user_id)
            else if (step1.jabatan) q = q.ilike('jabatan', step1.jabatan)
            else q = q.eq('system_role', 'super_admin')

            const { data: approvers } = await q.limit(1)
            if (approvers && approvers.length > 0 && approvers[0].whatsapp) {
              adminPhone = approvers[0].whatsapp
              adminName = approvers[0].full_name || step1.jabatan || adminName
            }
          }
        }
        
        // Fallback: Jika adminPhone masih dummy, cari super_admin pertama yang punya WA
        if (adminPhone === "081234567890") {
          const { data: superAdmins } = await supabaseAdmin.from('user_profiles')
            .select('full_name, whatsapp')
            .eq('system_role', 'super_admin')
            .not('whatsapp', 'is', null)
            .neq('whatsapp', '')
            .limit(1)
            
          if (superAdmins && superAdmins.length > 0) {
            adminPhone = superAdmins[0].whatsapp
            adminName = superAdmins[0].full_name || "Super Admin"
          }
        }
      } catch (err) {
        console.error("Gagal mendapatkan WA approver pertama:", err)
      }

      await sendWhatsAppNotification({
        recipient_name: adminName,
        recipient_whatsapp: adminPhone,
        message: await tplNotifikasiAdmin(data.nomor_pengajuan, body.nama_pemohon, body.nama_event, body.tanggal_mulai, adminUrl),
        related_event_request_id: data.id
      }).catch(e => console.error("WA Admin failed", e))

      // 2. To Pemohon
      if (body.whatsapp) {
        await sendWhatsAppNotification({
          recipient_name: body.nama_pemohon,
          recipient_whatsapp: body.whatsapp,
          message: await tplPengajuanBerhasil(data.nomor_pengajuan, body.nama_event, statusUrl),
          related_event_request_id: data.id
        }).catch(e => console.error("WA Pemohon failed", e))
      }
    }

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
