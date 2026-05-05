import { apiRequest } from "@/lib/api";
import type { Ticket } from "@/lib/tickets";

export type EventMessage = {
  id: number;
  message: string;
  is_emergency: boolean;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
};

export type DownloadData = {
  event: unknown;
  tickets: Ticket[];
  schedule: unknown[];
  downloaded_at: string;
};

export type SyncRecord = {
  entity_type: string;
  entity_id: number;
  payload: Record<string, unknown>;
};

type MessagesResponse = {
  data: EventMessage[];
};

function numericId(id: string | number): string {
  return String(id).replace(/^tk_/, "").replace(/^evt_/, "");
}

export async function listEventMessages(eventId: string | number): Promise<EventMessage[]> {
  const result = await apiRequest<MessagesResponse>(`/events/${numericId(eventId)}/messages`);
  return result.data;
}

export async function sendEventMessage(payload: {
  eventId: string | number;
  message: string;
  senderDeviceId: string;
  isEmergency?: boolean;
}): Promise<EventMessage> {
  return apiRequest<EventMessage>(`/events/${numericId(payload.eventId)}/messages`, {
    method: "POST",
    body: {
      message: payload.message,
      sender_device_id: payload.senderDeviceId,
      is_emergency: payload.isEmergency ?? false,
    },
  });
}

export async function downloadEventData(eventId: string | number): Promise<DownloadData> {
  return apiRequest<DownloadData>(`/events/${numericId(eventId)}/download-data`);
}

export async function syncOfflineRecords(payload: {
  deviceId: string;
  records: SyncRecord[];
}): Promise<{
  message: string;
  total_queued: number;
  chunks_count: number;
}> {
  return apiRequest("/sync", {
    method: "POST",
    body: {
      device_id: payload.deviceId,
      records: payload.records,
    },
  });
}
