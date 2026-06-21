import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// We need service_role to bypass RLS in cron jobs
export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for cron
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(req.url)
    const isForce = searchParams.get('force') === '1'

    // 1. Get pengajuan that are pending/under review
    let query = supabase
      .from('pengajuan_peminjaman')
      .select('id, nomor_pengajuan, status, jenis_event, current_approval_level, updated_at, last_reminder_sent_at, nama_event, tanggal_mulai, nama_pemohon')
      .in('status', ['submitted', 'under_review'])

    if (!isForce) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
      query = query
        .lt('updated_at', twentyFourHoursAgo)
        .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${twentyThreeHoursAgo}`)
    }

    const { data: pendingPengajuan, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching pengajuan:', fetchError)
      return NextResponse.json({ error: 'Database error', details: fetchError }, { status: 500 })
    }

    if (!pendingPengajuan || pendingPengajuan.length === 0) {
      return NextResponse.json({ message: 'No pending approvals need reminding' })
    }

    const remindersSent: string[] = []
    const debugLogs: string[] = []
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
      debugLogs.push(`Processing pengajuan ${pengajuan.id}`)
      // Look up jenis_event ID
      const { data: jEvent } = await supabase
        .from('jenis_event')
        .select('id')
        .eq('name', pengajuan.jenis_event)
        .maybeSingle()
        
      if (!jEvent) {
        debugLogs.push(`Jenis event ${pengajuan.jenis_event} not found`)
        continue
      }

      // Find the approver for this level
      const { data: workflow, error: wfError } = await supabase
        .from('workflow_approval')
        .select('user_id, jabatan')
        .eq('jenis_event_id', jEvent.id)
        .eq('level', pengajuan.current_approval_level)
        .single()

      if (wfError || (!workflow?.user_id && !workflow?.jabatan)) {
        debugLogs.push(`No approver found for level ${pengajuan.current_approval_level}, wfError: ${wfError?.message}`)
        continue
      }

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

      if (profError || !profile?.whatsapp) {
        debugLogs.push(`No whatsapp number for approver level ${pengajuan.current_approval_level}`)
        continue
      }

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
        debugLogs.push(`Sending WA summary to ${group.whatsapp} with ${group.events.length} events`)
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
            debugLogs.push(`Success sending WA summary and updating db`)
          } else {
             debugLogs.push(`Success sending WA summary but failed to update db: ${updErr.message}`)
          }
        } else {
          const errText = await waRes.text()
          debugLogs.push(`Failed to send WA summary: ${errText}`)
        }
      } catch (waErr: any) {
        debugLogs.push(`Exception sending WA: ${waErr.message || String(waErr)}`)
      }
    }

    return NextResponse.json({ 
      message: 'Cron job completed', 
      reminders_sent_count: remindersSent.length,
      pengajuan_ids: remindersSent,
      debug_logs: debugLogs
    })

  } catch (error: any) {
    console.error('Cron Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message || String(error) }, { status: 500 })
  }
}
