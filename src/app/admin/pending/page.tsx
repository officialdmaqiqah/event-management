import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-sm border-t-4 border-t-amber-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-amber-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Menunggu Persetujuan</CardTitle>
          <CardDescription className="text-base mt-2">
            Akun Anda berhasil didaftarkan namun belum dapat digunakan.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-slate-600 space-y-4">
          <p>
            Aplikasi ini diperuntukkan khusus untuk internal. Admin kami akan segera meninjau permohonan akses Anda.
          </p>
          <p className="text-sm">
            Silakan hubungi administrator jika Anda merasa ini adalah sebuah kesalahan atau butuh akses segera.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/admin/login" className="w-full">
            <Button className="w-full" variant="outline">
              Kembali ke Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
