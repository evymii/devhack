import { apiRequest } from "@/lib/api"

export type TicketTier = {
  id: string
  name: string
  price: number
  perks: string[]
  capacity?: number
  remaining: number
  takenSeats?: string[]
}

export type FestivalEvent = {
  id: string
  slug: string
  title: string
  type: "festival" | "stadium"
  venue: string
  city: string
  date: string
  doorsOpen: string
  heroGradient: string
  tagline: string
  description: string
  lineup: string[]
  tiers: TicketTier[]
}

type BackendEvent = {
  id: number
  name: string
  description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  map_image_url?: string | null
  settings?: {
    type?: "festival" | "stadium"
    city?: string
    tagline?: string
    lineup?: string[]
    tiers?: TicketTier[]
    heroGradient?: string
  } | null
  schedules?: unknown[]
}

type PaginatedEvents = {
  data: BackendEvent[]
}



function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toFestivalEvent(event: BackendEvent, index = 0): FestivalEvent {
  const start = event.start_time ? new Date(event.start_time) : new Date()
  const location = event.location ?? "Ulaanbaatar, Mongolia"
  const [venue, cityFromLocation] = location.split(",").map((part) => part.trim())
  const settings = event.settings ?? {}

  return {
    id: `evt_${event.id}`,
    slug: `evt_${event.id}`,
    title: event.name,
    type: settings.type ?? "festival",
    venue: venue || location,
    city: settings.city ?? cityFromLocation ?? "Ulaanbaatar",
    date: start.toISOString().slice(0, 10),
    doorsOpen: start.toTimeString().slice(0, 5),
    heroGradient: settings.heroGradient ?? "from-zinc-500 via-stone-500 to-neutral-600",
    tagline: settings.tagline ?? event.description ?? event.name,
    description: event.description ?? "",
    lineup: settings.lineup ?? [],
    tiers: settings.tiers?.length ? settings.tiers : [],
  }
}

export async function listEvents(): Promise<FestivalEvent[]> {
  try {
    const result = await apiRequest<PaginatedEvents>("/events?perPage=50")
    return result.data.map(toFestivalEvent)
  } catch {
    return []
  }
}

export async function getEventBySlug(slug: string): Promise<FestivalEvent | undefined> {
  if (slug.startsWith("evt_")) {
    try {
      const id = slug.replace("evt_", "")
      const event = await apiRequest<BackendEvent>(`/events/${id}`)
      return toFestivalEvent(event)
    } catch {
      return undefined
    }
  }

  const events = await listEvents()
  return events.find((event) => event.slug === slug)
}

export function formatPrice(cents: number): string {
  return `${cents.toLocaleString("mn-MN")}₮`
}

export function formatDate(iso: string): string {
  // Parse "YYYY-MM-DD" as local time to avoid UTC midnight → previous day shift
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  const d = new Date(year, (month ?? 1) - 1, day ?? 1)
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
