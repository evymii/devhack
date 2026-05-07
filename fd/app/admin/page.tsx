"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  Loader2,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  createAdminEvent,
  deleteAdminEvent,
  deleteAdminTicket,
  generateAdminTickets,
  listAdminEvents,
  listAdminTickets,
  scanAdminTicket,
  type AdminEvent,
  type AdminTicketList,
  type ScanResult,
} from "@/lib/admin";
import { redeemTicket, type Ticket } from "@/lib/tickets";
import { formatDate, formatPrice } from "@/lib/events";
import { FaceScannerPanel } from "@/app/scanner/page";
import { getCurrentUser, isAdminUser, type CurrentUser } from "@/lib/auth";

type EventForm = {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
};

const initialEventForm: EventForm = {
  name: "",
  description: "",
  start_time: "",
  end_time: "",
  location: "",
};

export default function AdminPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [tickets, setTickets] = useState<AdminTicketList | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | "">("");
  const [eventForm, setEventForm] = useState<EventForm>(initialEventForm);
  const [ticketCount, setTicketCount] = useState(20);
  const [tierName, setTierName] = useState("VIP");
  const [pricePaid, setPricePaid] = useState(50000);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatus, setTicketStatus] = useState<"" | "valid" | "redeemed">("");
  const [scanMode, setScanMode] = useState<"qr" | "biometric">("qr");
  const [scanValue, setScanValue] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  const summary = tickets?.summary ?? { total: 0, valid: 0, redeemed: 0 };

  const refreshEvents = async () => {
    const data = await listAdminEvents();
    setEvents(data);
    if (!selectedEventId && data[0]) setSelectedEventId(data[0].id);
  };

  const refreshTickets = async () => {
    const data = await listAdminTickets({
      event_id: typeof selectedEventId === "number" ? selectedEventId : undefined,
      status: ticketStatus || undefined,
      search: ticketSearch.trim() || undefined,
    });
    setTickets(data);
  };

  useEffect(() => {
    getCurrentUser()
      .then(async (currentUser) => {
        setUser(currentUser);
        if (!isAdminUser(currentUser)) return;
        await Promise.all([refreshEvents(), listAdminTickets().then(setTickets)]);
      })
      .catch((err) => setMessage(errorMessage(err, "Admin data failed to load.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) refreshTickets().catch((err) => setMessage(errorMessage(err, "Tickets failed to load.")));
  }, [selectedEventId, ticketStatus]);

  const createEvent = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("event-create");
    setMessage(null);

    try {
      await createAdminEvent(eventForm);
      setEventForm(initialEventForm);
      await refreshEvents();
      setMessage("Event created.");
    } catch (err) {
      setMessage(errorMessage(err, "Event create failed."));
    } finally {
      setBusy(null);
    }
  };

  const removeEvent = async (eventId: number) => {
    setBusy(`event-delete-${eventId}`);
    setMessage(null);

    try {
      await deleteAdminEvent(eventId);
      await refreshEvents();
      if (selectedEventId === eventId) setSelectedEventId("");
      setMessage("Event deleted.");
    } catch (err) {
      setMessage(errorMessage(err, "Event delete failed."));
    } finally {
      setBusy(null);
    }
  };

  const generateTickets = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedEventId) return;
    setBusy("ticket-generate");
    setMessage(null);

    try {
      await generateAdminTickets({
        eventId: selectedEventId,
        count: ticketCount,
        tier_name: tierName,
        price_paid: pricePaid,
      });
      await refreshTickets();
      setMessage("Ticket pool created.");
    } catch (err) {
      setMessage(errorMessage(err, "Ticket generation failed."));
    } finally {
      setBusy(null);
    }
  };

  const removeTicket = async (ticketId: string) => {
    setBusy(`ticket-delete-${ticketId}`);
    setMessage(null);

    try {
      await deleteAdminTicket(ticketId);
      await refreshTickets();
      setMessage("Ticket deleted.");
    } catch (err) {
      setMessage(errorMessage(err, "Ticket delete failed."));
    } finally {
      setBusy(null);
    }
  };

  const scanTicket = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("scan");
    setMessage(null);
    setScanResult(null);

    try {
      const result = await scanAdminTicket(
        scanMode === "qr" ? { qr_code: scanValue } : { biometric_data: scanValue },
      );
      setScanResult(result);
    } catch (err) {
      setMessage(errorMessage(err, "Scan failed."));
    } finally {
      setBusy(null);
    }
  };

  const admitScannedTicket = async () => {
    if (!scanResult) return;
    setBusy("scan-redeem");
    setMessage(null);

    try {
      const ticket = await redeemTicket(scanResult.ticket.id);
      setScanResult({ ...scanResult, ticket, is_used: true, redeemed_at: ticket.redeemedAt });
      await refreshTickets();
      setMessage("Ticket admitted.");
    } catch (err) {
      setMessage(errorMessage(err, "Admit failed."));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <main className="grid flex-1 place-items-center bg-zinc-50">
        <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading admin console
        </div>
      </main>
    );
  }

  if (!isAdminUser(user)) {
    return (
      <main className="grid flex-1 place-items-center bg-zinc-50 px-6">
        <Card className="max-w-md rounded-lg border-zinc-200 bg-white shadow-sm">
          <CardContent className="p-6 text-center">
            <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-medium">Admin access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Scan, ticket generation, and event management are visible only for users with the admin role.
            </p>
            <Button asChild className="mt-4">
              <a href="/admin/auth?next=/admin">Admin login</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-zinc-50">
      <section className="border-b bg-zinc-950 text-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                <ShieldCheck className="size-3.5" /> MockAuth Admin
              </Badge>
              <h1 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">
                Event operations console
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/65">
                Manage events, prepare ticket inventory, scan holders, and admit guests using the existing API.
              </p>
            </div>
            <div className="grid min-w-[320px] grid-cols-3 overflow-hidden rounded-lg border border-white/10 bg-white/5">
              <Metric label="Tickets" value={summary.total} />
              <Metric label="Valid" value={summary.valid} tone="emerald" />
              <Metric label="Admitted" value={summary.redeemed} tone="sky" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        {message && (
          <div className="mb-5 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm">
            {message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-5">
            <Panel icon={<CalendarPlus className="size-4" />} title="Create event">
              <form className="space-y-3" onSubmit={createEvent}>
                <Field label="Name">
                  <Input required value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} />
                </Field>
                <Field label="Description">
                  <Input value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Start">
                    <Input required type="datetime-local" value={eventForm.start_time} onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })} />
                  </Field>
                  <Field label="End">
                    <Input required type="datetime-local" value={eventForm.end_time} onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })} />
                  </Field>
                </div>
                <Field label="Location">
                  <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
                </Field>
                <Button className="w-full" type="submit" disabled={busy === "event-create"}>
                  <Plus className="size-4" /> Create event
                </Button>
              </form>
            </Panel>

            <Panel icon={<TicketIcon className="size-4" />} title="Prepare ticket pool">
              <form className="space-y-3" onSubmit={generateTickets}>
                <EventSelect events={events} value={selectedEventId} onChange={setSelectedEventId} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Qty">
                    <Input type="number" min={1} max={500} value={ticketCount} onChange={(e) => setTicketCount(Number(e.target.value))} />
                  </Field>
                  <Field label="Tier">
                    <Input value={tierName} onChange={(e) => setTierName(e.target.value)} />
                  </Field>
                  <Field label="Price">
                    <Input type="number" min={0} value={pricePaid} onChange={(e) => setPricePaid(Number(e.target.value))} />
                  </Field>
                </div>
                <Button className="w-full" type="submit" disabled={!selectedEventId || busy === "ticket-generate"}>
                  <Plus className="size-4" /> Generate tickets
                </Button>
              </form>
            </Panel>

            <Panel icon={<QrCode className="size-4" />} title="Gate scan">
              <form className="space-y-3" onSubmit={scanTicket}>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={scanMode === "qr" ? "default" : "outline"} onClick={() => setScanMode("qr")}>
                    QR code
                  </Button>
                  <Button type="button" variant={scanMode === "biometric" ? "default" : "outline"} onClick={() => setScanMode("biometric")}>
                    Face data
                  </Button>
                </div>
                <Field label={scanMode === "qr" ? "QR code" : "Biometric data"}>
                  <Input value={scanValue} onChange={(e) => setScanValue(e.target.value)} placeholder={scanMode === "qr" ? "QR-ABCD-EFGH" : "base64_face_embedding"} />
                </Field>
                <Button className="w-full" type="submit" disabled={!scanValue.trim() || busy === "scan"}>
                  <Search className="size-4" /> Scan
                </Button>
              </form>
              {scanResult && (
                <div className="mt-4 rounded-lg border bg-zinc-50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{scanResult.ticket.eventTitle}</div>
                      <div className="text-xs text-muted-foreground">
                        {scanResult.ticket.tierName} · {scanResult.ticket.id}
                      </div>
                      <div className="mt-2 text-xs">
                        {scanResult.buyer.fullName || scanResult.ticket.buyer.nationalId || "Unclaimed ticket"}
                      </div>
                    </div>
                    <Badge variant={scanResult.is_used ? "secondary" : "success"}>
                      {scanResult.is_used ? "Used" : "Valid"}
                    </Badge>
                  </div>
                  <Button className="mt-3 w-full" disabled={scanResult.is_used || busy === "scan-redeem"} onClick={admitScannedTicket}>
                    Admit guest
                  </Button>
                </div>
              )}
            </Panel>
          </aside>

          <section className="space-y-5">
            <Card className="overflow-hidden rounded-lg border-zinc-200 bg-white shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div>
                  <h2 className="font-medium">Face scan gate</h2>
                  <p className="text-xs text-muted-foreground">
                    Camera-based biometric admission lives in admin now.
                  </p>
                </div>
                <FaceScannerPanel embedded />
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-lg border-zinc-200 bg-white shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-medium">Events</h2>
                    <p className="text-xs text-muted-foreground">Existing API supports create, read, and soft delete.</p>
                  </div>
                  {selectedEvent && (
                    <Badge variant="outline" className="w-fit">
                      Selected: {selectedEvent.name}
                    </Badge>
                  )}
                </div>
                <div className="divide-y">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                        selectedEventId === event.id ? "bg-emerald-50/70" : "bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <button type="button" className="min-w-0 text-left" onClick={() => setSelectedEventId(event.id)}>
                        <div className="truncate font-medium">{event.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDate(event.start_time)} · {event.location ?? "No location"}
                        </div>
                      </button>
                      <Button size="sm" variant="destructive" disabled={busy === `event-delete-${event.id}`} onClick={() => removeEvent(event.id)}>
                        <Trash2 className="size-3.5" /> Delete
                      </Button>
                    </div>
                  ))}
                  {events.length === 0 && <EmptyState label="No events yet" />}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-lg border-zinc-200 bg-white shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col gap-3 border-b p-5 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <h2 className="font-medium">Tickets</h2>
                    <p className="text-xs text-muted-foreground">
                      {tickets ? `${tickets.summary.total} total · ${tickets.summary.valid} valid · ${tickets.summary.redeemed} admitted` : "Loading"}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[220px_140px_auto]">
                    <Input placeholder="Search name, email, ID, QR" value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} />
                    <select className="h-8 rounded-lg border bg-background px-2 text-sm" value={ticketStatus} onChange={(e) => setTicketStatus(e.target.value as "" | "valid" | "redeemed")}>
                      <option value="">All status</option>
                      <option value="valid">Valid</option>
                      <option value="redeemed">Admitted</option>
                    </select>
                    <Button type="button" variant="outline" onClick={refreshTickets}>
                      <Search className="size-4" /> Filter
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-zinc-50 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Ticket</th>
                        <th className="px-4 py-3 font-medium">Event</th>
                        <th className="px-4 py-3 font-medium">Tier</th>
                        <th className="px-4 py-3 font-medium">Buyer</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tickets?.data.map((ticket) => (
                        <TicketRow key={ticket.id} ticket={ticket} busy={busy === `ticket-delete-${ticket.id}`} onDelete={() => removeTicket(ticket.id)} />
                      ))}
                    </tbody>
                  </table>
                  {tickets?.data.length === 0 && <EmptyState label="No tickets found" />}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function Metric({
  label,
  value,
  tone = "zinc",
}: {
  label: string;
  value: number;
  tone?: "zinc" | "emerald" | "sky";
}) {
  const tones = {
    zinc: "text-white",
    emerald: "text-emerald-300",
    sky: "text-sky-300",
  };

  return (
    <div className="border-r border-white/10 px-4 py-3 last:border-r-0">
      <div className={`text-2xl font-light tabular-nums ${tones[tone]}`}>{value}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-lg border-zinc-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <span className="grid size-8 place-items-center rounded-md bg-zinc-950 text-white">{icon}</span>
          {title}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function EventSelect({
  events,
  value,
  onChange,
}: {
  events: AdminEvent[];
  value: number | "";
  onChange: (value: number | "") => void;
}) {
  return (
    <Field label="Event">
      <select
        className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
      >
        <option value="">Select event</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function TicketRow({
  ticket,
  busy,
  onDelete,
}: {
  ticket: Ticket;
  busy: boolean;
  onDelete: () => void;
}) {
  return (
    <tr className="bg-white hover:bg-zinc-50">
      <td className="px-4 py-3 font-mono text-xs">{ticket.id}</td>
      <td className="px-4 py-3">{ticket.eventTitle}</td>
      <td className="px-4 py-3">{ticket.tierName}</td>
      <td className="px-4 py-3">
        <div>{ticket.buyer.fullName || ticket.buyer.nationalId || "Unclaimed"}</div>
        <div className="text-xs text-muted-foreground">{ticket.buyer.email || "No email"}</div>
      </td>
      <td className="px-4 py-3">{formatPrice(ticket.pricePaid)}</td>
      <td className="px-4 py-3">
        <Badge variant={ticket.status === "valid" ? "success" : "secondary"}>
          {ticket.status === "valid" ? "Valid" : "Admitted"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant="destructive" disabled={busy || ticket.status === "redeemed"} onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid place-items-center gap-2 p-10 text-center text-sm text-muted-foreground">
      <Users className="size-5" />
      {label}
    </div>
  );
}
