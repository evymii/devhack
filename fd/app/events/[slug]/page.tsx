import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Calendar, MapPin, ScanFace, Ticket } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Countdown } from "@/components/countdown"
import { EventUserTools } from "@/components/event-user-tools"
import { getEventBySlug, formatDate, formatPrice } from "@/lib/events"

export default async function EventPage(props: PageProps<"/events/[slug]">) {
  const { slug } = await props.params
  const event = await getEventBySlug(slug)
  if (!event) notFound()

  return (
    <main className="flex flex-1 flex-col">
      <section className={`relative h-72 bg-linear-to-br ${event.heroGradient}`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-6xl items-end justify-between gap-4 px-6 pb-6 text-white">
          <div>
            <Badge variant="outline" className="mb-3 border-white/30 bg-white/10 text-white backdrop-blur">
              {event.type === "festival" ? "Наадам" : "Стадион"}
            </Badge>
            <h1 className="max-w-3xl text-balance text-4xl font-light leading-tight tracking-tight sm:text-5xl">
              {event.title}
            </h1>
            <p className="mt-1 max-w-xl text-white/85">{event.tagline}</p>
          </div>
        </div>
      </section>

      <section className="border-b bg-secondary/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">Тоглолт хүртэл үлдсэн хугацаа</div>
          <Countdown isoDate={event.date} />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow icon={<Calendar className="size-4" />} label="Огноо">
              {formatDate(event.date)} · {event.doorsOpen}-д хаалга нээгдэнэ
            </InfoRow>
            <InfoRow icon={<MapPin className="size-4" />} label="Талбай">
              {event.venue}, {event.city}
            </InfoRow>
          </div>

          <section>
            <h2 className="mb-2 text-lg font-medium">Тайлбар</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Уран бүтээлчид</h2>
            <div className="flex flex-wrap gap-2">
              {event.lineup.map((act) => (
                <Badge key={act} variant="secondary" className="text-sm">
                  {act}
                </Badge>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-secondary/30 p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <ScanFace className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Царайгаар хэрхэн нэвтрэх вэ?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Тасалбар авахдаа царайгаа нэг удаа бүртгүүлнэ. Хаалган дээр зогсоход скан таныг
                  таниад лангуу нээгдэнэ. QR код, скрэншот шаардлагагүй.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Live tools</h2>
            <EventUserTools eventId={event.id} />
          </section>
        </div>

        <aside>
          <Card className="sticky top-20">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Ticket className="size-4" />
                <h2 className="text-base font-medium">Тасалбар сонгох</h2>
              </div>
              <div className="space-y-2">
                {event.tiers.map((tier, index) => {
                  const lowStock = tier.remaining <= 20
                  return (
                    <Link
                      key={`${tier.id}-${tier.price}-${index}`}
                      href={`/events/${event.slug}/checkout?tier=${tier.id}`}
                      className="group block rounded-lg border bg-background p-3 transition-colors hover:border-foreground/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{tier.name}</div>
                          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {tier.perks.map((p) => (
                              <li key={p}>· {p}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{formatPrice(tier.price)}</div>
                          {lowStock ? (
                            <div className="text-xs text-amber-600">{tier.remaining} ширхэг</div>
                          ) : (
                            <div className="text-xs text-muted-foreground">{tier.remaining} үлдсэн</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-end text-xs text-muted-foreground group-hover:text-foreground">
                        Үргэлжлүүлэх <ArrowRight className="ml-1 size-3" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  )
}
