import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/admin/login")
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved, jabatan')
    .eq('user_id', user.id)
    .single()

  const isAdmin = user && (user.email === 'officialsiyoyok@gmail.com' || user.email === 'yahya@example.com')
  const hasAccess = isAdmin || (profile && profile.is_approved)

  if (!hasAccess) {
    redirect("/admin")
  }
  return <>{children}</>
}
