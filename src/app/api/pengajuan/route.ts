import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
