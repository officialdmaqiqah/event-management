"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"

export default function DeleteEventButton({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
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
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    
    if (error) {
      showDialog('error', 'Gagal Menghapus', "Gagal menghapus event: " + error.message)
      setIsDeleting(false)
    } else {
      closeDialog()
      router.refresh()
    }
  }

  const confirmDelete = () => {
    showDialog(
      'confirm',
      'Hapus Event Permanen',
      `Anda akan menghapus event "${eventTitle}".\nSemua data pendaftaran dan peserta yang terhubung akan ikut terhapus. Aksi ini tidak dapat dikembalikan.`,
      handleDelete
    )
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={confirmDelete}
        disabled={isDeleting}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <CustomDialog 
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onCancel={closeDialog}
        onConfirm={dialogState.onConfirm ? () => {
          dialogState.onConfirm!();
        } : undefined}
        confirmText={dialogState.type === 'confirm' ? "Ya, Hapus Event" : "OK"}
        isLoading={isDeleting}
      />
    </>
  )
}
