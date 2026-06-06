import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Calendar, Users, MapPin, Edit, Heart } from "lucide-react"
import DeleteEventButton from "./_components/DeleteEventButton"

export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isSuperAdmin = user?.email?.startsWith('yahya')

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
        <h1 className="text-2xl font-bold tracking-tight">Daftar Event</h1>
        <Link href="/admin/events/new">
          <Button>+ Buat Event Baru</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Anda</CardTitle>
          <CardDescription>Kelola semua event yang telah Anda buat</CardDescription>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Event</TableHead>
                    <TableHead className="whitespace-nowrap">Waktu</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium min-w-[200px]">{event.title}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="mr-2 h-4 w-4" />
                          {getWIBDate(event.start_datetime)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex items-center text-gray-500">
                          <MapPin className="mr-2 h-4 w-4" />
                          {event.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          event.status === 'published' ? 'bg-green-50 text-green-700' :
                          event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          event.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {event.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/events/${event.id}`}>
                            <Button variant="outline" size="sm">Detail</Button>
                          </Link>
                          <Link href={`/admin/events/${event.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
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
            <div className="text-center py-10">
              <p className="text-gray-500 mb-4">Belum ada event yang dibuat.</p>
              <Link href="/admin/events/new">
                <Button variant="outline">Mulai Buat Event</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
