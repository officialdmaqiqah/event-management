import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import ParticipantRowActions from "./ParticipantRowActions"
import ExportCsvButton from "./ExportCsvButton"

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  const { data: participants, error: partError } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", params.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Detail Event</h1>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="outline">Daftar Event</Button>
          </Link>
          <ExportCsvButton participants={participants || []} eventTitle={event.title} eventCustomFields={event.custom_fields || []} />
          <Link href={`/admin/events/${event.id}/checkin`}>
            <Button>Mulai Check-in</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>{event.type}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <strong>Status:</strong>{" "}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                event.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {event.status}
              </span>
            </div>
            <div>
              <strong>Waktu:</strong><br />
              {format(new Date(event.start_datetime), "dd MMM yyyy, HH:mm")}
              {event.end_datetime && ` - ${format(new Date(event.end_datetime), "HH:mm")}`}
            </div>
            <div>
              <strong>Lokasi:</strong><br />
              {event.location}
            </div>
            {event.quota && (
              <div>
                <strong>Kuota:</strong> {participants?.length || 0} / {event.quota}
              </div>
            )}
            {event.status === 'published' && (
              <div className="pt-4 border-t border-gray-100">
                <strong>Link Pendaftaran:</strong><br />
                <a href={`/${event.registration_slug}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  /{event.registration_slug}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Daftar Peserta</CardTitle>
            <CardDescription>
              Total {participants?.length || 0} peserta terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {participants && participants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>L/P</TableHead>
                    <TableHead>Instansi/Org</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Kode Tiket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell>{p.gender === 'Pria' ? 'L' : p.gender === 'Wanita' ? 'P' : '-'}</TableCell>
                      <TableCell>{p.organization || '-'}</TableCell>
                      <TableCell>{p.whatsapp}</TableCell>
                      <TableCell><code className="bg-gray-100 px-1 py-0.5 rounded">{p.ticket_code}</code></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          p.status === 'attended' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ParticipantRowActions eventId={event.id} participantId={p.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                Belum ada peserta yang mendaftar.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
