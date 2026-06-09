import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function GeneratorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user && (user.email === 'officialsiyoyok@gmail.com' || user.email === 'yahya@example.com')
  
  if (!isAdmin) {
    redirect("/admin")
  }
  return <>{children}</>
}
