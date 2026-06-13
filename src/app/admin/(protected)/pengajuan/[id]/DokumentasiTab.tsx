"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MeetingPhoto } from "@/types/notulen"
import { Image as ImageIcon, UploadCloud, Trash2, Loader2, Save, Eye, EyeOff, ShieldAlert } from "lucide-react"
import { 
  fetchPhotosAction,
  uploadMeetingPhotoAction,
  updatePhotoCaptionAction,
  updatePhotoVisibilityAction,
  deletePhotoAction
} from "@/app/actions/panitiaActions"

export default function DokumentasiTab({ 
  pengajuanId,
  isGuest = false,
  eventId
}: { 
  pengajuanId?: string,
  isGuest?: boolean,
  eventId?: string
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [meetingMinutesId, setMeetingMinutesId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<MeetingPhoto[]>([])
  
  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  useEffect(() => {
    fetchData()
  }, [pengajuanId, eventId])

  const fetchData = async () => {
    setLoading(true)
    if (isGuest && eventId) {
      const res = await fetchPhotosAction(eventId)
      if (res.error) {
        console.error("Gagal memuat foto:", res.error)
      } else {
        if (res.meetingMinutesId) setMeetingMinutesId(res.meetingMinutesId)
        if (res.photos) setPhotos(res.photos)
      }
    } else if (pengajuanId) {
      const { data: mnData } = await supabase
        .from("meeting_minutes")
        .select("id")
        .eq("pengajuan_id", pengajuanId)
        .maybeSingle()

      if (mnData) {
        setMeetingMinutesId(mnData.id)
        const { data: photoData } = await supabase
          .from("meeting_photos")
          .select("*")
          .eq("meeting_minutes_id", mnData.id)
          .order("created_at", { ascending: true })
        if (photoData) setPhotos(photoData)
      }
    }
    setLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!meetingMinutesId) {
      alert("Harap simpan draft Notulen terlebih dahulu sebelum mengunggah foto!")
      return
    }

    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadError("")

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          alert(`File ${file.name} melebihi batas 2MB.`)
          continue
        }

        if (isGuest && eventId) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('eventId', eventId)
          formData.append('meetingMinutesId', meetingMinutesId)
          formData.append('pengajuanId', pengajuanId || '')

          const res = await uploadMeetingPhotoAction(formData)
          if (res.error) {
            alert(`Gagal mengunggah ${file.name}: ${res.error}`)
            continue
          }
          if (res.photo) {
            setPhotos(prev => [...prev, res.photo])
          }
        } else {
          const fileExt = file.name.split('.').pop()
          const fileName = `${pengajuanId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('meeting_documentation')
            .upload(fileName, file)

          if (uploadError) throw uploadError

          const { data: publicUrlData } = supabase.storage
            .from('meeting_documentation')
            .getPublicUrl(fileName)

          const { data: photoData, error: dbError } = await supabase.from('meeting_photos').insert({
            meeting_minutes_id: meetingMinutesId,
            photo_url: publicUrlData.publicUrl,
            caption: "",
            visibility: 'internal'
          }).select().single()

          if (dbError) throw dbError

          setPhotos(prev => [...prev, photoData])
        }
      }
    } catch (err: any) {
      console.error(err)
      setUploadError(err.message || "Gagal mengunggah foto")
    } finally {
      setUploading(false)
      // reset input
      e.target.value = ""
    }
  }

  const updateCaption = async (id: string, caption: string) => {
    // Optimistic update
    setPhotos(photos.map(p => p.id === id ? { ...p, caption } : p))
    if (isGuest && eventId) {
      const res = await updatePhotoCaptionAction(eventId, id, caption)
      if (res.error) {
        alert("Gagal memperbarui keterangan: " + res.error)
      }
    } else {
      await supabase.from("meeting_photos").update({ caption }).eq("id", id)
    }
  }

  const updateVisibility = async (id: string, visibility: string) => {
    setPhotos(photos.map(p => p.id === id ? { ...p, visibility: visibility as any } : p))
    if (isGuest && eventId) {
      const res = await updatePhotoVisibilityAction(eventId, id, visibility)
      if (res.error) {
        alert("Gagal memperbarui visibilitas: " + res.error)
      }
    } else {
      await supabase.from("meeting_photos").update({ visibility }).eq("id", id)
    }
  }

  const deletePhoto = async (id: string) => {
    if (!confirm("Hapus foto ini?")) return
    
    // Find photo url
    const photo = photos.find(p => p.id === id)
    if (photo) {
      if (isGuest && eventId) {
        const res = await deletePhotoAction(eventId, id)
        if (res.error) {
          alert("Gagal menghapus foto: " + res.error)
        } else {
          setPhotos(photos.filter(p => p.id !== id))
        }
      } else {
        // Delete from DB
        await supabase.from("meeting_photos").delete().eq("id", id)
        
        // Attempt to delete from storage by extracting path
        try {
          const urlObj = new URL(photo.photo_url)
          const pathParts = urlObj.pathname.split('/meeting_documentation/')
          if (pathParts.length > 1) {
            const filePath = decodeURIComponent(pathParts[1])
            await supabase.storage.from('meeting_documentation').remove([filePath])
          }
        } catch (e) {
          console.error("Storage delete failed", e)
        }
        
        setPhotos(photos.filter(p => p.id !== id))
      }
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat Dokumentasi...</div>

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
          <ImageIcon className="h-4.5 w-4.5 text-indigo-600" /> Dokumentasi Foto Rapat
        </CardTitle>
        <CardDescription className="text-xs">Unggah foto-foto kegiatan. Format: JPG/PNG, Maks: 2MB per foto.</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-indigo-100 bg-indigo-50/30 rounded-xl p-8 text-center">
          <Input 
            type="file" 
            multiple 
            accept="image/jpeg, image/png, image/jpg" 
            onChange={handleFileUpload} 
            className="hidden" 
            id="photo-upload"
            disabled={uploading || !meetingMinutesId}
          />
          <Label htmlFor="photo-upload" className={`cursor-pointer flex flex-col items-center justify-center ${(!meetingMinutesId || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? (
              <Loader2 className="h-10 w-10 text-indigo-400 mb-3 animate-spin" />
            ) : (
              <UploadCloud className="h-10 w-10 text-indigo-500 mb-3" />
            )}
            <span className="text-sm font-bold text-slate-700">
              {uploading ? "Mengunggah..." : "Klik untuk Memilih Foto"}
            </span>
            <span className="text-xs text-slate-500 mt-1">Anda dapat memilih beberapa foto sekaligus</span>
          </Label>
          {!meetingMinutesId && (
            <p className="text-xs text-orange-600 font-semibold mt-4">⚠️ Buat dan simpan Draft Notulen terlebih dahulu sebelum bisa mengunggah foto.</p>
          )}
          {uploadError && <p className="text-xs text-red-600 font-semibold mt-4">{uploadError}</p>}
        </div>

        {/* Gallery */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            {photos.map(photo => (
              <div key={photo.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video w-full bg-slate-100 relative">
                  <img src={photo.photo_url} alt="Dokumentasi" className="object-cover w-full h-full" />
                  <button 
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
                  <div className="relative">
                    <Input 
                      placeholder="Tambahkan keterangan foto..." 
                      className="text-xs h-8 pr-8 border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white bg-transparent transition-all"
                      defaultValue={photo.caption || ""}
                      onBlur={(e) => updateCaption(photo.id, e.target.value)}
                    />
                    <Save className="h-3 w-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <select 
                      className="text-[10px] w-full border border-slate-200 rounded p-1 bg-white text-slate-600 focus:ring-0 focus:border-indigo-400"
                      value={photo.visibility || 'internal'}
                      onChange={(e) => updateVisibility(photo.id, e.target.value)}
                    >
                      <option value="public">🌍 Tampil Publik</option>
                      <option value="internal">🏢 Internal MAKT</option>
                      <option value="confidential">🔒 Rahasia (Confidential)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {photos.length === 0 && meetingMinutesId && !uploading && (
          <div className="text-center py-8 text-slate-400 text-sm font-medium">
            Belum ada dokumentasi foto yang diunggah.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
