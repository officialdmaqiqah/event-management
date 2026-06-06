import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-indigo-900 font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> Dukung Acaraku.id
          </h2>
          <p className="text-sm text-indigo-700">Aplikasi ini 100% gratis. Jika bermanfaat, Anda bisa memberikan apresiasi untuk mendukung pengembangan selanjutnya.</p>
        </div>
        <Link href="https://www.pengenbayar.online/" target="_blank">
          <Button className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap">Berikan Apresiasi</Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Event</h1>
        <Link href="/admin/events/new">
          <Button>Buat Event Baru</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semua Event</CardTitle>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Event</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-500">
                        <Calendar className="mr-2 h-4 w-4" />
                        {format(new Date(event.start_datetime), "dd MMM yyyy, HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-500">
                        <MapPin className="mr-2 h-4 w-4" />
                        {event.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
