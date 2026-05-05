import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { listEvents, formatDate, formatPrice } from "@/lib/events"

export default async function EventsPage() {
  const events = await listEvents()

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Тоглолт</p>
        <h1 className="mt-2 text-3xl font-light tracking-tight">Удахгүй болох тоглолтууд</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Бүх тасалбар QR кодгүйгээр, дан царайгаараа нээгдэнэ. Скрэншот, цаас, гар утас шаардахгүй.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const minPrice = Math.min(...event.tiers.map((t) => t.price))
          return (
            <Link key={event.id} href={`/events/${event.slug}`} className="group">
              <Card className="overflow-hidden transition-all hover:shadow-md">
                <div className={`relative h-44 bg-linear-to-br ${event.heroGradient}`}>
                  <div className="absolute left-3 top-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur">
                      {event.type === "festival" ? "Наадам" : "Стадион"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-1 text-xs font-medium backdrop-blur">
                    {formatPrice(minPrice)}-аас
                  </div>
                </div>
                <CardContent className="space-y-2 p-5">
                  <h2 className="text-lg font-medium leading-tight tracking-tight group-hover:underline">
                    {event.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.tagline}</p>
                  <div className="flex flex-col gap-1 pt-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {formatDate(event.date)} · {event.doorsOpen}-д хаалга нээгдэнэ
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {event.venue}, {event.city}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
