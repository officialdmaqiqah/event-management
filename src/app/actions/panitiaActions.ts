'use server'

import { createAdminClient } from '@/lib/supabase/server'

// Helper to verify event ownership and return associated request ID
async function verifyEventAndGetRequestId(eventId: string) {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('event_request_id')
    .eq('id', eventId)
    .single()

  if (error || !data || !data.event_request_id) {
    throw new Error('Event tidak ditemukan atau akses ditolak.')
  }

  return data.event_request_id
}

// 1. Fetch meeting minutes & action items
export async function fetchMeetingMinutesAction(eventId: string) {
  try {
    const requestId = await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const { data: minutes, error: minutesError } = await supabaseAdmin
      .from('meeting_minutes')
      .select('*')
      .eq('pengajuan_id', requestId)
      .maybeSingle()

    if (minutesError) throw minutesError

    let actionItems: any[] = []
    if (minutes) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('meeting_action_items')
        .select('*')
        .eq('meeting_minutes_id', minutes.id)
        .order('created_at', { ascending: true })

      if (itemsError) throw itemsError
      actionItems = items || []
    }

    return { minutes, actionItems }
  } catch (error: any) {
    console.error('fetchMeetingMinutesAction error:', error)
    return { error: error.message }
  }
}

// 2. Save meeting minutes (Insert/Update)
export async function saveMeetingMinutesAction(eventId: string, form: any, isFinal: boolean) {
  try {
    const requestId = await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    // Fetch existing minutes
    const { data: existing } = await supabaseAdmin
      .from('meeting_minutes')
      .select('id')
      .eq('pengajuan_id', requestId)
      .maybeSingle()

    const payload = {
      pengajuan_id: requestId,
      meeting_title: form.meeting_title,
      meeting_type: form.meeting_type,
      meeting_date: form.meeting_date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location,
      chairperson_name: form.chairperson_name,
      secretary_name: form.secretary_name,
      agenda: form.agenda,
      discussion_summary: form.discussion_summary,
      decisions: form.decisions,
      important_notes: form.important_notes,
      privacy_level: form.privacy_level,
      is_published: form.is_published,
      status: isFinal ? 'finalized' : 'draft',
      updated_at: new Date().toISOString()
    }

    if (existing?.id) {
      const { data, error } = await supabaseAdmin
        .from('meeting_minutes')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return { minutes: data }
    } else {
      const { data, error } = await supabaseAdmin
        .from('meeting_minutes')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return { minutes: data }
    }
  } catch (error: any) {
    console.error('saveMeetingMinutesAction error:', error)
    return { error: error.message }
  }
}

// 3. Update public publication toggle
export async function togglePublishAction(eventId: string, minutesId: string, isPublished: boolean) {
  try {
    await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const payload = {
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null
    }

    const { data, error } = await supabaseAdmin
      .from('meeting_minutes')
      .update(payload)
      .eq('id', minutesId)
      .select()
      .single()

    if (error) throw error
    return { minutes: data }
  } catch (error: any) {
    console.error('togglePublishAction error:', error)
    return { error: error.message }
  }
}

// 4. Save/Add action item
export async function addActionItemAction(eventId: string, minutesId: string, newAi: any) {
  try {
    await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
      .from('meeting_action_items')
      .insert({
        meeting_minutes_id: minutesId,
        description: newAi.description,
        assignee_name: newAi.assignee_name,
        deadline: newAi.deadline || null,
        status: newAi.status || 'pending',
        notes: newAi.notes || ''
      })
      .select()
      .single()

    if (error) throw error
    return { actionItem: data }
  } catch (error: any) {
    console.error('addActionItemAction error:', error)
    return { error: error.message }
  }
}

