'use server'

import { createAdminClient } from '@/lib/supabase/server'

export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const prefix = formData.get('prefix') as string
    
    if (!file) {
      throw new Error("File is missing")
    }

    const supabaseAdmin = createAdminClient()
    const ext = file.name.split('.').pop()
    const fileName = `${prefix}_${Date.now()}.${ext}`
    
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const { data, error } = await supabaseAdmin.storage
      .from('pengajuan_assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })
      
    if (error) {
      throw new Error(error.message)
    }
    
    const { data: urlData } = supabaseAdmin.storage.from('pengajuan_assets').getPublicUrl(fileName)
    return { url: urlData.publicUrl }
  } catch (error: any) {
    console.error("Upload error:", error)
    return { error: error.message }
  }
}
