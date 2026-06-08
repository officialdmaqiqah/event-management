"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Trash2 } from "lucide-react"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"

export default function ParticipantRowActions({ eventId, participantId }: { eventId: string, participantId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  })

  const showDialog = (type: DialogType, title: string, message: string, onConfirm?: () => void) => {
    setDialogState({ isOpen: true, type, title, message, onConfirm })
  }

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await supabase.from('participants').delete().eq('id', participantId)
    
    if (error) {
      showDialog('error', 'Gagal Menghapus', "Gagal menghapus: " + error.message)
      setIsDeleting(false)
    } else {
      closeDialog()
      router.refresh()
    }
  }

  const confirmDelete = () => {
    showDialog(
      'confirm',
      'Hapus Peserta',
      'Apakah Anda yakin ingin menghapus peserta ini dari daftar?\nAksi ini tidak dapat dikembalikan.',
      handleDelete
    )
  }

  return (
    <>
      <div className="flex gap-2 justify-end">
        <Link href={`/admin/events/${eventId}/participants/${participantId}/edit`}>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-amber-600 border-amber-200 hover:bg-amber-50">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={confirmDelete}
          disabled={isDeleting}
          className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <CustomDialog 
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onCancel={closeDialog}
        onConfirm={dialogState.onConfirm ? () => {
          dialogState.onConfirm!();
        } : undefined}
        confirmText={dialogState.type === 'confirm' ? "Ya, Hapus Peserta" : "OK"}
        isLoading={isDeleting}
      />
    </>
  )
}
