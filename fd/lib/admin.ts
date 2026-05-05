"use client";

import { apiRequest } from "@/lib/api";
import type { Ticket } from "@/lib/tickets";

export type AdminEvent = {
  id: number;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  map_image_url: string | null;
  settings: unknown;
  statusid: number;
};

export type AdminTicketList = {
  data: Ticket[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    has_more: boolean;
  };
  summary: {
    total: number;
    valid: number;
    redeemed: number;
  };
};

export type ScanResult = {
  ticket: Ticket;
  is_used: boolean;
  redeemed_at: string | null;
  buyer: {
    fullName: string;
    email: string;
  };
};

type PaginatedEvents = {
  data: AdminEvent[];
};

function numericId(id: string | number): string {
  return String(id).replace(/^tk_/, "").replace(/^evt_/, "");
}

export async function listAdminEvents(): Promise<AdminEvent[]> {
  const result = await apiRequest<PaginatedEvents>("/events?perPage=100");
  return result.data;
}

export async function createAdminEvent(payload: {
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
}): Promise<AdminEvent> {
  return apiRequest<AdminEvent>("/admin/events", {
    method: "POST",
    body: payload,
  });
}

export async function deleteAdminEvent(eventId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/admin/events/${eventId}`, {
    method: "DELETE",
  });
}

export async function generateAdminTickets(payload: {
  eventId: number;
  count: number;
  tier_name: string;
  price_paid: number;
}): Promise<Ticket[]> {
  const result = await apiRequest<{ message: string; tickets: Ticket[] }>(
    `/admin/events/${payload.eventId}/tickets`,
    {
      method: "POST",
      body: {
        count: payload.count,
        tier_name: payload.tier_name,
        price_paid: payload.price_paid,
      },
    },
  );
  return result.tickets;
}

export async function listAdminTickets(params: {
  event_id?: number;
  status?: "valid" | "redeemed";
  search?: string;
  tier?: string;
  page?: number;
} = {}): Promise<AdminTicketList> {
  const query = new URLSearchParams();
  query.set("per_page", "50");
  if (params.event_id) query.set("event_id", String(params.event_id));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.tier) query.set("tier", params.tier);
  if (params.page) query.set("page", String(params.page));

  return apiRequest<AdminTicketList>(`/admin/tickets?${query.toString()}`);
}

export async function deleteAdminTicket(ticketId: string): Promise<void> {
  await apiRequest<{ message: string }>(`/admin/tickets/${numericId(ticketId)}`, {
    method: "DELETE",
  });
}

export async function scanAdminTicket(payload: {
  qr_code?: string;
  biometric_data?: string;
}): Promise<ScanResult> {
  return apiRequest<ScanResult>("/admin/tickets/scan", {
    method: "POST",
    body: payload,
  });
}
