"use client";

import { apiRequest } from "@/lib/api";

export type Ticket = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  tierName: string;
  pricePaid: number;
  buyer: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationalId: string;
  };
  biometric: {
    snapshot: string;
    enrolledAt: string;
  };
  status: "valid" | "redeemed";
  createdAt: string;
  redeemedAt: string | null;
};

type TicketListResponse = {
  data: Ticket[];
};

type PurchaseTicketPayload = {
  eventId: string;
  tierName: string;
  deviceId: string;
  buyer: Partial<Ticket["buyer"]>;
  biometricSnapshot: string;
};

type ClaimTicketPayload = {
  ticketId: string;
  deviceId: string;
  buyer: Partial<Ticket["buyer"]>;
  biometricData?: string;
  biometricSnapshot?: string;
};

const DEVICE_KEY = "facepass_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "web-device";

  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;

  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(DEVICE_KEY, created);
  return created;
}

function numericId(id: string): string {
  return id.replace(/^tk_/, "").replace(/^evt_/, "");
}

export async function listTickets(): Promise<Ticket[]> {
  const result = await apiRequest<TicketListResponse>("/admin/tickets?per_page=100");
  return result.data;
}

export async function getTicket(id: string): Promise<Ticket | undefined> {
  try {
    return await apiRequest<Ticket>(`/admin/tickets/${numericId(id)}`);
  } catch {
    return undefined;
  }
}

export async function purchaseTicket({
  eventId,
  tierName,
  deviceId,
  buyer,
  biometricSnapshot,
}: PurchaseTicketPayload): Promise<Ticket> {
  const result = await apiRequest<{ message: string; ticket: Ticket }>(
    `/events/${numericId(eventId)}/tickets/purchase`,
    {
      method: "POST",
      body: {
        tier_name: tierName,
        device_id: deviceId,
        buyer: {
          fullName: buyer.fullName ?? "",
          email: buyer.email ?? "",
          phone: buyer.phone ?? "",
          dateOfBirth: buyer.dateOfBirth ?? "",
          nationalId: buyer.nationalId ?? "",
        },
        biometric_snapshot: biometricSnapshot,
      },
    },
  );

  return result.ticket;
}

export async function claimTicket({
  ticketId,
  deviceId,
  buyer,
  biometricData,
  biometricSnapshot,
}: ClaimTicketPayload): Promise<Ticket> {
  const result = await apiRequest<{ message: string; ticket: Ticket }>(
    `/tickets/${numericId(ticketId)}/claim`,
    {
      method: "POST",
      body: {
        device_id: deviceId,
        buyer: {
          fullName: buyer.fullName ?? "",
          email: buyer.email ?? "",
          phone: buyer.phone ?? "",
          dateOfBirth: buyer.dateOfBirth ?? "",
          nationalId: buyer.nationalId ?? "",
        },
        biometric_data: biometricData ?? "",
        biometric_snapshot: biometricSnapshot ?? "",
      },
    },
  );

  return result.ticket;
}

export async function redeemTicket(id: string): Promise<Ticket> {
  const result = await apiRequest<{ message: string; ticket: Ticket }>(
    `/tickets/${numericId(id)}/redeem`,
    {
      method: "POST",
      body: {
        device_id: getDeviceId(),
      },
    },
  );

  return result.ticket;
}

export function newBiometricId(): string {
  return "bio_" + Math.random().toString(36).slice(2, 14);
}
