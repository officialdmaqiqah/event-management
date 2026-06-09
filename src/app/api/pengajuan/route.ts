import { createClient } from "@/lib/supabase/server"
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
    const { data, error } = await supabase.rpc("submit_pengajuan", { pengajuan_data: body })

    if (error) throw error

    // Send WA Notifications asynchronously (fire and forget)
    if (data && data.id) {
      const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/pengajuan/${data.id}`
      const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cek-status?nomor=${data.nomor_pengajuan}`
      
      // 1. To Admin
      let adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "081234567890" 
      let adminName = "Admin MAKT"

      try {
        const { data: jEvent } = await supabase.from('jenis_event').select('id').eq('name', body.jenis_event).maybeSingle()
        if (jEvent) {
          const { data: wfSteps } = await supabase.from('workflow_approval').select('*').eq('jenis_event_id', jEvent.id).eq('is_active', true).order('level', { ascending: true }).limit(1)
          if (wfSteps && wfSteps.length > 0) {
            const step1 = wfSteps[0]
            let q = supabase.from('user_profiles').select('full_name, whatsapp').not('whatsapp', 'is', null)
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
      } catch (err) {
        console.error("Gagal mendapatkan WA approver pertama:", err)
      }

      sendWhatsAppNotification({
        recipient_name: adminName,
        recipient_whatsapp: adminPhone,
        message: await tplNotifikasiAdmin(data.nomor_pengajuan, body.nama_pemohon, body.nama_event, body.tanggal_mulai, adminUrl),
        related_event_request_id: data.id
      }).catch(e => console.error("WA Admin failed", e))

      // 2. To Pemohon
      if (body.nomor_whatsapp) {
        sendWhatsAppNotification({
          recipient_name: body.nama_pemohon,
          recipient_whatsapp: body.nomor_whatsapp,
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
