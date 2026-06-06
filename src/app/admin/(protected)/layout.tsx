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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin" className="font-bold text-xl text-gray-900">
            Event Management
          </Link>
          <div className="flex items-center gap-4">
            {user.email?.startsWith('yahya') && (
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600">
                  Kelola Pengguna
                </Button>
              </Link>
            )}
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600">
                Pengaturan
              </Button>
            </Link>
            <span className="text-sm text-gray-500 hidden sm:inline-block border-l border-gray-300 pl-4">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
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
