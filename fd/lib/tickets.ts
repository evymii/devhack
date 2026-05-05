"use client"

const STORAGE_KEY = "biometric_tickets_v1"

export type Ticket = {
  id: string
  eventId: string
  eventTitle: string
  eventDate: string
  venue: string
  tierName: string
  pricePaid: number
  buyer: {
    fullName: string
    email: string
    phone: string
    dateOfBirth: string
    nationalId: string
  }
  biometric: {
    snapshot: string
    enrolledAt: string
  }
  status: "valid" | "redeemed"
  createdAt: string
  redeemedAt?: string
}

function read(): Ticket[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Ticket[]) : []
  } catch {
    return []
  }
}

function write(tickets: Ticket[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}

export function listTickets(): Ticket[] {
  return read().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export function getTicket(id: string): Ticket | undefined {
  return read().find((t) => t.id === id)
}

export function saveTicket(t: Ticket) {
  const all = read().filter((x) => x.id !== t.id)
  all.push(t)
  write(all)
}

export function redeemTicket(id: string): Ticket | undefined {
  const all = read()
  const idx = all.findIndex((t) => t.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: "redeemed", redeemedAt: new Date().toISOString() }
  write(all)
  return all[idx]
}

export function newTicketId(): string {
  return "tk_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function newBiometricId(): string {
  return "bio_" + Math.random().toString(36).slice(2, 14)
}
