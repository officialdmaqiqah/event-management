"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, QrCode } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function RegistrationSuccessPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams()
  const ticketCode = searchParams.get('ticket')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <Card className="max-w-md w-full text-center glass shadow-2xl border-t-8 border-t-green-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-green-400/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <CardHeader className="space-y-4 pt-10">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 shadow-inner">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-slate-800 tracking-tight">Pendaftaran Sukses!</CardTitle>
          <CardDescription className="text-base text-slate-600">
            Terima kasih telah mendaftar. Tiket elektronik (E-Ticket) Anda sudah siap digunakan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pb-10 pt-4">
          
          <Link href={`/${params.slug}/ticket/${ticketCode}`} className="block">
            <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all rounded-xl">
              <QrCode className="mr-2 h-6 w-6" /> Lihat E-Ticket Saya
            </Button>
          </Link>
          
          <div className="text-sm text-slate-500 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
            Simpan atau <i>bookmark</i> halaman E-Ticket Anda untuk digunakan sebagai syarat masuk pada saat acara berlangsung.
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
