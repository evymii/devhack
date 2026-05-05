import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Headphones,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Countdown } from "@/components/countdown"
import { LifeClock } from "@/components/life-clock"
import { type FestivalEvent, listEvents, formatDate, formatPrice } from "@/lib/events"

export default async function Home() {
  const events = await listEvents()
  const featured = events.slice(0, 3)
  const next = events[0]
  const sampleTiers = next.tiers

  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <ResultsSection />
      <FeaturedEventsSection featured={featured} />
      <CountdownSection next={next} />
      <FaceIdShowcase />
      <TicketTiersSection tiers={sampleTiers} eventTitle={next.title} />
      <FeatureGrid />
      <ArtistsSection />
      <MementoSection next={next} />
      <SavedSection events={events} />
      <Footer />
    </main>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 -z-10 [background:radial-gradient(60%_50%_at_50%_0%,rgba(168,85,247,0.18),transparent_60%),radial-gradient(40%_40%_at_85%_30%,rgba(244,114,182,0.14),transparent_60%),radial-gradient(45%_50%_at_15%_70%,rgba(56,189,248,0.14),transparent_60%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <ScanFace className="size-3.5" /> Царайгаар нээгдэх орон зай
        </span>
        <h1 className="max-w-3xl text-balance text-5xl font-light leading-[1.05] tracking-tight sm:text-6xl">
          Таны царай —{" "}
          <span className="bg-linear-to-br from-fuchsia-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
            таны тасалбар
          </span>
          .
        </h1>
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Тоглолт, наадам, спортын тасалбараа QR кодгүйгээр, дан царайгаараа нээж нэвтэрнэ.
          Скрэншот, гар утас, цаасан тасалбар шаардахгүй.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/events">
              Тоглолт үзэх <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#download">App татах</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function ResultsSection() {
  const stats = [
    { n: "~50K", label: "Нээгдсэн тасалбар", desc: "Бид өнөөг хүртэл нийт ~50,000 удаа царайгаар хаалга нээж өгсөн." },
    { n: "~12K", label: "App-н хэрэглэгч", desc: "FacePass App-г нийт 12K хүн идэвхтэй ашиглаж байна." },
    { n: "4.9", label: "App Store Review", desc: "App Store дээрх хэрэглэгчийн дундаж үнэлгээ." },
    { n: "25K", label: "Social Followers", desc: "Сошиал дээрх нийт дагагчид." },
  ]
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Үр дүн</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-light tracking-tight">
          Бид 2025 оноос хойш Монголын тоглолтын салбарт QR-гүй, царайгаар нээгддэг тасалбарыг нэвтрүүлэхээр ажиллаж байгаа ба 2030 он гэхэд бүх том наадам, тоглолт, цэнгүүн царайгаар нээгддэг болохыг зорьж байна.
        </h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-t pt-5">
            <div className="text-4xl font-light tracking-tight">{s.n}</div>
            <div className="mt-1 text-sm font-medium">{s.label}</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturedEventsSection({ featured }: { featured: FestivalEvent[] }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Тоглолт</p>
          <h2 className="mt-2 text-3xl font-light tracking-tight">Энэ улирлын онцлох тоглолтууд</h2>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/events">
            Бүгдийг үзэх <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((event) => (
          <Link key={event.id} href={`/events/${event.slug}`} className="group">
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <div className={`h-44 bg-linear-to-br ${event.heroGradient}`} />
              <CardContent className="space-y-1.5 p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {event.type === "festival" ? "Наадам" : "Стадион"}
                  </span>
                  <span>{formatDate(event.date)}</span>
                </div>
                <h3 className="text-lg font-medium leading-tight tracking-tight group-hover:underline">
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{event.tagline}</p>
                <p className="pt-1 text-xs text-muted-foreground">
                  {formatPrice(Math.min(...event.tiers.map((t) => t.price)))}-аас
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

function CountdownSection({ next }: { next: FestivalEvent }) {
  return (
    <section className="border-y bg-secondary/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Дараагийн тоглолт</p>
          <h3 className="mt-2 text-2xl font-light tracking-tight">{next.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(next.date)} · {next.venue}, {next.city}
          </p>
        </div>
        <Countdown isoDate={next.date} size="lg" />
      </div>
    </section>
  )
}

function FaceIdShowcase() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Face ID Pass</p>
          <h2 className="mt-2 text-3xl font-light leading-tight tracking-tight">
            Тасалбараа QR-гүй, дан царайгаараа нээх боломж.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Тасалбар авах үедээ царайгаа нэг удаа бүртгүүлнэ. Хаалган дээр зогсоход скан таныг
            таниад нэвтрүүлнэ. Гар утас гарт барихгүй, скрэншот үзүүлэхгүй.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild>
              <Link href="/events">
                Тоглолт сонгох <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/scanner">Скан үзэх</Link>
            </Button>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <FaceIdMock />
        </div>
      </div>
    </section>
  )
}

function FaceIdMock() {
  return (
    <div className="relative mx-auto aspect-4/5 w-full max-w-sm overflow-hidden rounded-3xl border bg-zinc-950 shadow-xl">
      <div className="absolute inset-0 bg-linear-to-br from-fuchsia-500/40 via-violet-500/30 to-sky-500/30" />
      <div className="absolute inset-x-0 top-6 text-center text-xs font-medium uppercase tracking-widest text-white/80">
        FacePass · Verifying
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="size-44 rounded-full border-2 border-dashed border-emerald-300/80 animate-[spin_8s_linear_infinite]" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="grid size-20 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
          <ScanFace className="size-10" />
        </div>
      </div>
      <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2 py-0.5">
            <Check className="size-3" /> Match · 96.4%
          </span>
        </div>
        <p className="mt-2 text-sm font-medium">Tsetsen Bold · VIP</p>
        <p className="text-xs text-white/70">Aurora Fields 2026 · Lane 3</p>
      </div>
    </div>
  )
}

function TicketTiersSection({
  tiers,
  eventTitle,
}: {
  tiers: FestivalEvent["tiers"]
  eventTitle: string
}) {
  return (
    <section className="border-y bg-secondary/20">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Тасалбар</p>
          <h2 className="mt-2 text-3xl font-light tracking-tight">
            Үнэгүй ба төлбөртэй тасалбарууд
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Жишээ болгон <span className="font-medium text-foreground">{eventTitle}</span> тоглолтын
            тасалбарын ангилалуудыг харуулав.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {tiers.map((t, i) => (
            <Card key={t.id} className="overflow-hidden">
              <CardContent className="space-y-3 p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {String(i + 1).padStart(2, "0")} · {t.name}
                </div>
                <div className="text-3xl font-light tabular-nums">{formatPrice(t.price)}</div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {t.perks.map((p) => (
                    <li key={p}>· {p}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">{t.remaining} тасалбар үлдсэн</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureGrid() {
  const features = [
    {
      en: "Walk-up Entry",
      mn: "Хаалган дээр зогсоод царайгаа л харуулна, лангуу шууд нээгдэнэ.",
      icon: <Camera className="size-5" />,
    },
    {
      en: "Anti-Resell",
      mn: "Тасалбар нь царайтай тань холбогдсон тул дамлан худалдах боломжгүй.",
      icon: <ShieldCheck className="size-5" />,
    },
    {
      en: "Live Scan",
      mn: "Гэрэл багатай орчинд ч секундын дотор шууд таних боломж.",
      icon: <ScanFace className="size-5" />,
    },
    {
      en: "Offline Mode",
      mn: "Интернетгүй талбайд ч тасалбар нь бэлэн, царай танигдсан хэвээр.",
      icon: <Wifi className="size-5" />,
    },
    {
      en: "One Face, Any Show",
      mn: "Нэг удаа бүртгүүлснээр өөрийн царайгаар бүх тоглолтод нэвтрэх боломжтой.",
      icon: <Sparkles className="size-5" />,
    },
    {
      en: "Quiet Audio Guide",
      mn: "Сонгосон тоглолтын тайлбарыг подкаст хэлбэрээр сонсох боломж.",
      icon: <Headphones className="size-5" />,
    },
  ]
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Боломжууд</p>
        <h2 className="mt-2 text-3xl font-light tracking-tight">
          Тасалбараас давсан, төвийг сахисан туршлага
        </h2>
      </div>
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.en} className="flex flex-col gap-2 border-t pt-5">
            <div className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
              {f.icon}
            </div>
            <h3 className="text-base font-medium">{f.en}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.mn}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ArtistsSection() {
  const artists = [
    { name: "Magnolian", handle: "@mngln", quote: "Тайван долгионы хүн", since: "9 цагийн өмнө" },
    { name: "The Lemons", handle: "@thelemons", quote: "Хотын зам дагуу", since: "1 өдрийн өмнө" },
    { name: "Anyma", handle: "@anyma_official", quote: "Гэрэл, цахилгаан, царай.", since: "2 өдрийн өмнө" },
    { name: "Mohanik", handle: "@mohanik", quote: "Эртний дуу, шинэ хэлбэр.", since: "5 өдрийн өмнө" },
  ]
  return (
    <section className="border-y bg-secondary/20">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Уран бүтээлчид</p>
            <h2 className="mt-2 text-3xl font-light tracking-tight">
              Дуртай уран бүтээлчээ дагах, тоглолтыг нь алдалгүй
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {artists.map((a) => (
            <Card key={a.handle}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-linear-to-br from-fuchsia-500 to-sky-500 text-sm font-semibold text-white">
                  {a.name.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.handle}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Дагах
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{a.quote}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{a.since}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function MementoSection({ next }: { next: FestivalEvent }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Memento Concert</p>
          <h2 className="mt-3 text-3xl font-light leading-tight tracking-tight">
            Тоглолт хүртэл үлдсэн хугацаа
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Худалдаж авсан тасалбарын тоглолт хүртэл үлдсэн хугацааг секунд тутамд танд сануулж
            байх болно. Та өөрийн хүсэн хүлээдэг өдрийг хэзээ ч мартахгүй.
          </p>
        </div>
        <div className="rounded-2xl border bg-secondary/30 p-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{next.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(next.date)}</p>
          <div className="mt-6">
            <LifeClock isoDate={next.date} />
          </div>
          <div className="mt-8 border-t pt-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Үлдсэн хугацаа</p>
            <div className="mt-3">
              <Countdown isoDate={next.date} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SavedSection({ events }: { events: FestivalEvent[] }) {
  return (
    <section className="border-t bg-secondary/20">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Saved Tickets</p>
          <h2 className="mt-2 text-3xl font-light leading-tight tracking-tight">
            Худалдаж авсан, хадгалсан тасалбараа нэг дороос
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Бүх тасалбар, тэдгээрийн царайны бүртгэл, тоглолтын мэдээлэл нэг газар. Интернетгүй
            үед ч нээгдэх боломж.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/tickets">
                Тасалбараа харах <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {events.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-4 rounded-xl border bg-background p-4">
              <div className={`size-14 shrink-0 rounded-md bg-linear-to-br ${e.heroGradient}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDate(e.date)} · {e.venue}
                </p>
              </div>
              <Badge variant="success">Хүчинтэй</Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer id="download" className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="max-w-xl text-balance text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              Таны царайгаар нээгдэх орон зай
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">FacePass.mn — since 2025</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <DownloadBadge label="Download on the" name="App Store" />
              <DownloadBadge label="Get it on" name="Google Play" />
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium">Хэсгүүд</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/events">Тоглолт</Link></li>
                <li><Link href="/tickets">Тасалбар</Link></li>
                <li><Link href="/scanner">Скан</Link></li>
                <li><Link href="#faq">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium">Холбоо барих</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>UBH Center, 11 давхар</li>
                <li>Улаанбаатар, Монгол</li>
                <li>hello@facepass.mn</li>
                <li>+976 9509 6446</li>
              </ul>
            </div>
          </div>
        </div>

        <FaqBlock />

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© 2026 facepass.mn — All rights reserved.</span>
          <span>Designed with ❤️ in Ulaanbaatar.</span>
        </div>
      </div>
    </footer>
  )
}

function DownloadBadge({ label, name }: { label: string; name: string }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-xl border bg-background px-4 py-2.5">
      <div className="grid size-8 place-items-center rounded-md bg-foreground text-background">
        <Calendar className="size-4" />
      </div>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{name}</div>
      </div>
    </div>
  )
}

function FaqBlock() {
  const items = [
    {
      q: "Царайгаа бүртгүүлэхэд аюулгүй юу?",
      a: "Бид царайны зураг биш, тоон загвараар хадгалдаг ба зөвхөн таны тасалбарыг шалгахад ашиглана.",
    },
    {
      q: "Гар утсаа аваагүй бол хэрхэх вэ?",
      a: "Хаалган дээр гар утас огт шаардахгүй. Зөвхөн царайгаа л харуулахад л хангалттай.",
    },
    {
      q: "Тасалбараа найздаа өгч болох уу?",
      a: "Үгүй. Тасалбар нь зөвхөн бүртгүүлсэн царайтай хүнд хүчинтэй учир дамжуулах боломжгүй.",
    },
    {
      q: "Хаягаа алдсан бол?",
      a: "App-аас дахин нэвтэрч царайгаа таниулахад л таны бүх тасалбар буцаж ирнэ.",
    },
  ]
  return (
    <div id="faq" className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">FAQ</p>
        <h3 className="mt-2 text-2xl font-light leading-tight tracking-tight">
          Түгээмэл асуугддаг асуултууд
        </h3>
      </div>
      <div className="divide-y border-t border-b">
        {items.map((it) => (
          <details key={it.q} className="group py-4">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
              {it.q}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{it.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

