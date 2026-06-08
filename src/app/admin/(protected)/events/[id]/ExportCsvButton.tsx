"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"
import { CustomDialog, DialogType } from "@/components/ui/custom-dialog"

export default function ExportCsvButton({ participants, eventTitle, eventCustomFields = [] }: { participants: any[], eventTitle: string, eventCustomFields?: any[] }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: DialogType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  })

  const showDialog = (type: DialogType, title: string, message: string) => {
    setDialogState({ isOpen: true, type, title, message })
  }

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }))
  }

  const handleExport = () => {
    if (!participants || participants.length === 0) {
      showDialog('error', 'Gagal', 'Tidak ada data peserta untuk diexport.')
      return
    }

    // Buat header CSV dasar
    const baseHeaders = ["Nama Lengkap", "L/P", "Instansi/Organisasi", "WhatsApp", "Kode Tiket", "Status", "Waktu Check-in", "Waktu Mendaftar"]
    
    // Header dinamis
    const customHeaders = eventCustomFields.map(field => field.label)
    const allHeaders = [...baseHeaders, ...customHeaders]

    // Format baris data
    const rows = participants.map(p => {
      const baseRow = [
        `"${p.full_name || ''}"`,
        `"${p.gender || ''}"`,
        `"${p.organization || ''}"`,
        `"${p.whatsapp || ''}"`,
        `"${p.ticket_code || ''}"`,
        `"${p.status || ''}"`,
        `"${p.checked_in_at ? new Date(p.checked_in_at).toLocaleString('id-ID') : '-'}"`,
        `"${p.created_at ? new Date(p.created_at).toLocaleString('id-ID') : '-'}"`
      ]

      const customRow = eventCustomFields.map(field => {
        const value = p.custom_responses ? p.custom_responses[field.id] : ''
        // Escape quotes to prevent CSV breakage
        const escapedVal = value ? String(value).replace(/"/g, '""') : ''
        return `"${escapedVal}"`
      })

      return [...baseRow, ...customRow]
    })

    // Gabungkan header dan baris
    const csvContent = [
      allHeaders.map(h => `"${h}"`).join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    // Buat Blob dan trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    // Format nama file: event_title_peserta_YYYYMMDD.csv
    const dateStr = new Date().toISOString().split('T')[0]
    const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const fileName = `${safeTitle}_peserta_${dateStr}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExport}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </Button>

      <CustomDialog 
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onCancel={closeDialog}
        onConfirm={closeDialog}
      />
    </>
  )
}
