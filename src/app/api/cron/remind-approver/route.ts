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

    const { data: pendingPengajuan, error: fetchError } = await supabase
      .from('pengajuan_peminjaman')
      .select('id, nomor_pengajuan, status, jenis_event, current_approval_level, updated_at, last_reminder_sent_at, nama_event')
      .in('status', ['submitted', 'under_review'])
      .lt('updated_at', twentyFourHoursAgo)
      // also ensure last_reminder is null OR < 24 hours ago
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${twentyFourHoursAgo}`)

    if (fetchError) {
      console.error('Error fetching pengajuan:', fetchError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!pendingPengajuan || pendingPengajuan.length === 0) {
      return NextResponse.json({ message: 'No pending approvals need reminding' })
    }

    const remindersSent = []
    const baseUrl = new URL(req.url).origin

    // 2. Iterate through pending pengajuan
    for (const pengajuan of pendingPengajuan) {
      // Look up jenis_event ID
      const { data: jEvent } = await supabase
        .from('jenis_event')
        .select('id')
        .eq('name', pengajuan.jenis_event)
        .maybeSingle()
        
      if (!jEvent) {
        console.log(`Jenis event ${pengajuan.jenis_event} not found for pengajuan ${pengajuan.id}`)
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
        console.log(`No approver found for pengajuan ${pengajuan.id} at level ${pengajuan.current_approval_level}`)
        continue
      }

      // Find the user's phone number and profile
      let profileQuery = supabase
        .from('user_profiles')
        .select('full_name, whatsapp')
        
      if (workflow.user_id) {
        profileQuery = profileQuery.eq('id', workflow.user_id)
      } else if (workflow.jabatan) {
        profileQuery = profileQuery.ilike('jabatan', workflow.jabatan)
      }

      const { data: profiles, error: profError } = await profileQuery.limit(1)
      const profile = profiles && profiles.length > 0 ? profiles[0] : null

      if (profError || !profile?.whatsapp) {
        console.log(`No whatsapp number for approver level ${pengajuan.current_approval_level}`)
        continue
      }

      const eventTitle = pengajuan.nama_event || 'Event'
      
      const payload = {
        number: profile.whatsapp,
        template_type: 'approval_reminder',
        nama_approver: profile.full_name || workflow.jabatan,
        event_title: eventTitle,
        pemohon: 'Pemohon', // Or we could fetch user_id of pengajuan, but let's keep it simple
        link_approval: `${baseUrl}/dashboard/approvals`, // Assuming this is the link
      }

      try {
        const waRes = await fetch(`${baseUrl}/api/send-wa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (waRes.ok) {
          // 4. Update last_reminder_sent_at
          await supabase
            .from('pengajuan_peminjaman')
            .update({ last_reminder_sent_at: new Date().toISOString() })
            .eq('id', pengajuan.id)

          remindersSent.push(pengajuan.id)
        } else {
          console.error(`Failed to send WA to ${profile.whatsapp}:`, await waRes.text())
        }
      } catch (waErr) {
        console.error(`Exception sending WA to ${profile.whatsapp}:`, waErr)
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
