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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 min-h-[4rem] flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="font-bold text-lg sm:text-xl text-gray-900 truncate">
            Event Management
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {user.email === 'officialsiyoyok@gmail.com' && (
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                  Kelola Pengguna
                </Button>
              </Link>
            )}
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 px-2 sm:px-3 text-xs sm:text-sm">
                Pengaturan
              </Button>
            </Link>
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
