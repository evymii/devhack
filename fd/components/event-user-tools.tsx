"use client";

import { FormEvent, useEffect, useState } from "react";
import { Download, Loader2, MessageSquare, Send, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getDeviceId } from "@/lib/tickets";
import {
  downloadEventData,
  listEventMessages,
  sendEventMessage,
  syncOfflineRecords,
  type EventMessage,
} from "@/lib/user-api";

export function EventUserTools({ eventId }: { eventId: string }) {
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [offlineCount, setOfflineCount] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refreshMessages = async () => {
    const data = await listEventMessages(eventId);
    setMessages(data);
  };

  useEffect(() => {
    refreshMessages().catch(() => setMessages([]));
  }, [eventId]);

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    setBusy("message");
    setStatus(null);

    try {
      await sendEventMessage({
        eventId,
        message: message.trim(),
        senderDeviceId: getDeviceId(),
        isEmergency,
      });
      setMessage("");
      setIsEmergency(false);
      await refreshMessages();
      setStatus("Message sent.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Message failed.");
    } finally {
      setBusy(null);
    }
  };

  const downloadData = async () => {
    setBusy("download");
    setStatus(null);

    try {
      const data = await downloadEventData(eventId);
      setOfflineCount(data.tickets.length);
      setStatus(`Offline data ready: ${data.tickets.length} tickets.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setBusy(null);
    }
  };

  const syncDemoRecord = async () => {
    setBusy("sync");
    setStatus(null);

    try {
      const result = await syncOfflineRecords({
        deviceId: getDeviceId(),
        records: [
          {
            entity_type: "checkin",
            entity_id: Number(eventId.replace("evt_", "")) || 1,
            payload: { synced_at: new Date().toISOString() },
          },
        ],
      });
      setStatus(`${result.message} (${result.total_queued})`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-lg">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <MessageSquare className="size-4" /> Event messages
            </div>
            <Badge variant="outline">{messages.length}</Badge>
          </div>
          <form className="space-y-3" onSubmit={submitMessage}>
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message"
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(event) => setIsEmergency(event.target.checked)}
                />
                Emergency
              </label>
              <Button type="submit" disabled={busy === "message" || !message.trim()}>
                {busy === "message" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Send
              </Button>
            </div>
          </form>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {messages.map((item) => (
              <div key={item.id} className="rounded-md border bg-secondary/20 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.user?.name ?? "User"}</span>
                  {item.is_emergency && <Badge variant="destructive">Emergency</Badge>}
                </div>
                <p className="mt-1 text-muted-foreground">{item.message}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="rounded-md border p-4 text-center text-sm text-muted-foreground">
                No messages yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 font-medium">
            <Wifi className="size-4" /> Offline tools
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={downloadData} disabled={busy === "download"}>
              {busy === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Download data
            </Button>
            <Button type="button" variant="outline" onClick={syncDemoRecord} disabled={busy === "sync"}>
              {busy === "sync" ? <Loader2 className="size-4 animate-spin" /> : <Wifi className="size-4" />}
              Sync record
            </Button>
          </div>
          <div className="rounded-md border bg-secondary/20 p-4 text-sm">
            <div className="text-muted-foreground">Offline ticket cache</div>
            <div className="mt-1 text-2xl font-light tabular-nums">{offlineCount ?? "-"}</div>
          </div>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
