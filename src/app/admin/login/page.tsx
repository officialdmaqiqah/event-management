"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Lock, Mail, AlertCircle, LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message === "Invalid login credentials" 
        ? "Email atau password yang Anda masukkan salah." 
        : error.message)
      setLoading(false)
    } else {
      router.push("/admin")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAF8] px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative Background Glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Back to Home */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-emerald-800 transition-colors py-1.5 px-3 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Logo & Brand Identity */}
      <div className="flex flex-col items-center text-center mb-6 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group hover:opacity-95 transition-opacity" title="Beranda MAKT Event">
          <img 
            src="/logo-makt-full.png?v=5" 
            alt="Logo Masjid Agung Kubah Timah" 
            className="h-12 w-auto object-contain"
          />
          <div className="flex flex-col text-left">
            <span className="font-black text-xl tracking-tight text-slate-900 leading-none group-hover:text-primary transition-colors">MAKT Event</span>
            <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-tight sm:tracking-wider text-emerald-800 leading-tight mt-0.5 whitespace-nowrap">Masjid Agung Kubah Timah</span>
          </div>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed font-display text-[11px] font-bold shadow-xs">
          <span className="material-symbols-outlined text-[15px]">security</span>
          <span>Portal Pengurus & Admin</span>
        </div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-slate-200/80 overflow-hidden relative z-10">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary-fixed to-primary" />

        <form onSubmit={handleLogin}>
          <CardHeader className="pt-6 pb-4 text-center">
            <CardTitle className="text-2xl font-black text-primary font-display tracking-tight">
              Masuk Portal Admin
            </CardTitle>
            <CardDescription className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Silakan masukkan email dan kata sandi akun pengurus Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 sm:px-8">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200/70 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                Email Pengurus
              </Label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@kubahtimah.id"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50/60 border-slate-200 focus:border-primary focus:ring-primary/20 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                Kata Sandi
              </Label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-slate-50/60 border-slate-200 focus:border-primary focus:ring-primary/20 text-sm"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-6 sm:px-8 pt-2 pb-6">
            <Button 
              className="w-full h-11 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-display text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Masuk Sekarang</span>
                </>
              )}
            </Button>

            <div className="pt-2 border-t border-slate-100 w-full text-center">
              <p className="text-xs text-slate-600">
                Belum punya akun pengurus?{" "}
                <Link href="/signup" className="text-primary font-bold hover:underline">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Copyright Note */}
      <div className="mt-8 text-center text-xs text-slate-400 relative z-10">
        <span>© {new Date().getFullYear()} Masjid Agung Kubah Timah Pangkalpinang</span>
      </div>
    </div>
  )
}
