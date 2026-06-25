import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendWhatsAppNotification, tplPengajuanBerhasil, tplNotifikasiAdmin, tplNotifikasiApprover } from "@/app/actions/notification"

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
    
    const { data: potentialOverlaps, error: overlapError } = await supabase
      .from('pengajuan_peminjaman')
      .select('nomor_pengajuan, nama_event, status, tanggal_mulai, tanggal_selesai, is_multi_day_daily')
      .in('status', ['submitted', 'under_review', 'revision_requested', 'approved'])
      .lt('tanggal_mulai', selesai.toISOString())
      .gt('tanggal_selesai', mulai.toISOString())
      .overlaps('area_fasilitas', body.area_fasilitas)

    if (overlapError) throw overlapError

    let actualOverlap = null;

    if (potentialOverlaps && potentialOverlaps.length > 0) {
      const getIntervals = (startStr: string | Date, endStr: string | Date, isDaily: boolean) => {
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (!isDaily) {
          return [{ s: start.getTime(), e: end.getTime() }];
        }
        
        const intervals = [];
        let current = new Date(start);
        current.setHours(0,0,0,0);
        const lastDay = new Date(end);
        lastDay.setHours(0,0,0,0);
        
        while (current <= lastDay) {
          const s = new Date(current);
          s.setHours(start.getHours(), start.getMinutes(), 0, 0);
          const e = new Date(current);
          e.setHours(end.getHours(), end.getMinutes(), 0, 0);
          intervals.push({ s: s.getTime(), e: e.getTime() });
          current.setDate(current.getDate() + 1);
        }
        return intervals;
      };

      const newIntervals = getIntervals(mulai, selesai, body.is_multi_day_daily);

      for (const po of potentialOverlaps) {
        const poIntervals = getIntervals(po.tanggal_mulai, po.tanggal_selesai, po.is_multi_day_daily);
        
        let hasOverlap = false;
        for (const a of newIntervals) {
          for (const b of poIntervals) {
            if (a.s < b.e && a.e > b.s) {
              hasOverlap = true;
              break;
            }
          }
          if (hasOverlap) break;
        }

        if (hasOverlap) {
          actualOverlap = po;
          break;
        }
      }
    }

    if (actualOverlap) {
      return NextResponse.json({ 
        error: `Mohon maaf, fasilitas pada waktu tersebut sudah lebih dulu dipesan untuk acara ${actualOverlap.nama_event}. Silakan sesuaikan kembali pilihan waktu atau ruangan Anda.` 
      }, { status: 400 })
    }
    // --------------------------------------

    const { data, error } = await supabase.rpc("submit_pengajuan", { pengajuan_data: body })

    if (error) throw error

    // Send WA Notifications asynchronously (fire and forget)
    if (data && data.id) {
      const isLocal = process.env.NODE_ENV === 'development'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (isLocal ? 'http://localhost:3000' : 'https://event.kubahtimah.com')
      const adminUrl = `${appUrl}/admin/pengajuan/${data.id}`
      const statusUrl = `${appUrl}/cek-status?nomor=${data.nomor_pengajuan}`
      
      // 1. To Admin
      let adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || "081234567890" 
      let adminName = "Admin MAKT"
      let isAdminFallback = false
      let sysTemplate = null

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
        
        // Selalu ambil template dari super admin
        const { data: superAdmins } = await supabaseAdmin.from('user_profiles')
          .select('full_name, whatsapp, wa_approval_request_template')
          .eq('system_role', 'super_admin')
          .limit(1)
          
        if (superAdmins && superAdmins.length > 0) {
          sysTemplate = superAdmins[0].wa_approval_request_template
          
          // Fallback: Jika adminPhone masih dummy, cari super_admin pertama yang punya WA
          if (adminPhone === "081234567890" && superAdmins[0].whatsapp) {
            adminPhone = superAdmins[0].whatsapp
            adminName = superAdmins[0].full_name || "Super Admin"
            isAdminFallback = true
          }
        }
      } catch (err) {
        console.error("Gagal mendapatkan WA approver pertama:", err)
      }

      let waMessage = ""
      if (isAdminFallback) {
        waMessage = await tplNotifikasiAdmin(data.nomor_pengajuan, body.nama_pemohon, body.nama_event, body.tanggal_mulai, adminUrl)
      } else {
        if (sysTemplate) {
          let tglFormat = body.tanggal_mulai || ''
          if (body.tanggal_mulai) {
            try {
              const d = new Date(body.tanggal_mulai)
              tglFormat = new Intl.DateTimeFormat('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
              }).format(d).replace(/\./g, ':') + ' WIB'
            } catch (e) {}
          }
          waMessage = sysTemplate
            .replace(/{{nama_approver}}/g, adminName)
            .replace(/{{nama_event}}/g, body.nama_event)
            .replace(/{{jenis_event}}/g, body.jenis_event || '-')
            .replace(/{{tanggal_event}}/g, tglFormat)
            .replace(/{{pemohon}}/g, body.nama_pemohon)
            .replace(/{{link_approval}}/g, adminUrl)
        } else {
          waMessage = await tplNotifikasiApprover(body.nama_event, body.jenis_event, body.nama_pemohon, body.tanggal_mulai, "", adminUrl, adminName)
        }
      } await sendWhatsAppNotification({
        recipient_name: adminName,
        recipient_whatsapp: adminPhone,
        message: waMessage,
        related_event_request_id: data.id
      }).catch(e => console.error("WA Admin/Approver failed", e))

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
