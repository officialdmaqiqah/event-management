"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ShieldCheck, User } from "lucide-react"

export default function UsersManagementPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setUsers(data)
    }
    setLoading(false)
  }

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_premium: !currentStatus })
      .eq('user_id', userId)

    if (!error) {
      setUsers(users.map(u => u.user_id === userId ? { ...u, is_premium: !currentStatus } : u))
    } else {
      alert("Gagal mengupdate status: " + error.message)
    }
  }

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_approved: !currentStatus })
      .eq('user_id', userId)

    if (!error) {
      setUsers(users.map(u => u.user_id === userId ? { ...u, is_approved: !currentStatus } : u))
    } else {
      alert("Gagal mengupdate persetujuan: " + error.message)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun ini secara permanen? Semua event dan partisipan yang dikelola oleh akun ini akan terhapus.")) return;
    
    setLoading(true);
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
    
    if (!error) {
      setUsers(users.filter(u => u.user_id !== userId));
      alert("Akun berhasil dihapus.");
    } else {
      alert("Gagal menghapus akun: " + error.message);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-10 flex items-center justify-center"><div className="animate-pulse text-indigo-500 font-semibold">Memuat Data Pengguna...</div></div>

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Kelola Pengguna</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.user_id} className={`shadow-sm border-t-4 ${user.is_premium ? 'border-t-amber-500 bg-amber-50/10' : 'border-t-slate-200'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2 truncate text-slate-800">
                  <User className="h-4 w-4 text-slate-400" />
                  {user.full_name || 'Tanpa Nama'}
                </span>
                {user.is_premium ? (
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-slate-300" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">{user.email}</p>
              
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Akses Sistem
                  </span>
                  <Button 
                    size="sm" 
                    variant={user.is_approved ? "outline" : "default"}
                    className={user.is_approved ? "border-green-200 text-green-700 hover:bg-green-50" : "bg-blue-600 hover:bg-blue-700"}
                    onClick={() => toggleApproval(user.user_id, user.is_approved)}
                  >
                    {user.is_approved ? "Cabut Akses" : "Setujui Akses"}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status Premium
                  </span>
                  <Button 
                    size="sm" 
                    variant={user.is_premium ? "outline" : "default"}
                    className={user.is_premium ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "bg-indigo-600 hover:bg-indigo-700"}
                    onClick={() => togglePremium(user.user_id, user.is_premium)}
                  >
                    {user.is_premium ? "Cabut Premium" : "Aktifkan Premium"}
                  </Button>
                </div>

                <div className="flex justify-end pt-2 mt-2 border-t border-slate-50">
                   <Button size="sm" variant="destructive" className="w-full text-xs" onClick={() => deleteUser(user.user_id)}>
                     Hapus Akun
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-500 glass rounded-xl">
            Belum ada pengguna terdaftar.
          </div>
        )}
      </div>
    </div>
  )
}
