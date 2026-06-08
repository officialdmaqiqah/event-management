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
      // In a real app, you'd query the admin's phone number from user_profiles. Here we simulate or use a hardcoded admin number from env for testing.
      const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "081234567890" 
      sendWhatsAppNotification({
        recipient_name: "Admin MAKT",
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
