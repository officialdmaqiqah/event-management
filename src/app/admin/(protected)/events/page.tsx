import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Calendar, Users, MapPin, Edit, Heart } from "lucide-react"
import DeleteEventButton from "../_components/DeleteEventButton"

export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isSuperAdmin = false
  if (user) {
    const { data: profile } = await supabase.from('user_profiles').select('system_role').eq('user_id', user.id).maybeSingle()
    isSuperAdmin = profile?.system_role === 'super_admin' || profile?.system_role === 'admin_makt' || user.email === 'officialsiyoyok@gmail.com' || user.email?.startsWith('yahya') || false
  }

  let query = supabase.from("events").select("*").order("created_at", { ascending: false })

  if (!isSuperAdmin && user) {
    query = query.eq('user_id', user.id)
  }

  const { data: events, error } = await query

  if (error) {
    console.error("Error fetching events:", error)
  }

  const getWIBDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jakarta',
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false
    };
    const parts = new Intl.DateTimeFormat('id-ID', options).formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    return `${day} ${month} ${year}, ${hour}:${minute}`;
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Manajemen Event Publik</h1>
          <p className="text-sm text-slate-500">Kelola semua pendaftaran event publik Masjid Agung Kubah Timah</p>
        </div>
        <Link href="/admin/events/new">
          <Button className="bg-primary hover:bg-primary-container text-on-primary font-bold shadow-xs rounded-xl font-display text-xs">
            + Buat Event Publik Baru
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold text-slate-900 font-display">Event Publik Anda</CardTitle>
          <CardDescription className="text-xs">Daftar semua kegiatan publik dan pendaftaran yang terbit</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {events && events.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/75">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Nama Event</TableHead>
                    <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-slate-500">Waktu</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-500">Lokasi</TableHead>
                    <TableHead className="whitespace-nowrap font-bold text-xs uppercase text-slate-500">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap font-bold text-xs uppercase text-slate-500 pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-900 min-w-[200px]">{event.title}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        <div className="flex items-center text-slate-600 font-medium">
                          <Calendar className="mr-2 h-3.5 w-3.5 text-slate-400" />
                          {getWIBDate(event.start_datetime)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px] text-xs">
                        <div className="flex items-center text-slate-600">
                          <MapPin className="mr-2 h-3.5 w-3.5 text-slate-400" />
                          {event.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${
                          event.status === 'published' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          event.status === 'draft' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                          event.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {event.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5 items-center">
                          <Link href={`/admin/events/${event.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold hover:text-primary hover:border-emerald-200 hover:bg-emerald-50/50 rounded-xl">
                              Detail
                            </Button>
                          </Link>
                          <Link href={`/admin/events/${event.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-14 px-4">
              <p className="text-slate-500 mb-4 text-sm">Belum ada event yang dibuat.</p>
              <Link href="/admin/events/new">
                <Button variant="outline" className="rounded-xl font-bold text-primary border-emerald-200 hover:bg-emerald-50">Mulai Buat Event</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
