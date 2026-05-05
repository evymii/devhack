export type TicketTier = {
  id: string
  name: string
  price: number
  perks: string[]
  remaining: number
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

export const events: FestivalEvent[] = [
  {
    id: "evt_aurora_2026",
    slug: "aurora-fields-2026",
    title: "Aurora Fields 2026",
    type: "festival",
    venue: "Khustai Open Grounds",
    city: "Ulaanbaatar",
    date: "2026-07-18",
    doorsOpen: "16:00",
    heroGradient: "from-fuchsia-500 via-violet-500 to-indigo-600",
    tagline: "Two nights under the steppe sky.",
    description:
      "A two-night electronic festival on the open steppe, with three stages, art installations, and a full camp village.",
    lineup: ["Anyma", "Mind Against", "Tale Of Us", "Innellea", "MRAK", "Massano"],
    tiers: [
      {
        id: "ga",
        name: "General Admission",
        price: 89,
        perks: ["Both nights", "Camp access", "All stages"],
        remaining: 412,
      },
      {
        id: "vip",
        name: "VIP",
        price: 189,
        perks: ["Front-stage deck", "Express entry", "VIP bar"],
        remaining: 78,
      },
      {
        id: "cabana",
        name: "Cabana",
        price: 480,
        perks: ["Private cabana for 4", "Bottle service", "Dedicated host"],
        remaining: 9,
      },
    ],
  },
  {
    id: "evt_derby_finals",
    slug: "derby-finals",
    title: "Derby Finals — UB FC vs Erchim",
    type: "stadium",
    venue: "MFF Football Centre",
    city: "Ulaanbaatar",
    date: "2026-06-02",
    doorsOpen: "18:30",
    heroGradient: "from-emerald-500 via-teal-500 to-sky-600",
    tagline: "The match that decides the title.",
    description:
      "League final with a sold-out crowd expected. Stadium opens 90 minutes before kickoff.",
    lineup: ["UB FC", "Erchim", "Halftime: B.Anu"],
    tiers: [
      {
        id: "stand",
        name: "Standing",
        price: 22,
        perks: ["South stand", "Standing only"],
        remaining: 1240,
      },
      {
        id: "seat",
        name: "Seated",
        price: 48,
        perks: ["Reserved seat", "East stand"],
        remaining: 320,
      },
      {
        id: "box",
        name: "Skybox",
        price: 220,
        perks: ["Private box", "Catering", "Parking"],
        remaining: 6,
      },
    ],
  },
  {
    id: "evt_summer_sound",
    slug: "summer-sound",
    title: "Summer Sound",
    type: "festival",
    venue: "Sukhbaatar Square",
    city: "Ulaanbaatar",
    date: "2026-08-15",
    doorsOpen: "14:00",
    heroGradient: "from-amber-400 via-orange-500 to-rose-500",
    tagline: "An afternoon-into-night city festival.",
    description:
      "A one-day open-air festival in the heart of the city, with local headliners and global guests.",
    lineup: ["Magnolian", "The Lemons", "Mohanik", "Sezairi", "Phum Viphurit"],
    tiers: [
      {
        id: "ga",
        name: "General Admission",
        price: 55,
        perks: ["Full day access", "Food court"],
        remaining: 980,
      },
      {
        id: "vip",
        name: "VIP",
        price: 140,
        perks: ["Raised viewing deck", "Open bar 17–19", "Express entry"],
        remaining: 64,
      },
    ],
  },
  {
    id: "evt_arena_night",
    slug: "arena-night",
    title: "Arena Night — Boxing",
    type: "stadium",
    venue: "Buyant Ukhaa Sport Palace",
    city: "Ulaanbaatar",
    date: "2026-05-30",
    doorsOpen: "19:00",
    heroGradient: "from-rose-500 via-red-500 to-zinc-900",
    tagline: "Five title fights. One night.",
    description:
      "A full card of championship boxing in the round, with ringside packages available.",
    lineup: ["Main: Tugstsogt vs Carrasco", "Co-main: Erdenebat vs Lopez"],
    tiers: [
      {
        id: "upper",
        name: "Upper Bowl",
        price: 35,
        perks: ["Reserved seat", "Upper deck"],
        remaining: 540,
      },
      {
        id: "lower",
        name: "Lower Bowl",
        price: 95,
        perks: ["Reserved seat", "Lower deck"],
        remaining: 180,
      },
      {
        id: "ringside",
        name: "Ringside",
        price: 380,
        perks: ["Ringside seat", "Welcome drink", "Fighter meet"],
        remaining: 12,
      },
    ],
  },
]

export function getEventBySlug(slug: string): FestivalEvent | undefined {
  return events.find((e) => e.slug === slug)
}

export function formatPrice(cents: number): string {
  return `$${cents.toFixed(0)}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
