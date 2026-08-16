import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function GeneratorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('system_role, is_approved')
    .eq('user_id', user.id)
    .single()

  const isAdmin =
    profile?.system_role === 'super_admin' ||
    profile?.system_role === 'admin_makt' ||
    profile?.system_role === 'admin_event' ||
    profile?.system_role === 'admin_organisasi' ||
    user.email === 'officialsiyoyok@gmail.com' ||
    user.email === 'yahya@example.com'
  
  if (!isAdmin) {
    redirect("/admin")
  }
  return <>{children}</>
}
