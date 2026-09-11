import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExternalLink, LogOut, User as UserIcon } from "lucide-react"

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

  // Fetch user profile to check approval status, jabatan, and system_role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved, jabatan, system_role')
    .eq('user_id', user.id)
    .single()

  const isAdmin = profile?.system_role === 'super_admin' || profile?.system_role === 'admin_makt' || user.email === 'officialsiyoyok@gmail.com' || user.email === 'yahya@example.com'

  if (!isAdmin && profile && !profile.is_approved) {
    redirect("/admin/pending")
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col font-sans">
      {/* Admin Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 py-2.5 min-h-[4rem] flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5 group" title="Dashboard Utama Admin">
              <img 
                src="/logo-makt-full.png?v=5" 
                alt="Logo Masjid Agung Kubah Timah" 
                className="h-10 w-auto object-contain shrink-0" 
              />
              <div className="flex flex-col text-left">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 leading-none group-hover:text-primary transition-colors">
                  MAKT Event
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-tight sm:tracking-wider text-emerald-800 leading-tight mt-0.5 whitespace-nowrap">
                  Portal Pengurus & Admin
                </span>
              </div>
            </Link>

            {/* Mobile View Public Web Button */}
            <Link 
              href="/" 
              target="_blank" 
              className="inline-flex md:hidden items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-primary px-2.5 py-1 rounded-full bg-slate-100"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Web</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                Dashboard
              </Button>
            </Link>

            {/* 1. Peminjaman Fasilitas */}
            <Link href="/admin/pengajuan">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                Peminjaman
              </Button>
            </Link>
            {(isAdmin || (profile && profile.is_approved && profile.jabatan)) && (
              <Link href="/admin/approval">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                  Persetujuan
                </Button>
              </Link>
            )}

            {/* 2. Event Publik & Tiketing */}
            {(isAdmin || (profile && profile.is_approved)) && (
              <Link href="/admin/events">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                  Event Publik
                </Button>
              </Link>
            )}

            {/* 3. Laporan & Kalender */}
            <Link href="/admin/kalender">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                Kalender
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                Statistik
              </Button>
            </Link>

            {/* 4. Sistem & Pengaturan */}
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                Pengaturan
              </Button>
            </Link>
            {user.email === 'officialsiyoyok@gmail.com' && (
              <>
                <Link href="/admin/organisasi">
                  <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                    Organisasi
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="text-slate-700 hover:text-primary hover:bg-emerald-50 px-2 sm:px-3 text-xs font-bold rounded-lg">
                    Pengguna
                  </Button>
                </Link>
              </>
            )}

            {/* Desktop Web Public Link */}
            <Link 
              href="/" 
              target="_blank" 
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 transition-colors ml-1"
              title="Buka Website Publik MAKT Event"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Lihat Web</span>
            </Link>

            {/* User Email Badge */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 border-l border-slate-200 pl-3 ml-1">
              <UserIcon className="h-3.5 w-3.5 text-primary" />
              <span className="max-w-[140px] truncate font-medium">{user.email}</span>
            </div>

            {/* Logout Form */}
            <form action="/auth/signout" method="post">
              <Button 
                variant="ghost" 
                size="sm" 
                type="submit" 
                className="px-2.5 sm:px-3 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1"
                title="Keluar dari akun pengurus"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
