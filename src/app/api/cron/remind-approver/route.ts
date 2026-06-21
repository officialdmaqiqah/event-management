import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// We need service_role to bypass RLS in cron jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for cron

export async function GET(req: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get pengajuan that are pending/under review and updated > 24h ago
    // and reminder hasn't been sent in the last 24h.
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() // For cron jitter

    const { data: pendingPengajuan, error: fetchError } = await supabase
      .from('pengajuan_peminjaman')
      .select('id, nomor_pengajuan, status, jenis_event, current_approval_level, updated_at, last_reminder_sent_at, nama_event, tanggal_mulai, nama_pemohon')
      .in('status', ['submitted', 'under_review'])
      .lt('updated_at', twentyFourHoursAgo)
      // ensure last_reminder is null OR < 23 hours ago (to allow 1h Vercel cron jitter)
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${twentyThreeHoursAgo}`)

    if (fetchError) {
      console.error('Error fetching pengajuan:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!pendingPengajuan || pendingPengajuan.length === 0) {
      return NextResponse.json({ message: 'No pending approvals need reminding' })
    }

    const remindersSent = []
    const baseUrl = new URL(req.url).origin
    
    // Group pengajuan by approver's whatsapp
    interface ApproverGroup {
      whatsapp: string;
      nama_approver: string;
      events: string[];
      pengajuan_ids: string[];
    }
    const approverMap = new Map<string, ApproverGroup>()

    // 2. Iterate through pending pengajuan to group them
    for (const pengajuan of pendingPengajuan) {
      // Look up jenis_event ID
      const { data: jEvent } = await supabase
        .from('jenis_event')
        .select('id')
        .eq('name', pengajuan.jenis_event)
        .maybeSingle()
        
      if (!jEvent) continue

      // Find the approver for this level
      const { data: workflow, error: wfError } = await supabase
        .from('workflow_approval')
        .select('user_id, jabatan')
        .eq('jenis_event_id', jEvent.id)
        .eq('level', pengajuan.current_approval_level)
        .single()

      if (wfError || (!workflow?.user_id && !workflow?.jabatan)) continue

      // Find the user's phone number and profile
      let profileQuery = supabase
        .from('user_profiles')
        .select('full_name, whatsapp')
        
      if (workflow.user_id) {
        profileQuery = profileQuery.eq('user_id', workflow.user_id)
      } else if (workflow.jabatan) {
        profileQuery = profileQuery.ilike('jabatan', workflow.jabatan)
      }

      const { data: profiles, error: profError } = await profileQuery.limit(1)
      const profile = profiles && profiles.length > 0 ? profiles[0] : null

      if (profError || !profile?.whatsapp) continue

      const eventTitle = pengajuan.nama_event || 'Event'
      
      const group = approverMap.get(profile.whatsapp) || {
        whatsapp: profile.whatsapp,
        nama_approver: profile.full_name || workflow.jabatan,
        events: [],
        pengajuan_ids: []
      }
      
      let tgl = '-'
      if (pengajuan.tanggal_mulai) {
        tgl = new Date(pengajuan.tanggal_mulai).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
      }
      
      const idx = group.events.length + 1
      group.events.push(`${idx}. ${eventTitle}, ${tgl}, ${pengajuan.nama_pemohon || '-'}`)
      group.pengajuan_ids.push(pengajuan.id)
      approverMap.set(profile.whatsapp, group)
    }

    // 3. Send grouped WA messages
    for (const group of Array.from(approverMap.values())) {
      const payload = {
        number: group.whatsapp,
        template_type: 'approval_reminder_summary',
        nama_approver: group.nama_approver,
        count: group.events.length,
        event_list: group.events.join('\n'),
        link_approval: `${baseUrl}/admin/approval`,
      }

      try {
        const waRes = await fetch(`${baseUrl}/api/send-wa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (waRes.ok) {
          // 4. Update last_reminder_sent_at for all in this group
          const { error: updErr } = await supabase
            .from('pengajuan_peminjaman')
            .update({ last_reminder_sent_at: new Date().toISOString() })
            .in('id', group.pengajuan_ids)

          if (!updErr) {
            remindersSent.push(...group.pengajuan_ids)
          }
        } else {
          console.error(`Failed to send WA to ${group.whatsapp}:`, await waRes.text())
        }
      } catch (waErr) {
        console.error(`Exception sending WA to ${group.whatsapp}:`, waErr)
      }
    }

    return NextResponse.json({ 
      message: 'Cron job completed', 
      reminders_sent_count: remindersSent.length,
      pengajuan_ids: remindersSent 
    })

  } catch (error) {
    console.error('Cron Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
