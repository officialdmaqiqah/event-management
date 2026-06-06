"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle, X } from "lucide-react"

export default function DeleteEventButton({ eventId, eventTitle }: { eventId: string, eventTitle: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    
    if (error) {
      alert("Gagal menghapus event: " + error.message)
      setIsDeleting(false)
      setShowModal(false)
    } else {
      setShowModal(false)
      router.refresh()
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setShowModal(true)}
        disabled={isDeleting}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="relative p-6">
              <div className="absolute right-4 top-4">
                <button 
                  onClick={() => setShowModal(false)}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex flex-col items-center text-center mt-2">
                <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Event Permanen</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Anda akan menghapus event <span className="font-semibold text-gray-900">&quot;{eventTitle}&quot;</span>. 
                  Semua data pendaftaran dan peserta yang terhubung akan ikut terhapus. Aksi ini tidak dapat dikembalikan.
                </p>

                <div className="flex w-full gap-3 mt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-12 font-medium border-gray-200 hover:bg-gray-50"
                    onClick={() => setShowModal(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1 rounded-xl h-12 font-medium bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Menghapus..." : "Ya, Hapus Event"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