// 5. Delete action item
export async function deleteActionItemAction(eventId: string, itemId: string) {
  try {
    await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('meeting_action_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('deleteActionItemAction error:', error)
    return { error: error.message }
  }
}

// 6. Fetch documentation photos
export async function fetchPhotosAction(eventId: string) {
  try {
    const requestId = await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    // Get meeting minutes ID
    const { data: minutes } = await supabaseAdmin
      .from('meeting_minutes')
      .select('id')
      .eq('pengajuan_id', requestId)
      .maybeSingle()

    if (!minutes) {
      return { photos: [], meetingMinutesId: null }
    }

    const { data: photos, error } = await supabaseAdmin
      .from('meeting_photos')
      .select('*')
      .eq('meeting_minutes_id', minutes.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return { photos, meetingMinutesId: minutes.id }
  } catch (error: any) {
    console.error('fetchPhotosAction error:', error)
    return { error: error.message }
  }
}

// 7. Upload photo to Storage and save to meeting_photos database (Server side)
export async function uploadMeetingPhotoAction(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string
    const meetingMinutesId = formData.get('meetingMinutesId') as string
    const pengajuanId = formData.get('pengajuanId') as string

    if (!file) throw new Error('File gambar tidak ditemukan.')
    if (!eventId) throw new Error('Event ID tidak ditemukan.')
    if (!meetingMinutesId) throw new Error('ID Notulen tidak ditemukan.')
    if (!pengajuanId) throw new Error('ID Pengajuan tidak ditemukan.')

    await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${pengajuanId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('meeting_documentation')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('meeting_documentation')
      .getPublicUrl(fileName)

    const { data: photoData, error: dbError } = await supabaseAdmin
      .from('meeting_photos')
      .insert({
        meeting_minutes_id: meetingMinutesId,
        photo_url: publicUrlData.publicUrl,
        caption: '',
        visibility: 'internal'
      })
      .select()
      .single()

    if (dbError) throw dbError

    return { photo: photoData }
  } catch (error: any) {
    console.error('uploadMeetingPhotoAction error:', error)
    return { error: error.message }
  }
}

// 8. Update photo caption
export async function updatePhotoCaptionAction(eventId: string, photoId: string, caption: string) {
  try {
    await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('meeting_photos')
      .update({ caption })
      .eq('id', photoId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('updatePhotoCaptionAction error:', error)
    return { error: error.message }
  }
}

// 9. Update photo visibility
export async function updatePhotoVisibilityAction(eventId: string, photoId: string, visibility: string) {
  try {
    await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('meeting_photos')
      .update({ visibility })
      .eq('id', photoId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('updatePhotoVisibilityAction error:', error)
    return { error: error.message }
  }
}

// 10. Delete photo from DB and Storage
export async function deletePhotoAction(eventId: string, photoId: string) {
  try {
    await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    // Get photo detail to find file path in storage
    const { data: photo } = await supabaseAdmin
      .from('meeting_photos')
      .select('photo_url')
      .eq('id', photoId)
      .single()

    if (photo) {
      // 1. Delete from DB
      const { error: dbError } = await supabaseAdmin
        .from('meeting_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // 2. Delete from Storage
      try {
        const urlObj = new URL(photo.photo_url)
        const pathParts = urlObj.pathname.split('/meeting_documentation/')
        if (pathParts.length > 1) {
          const filePath = decodeURIComponent(pathParts[1])
          await supabaseAdmin.storage.from('meeting_documentation').remove([filePath])
        }
      } catch (e) {
        console.error('Gagal menghapus file dari storage:', e)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('deletePhotoAction error:', error)
    return { error: error.message }
  }
}

// 11. Add manual participant from Guest Dashboard
export async function guestAddParticipantAction(eventId: string, pData: any) {
  try {
    const requestId = await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const ticketCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    const { data, error } = await supabaseAdmin
      .from('participants')
      .insert({
        event_id: eventId,
        event_request_id: requestId,
        full_name: pData.full_name,
        whatsapp: pData.whatsapp,
        organization: pData.organization || '',
        ticket_quantity: 1,
        ticket_code: ticketCode,
        status: 'attended',
        checked_in_at: new Date().toISOString(),
        attendance_type: 'internal',
        check_in_method: 'manual'
      })
      .select()
      .single()

    if (error) throw error
    return { participant: data }
  } catch (error: any) {
    console.error('guestAddParticipantAction error:', error)
    return { error: error.message }
  }
}

// 12. Check in a registered participant manually
export async function checkInParticipantAction(eventId: string, participantId: string) {
  try {
    await verifyEventAndGetRequestId(eventId)
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
      .from('participants')
      .update({
        status: 'attended',
        checked_in_at: new Date().toISOString(),
        check_in_method: 'manual'
      })
      .eq('id', participantId)
      .select()
      .single()

    if (error) throw error
    return { participant: data }
  } catch (error: any) {
    console.error('checkInParticipantAction error:', error)
    return { error: error.message }
  }
}
