import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Fetch user profile to check approval status and jabatan
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved, jabatan')
    .eq('user_id', user.id)
    .single()

  const isAdmin = user.email === 'officialsiyoyok@gmail.com' || user.email === 'yahya@example.com'

  if (!isAdmin && profile && !profile.is_approved) {
    redirect("/admin/pending")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 min-h-[4rem] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="font-bold text-lg sm:text-xl text-gray-900 truncate flex items-center gap-2">
              <img src="/logo-makt-full.png" alt="MAKT Logo" className="h-8 w-auto" />
              Event Management
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* 1. Peminjaman Fasilitas */}
            <Link href="/admin/pengajuan">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                Peminjaman
              </Button>
            </Link>
            {(isAdmin || (profile && profile.is_approved && profile.jabatan)) && (
              <Link href="/admin/approval">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                  Persetujuan
                </Button>
              </Link>
            )}

            {/* 2. Event Publik & Tiketing */}
            {(isAdmin || (profile && profile.is_approved)) && (
              <Link href="/admin/events">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                  Event Publik
                </Button>
              </Link>
            )}

            {/* 3. Laporan & Kalender */}
            <Link href="/admin/kalender">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                Kalender
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                Statistik
              </Button>
            </Link>

            {/* 4. Sistem & Pengaturan */}
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                Pengaturan
              </Button>
            </Link>
            {user.email === 'officialsiyoyok@gmail.com' && (
              <>
                <Link href="/admin/organisasi">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                    Organisasi
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                    Pengguna
                  </Button>
                </Link>
              </>
            )}
            <span className="text-xs sm:text-sm text-gray-500 hidden md:inline-block border-l border-gray-300 pl-4">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit" className="px-2 sm:px-3 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  )
}
