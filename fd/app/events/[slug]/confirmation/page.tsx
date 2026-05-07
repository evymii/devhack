"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  MapPin,
  ScanFace,
  Ticket as TicketIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTicket, type Ticket } from "@/lib/tickets";
import { formatDate, formatPrice } from "@/lib/events";

export default function ConfirmationPage(
  props: PageProps<"/events/[slug]/confirmation">,
) {
  const search = use(props.searchParams);
  const id = typeof search.t === "string" ? search.t : null;
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!id) return;
    getTicket(id).then((result) => setTicket(result ?? null));
  }, [id]);

  if (!ticket) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Тасалбар олдсонгүй.</p>
        <Button asChild className="mt-4">
          <Link href="/events">Тоглолт руу буцах</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
          <Check className="size-6" />
        </div>
        <h1 className="text-2xl font-light tracking-tight">
          Тасалбар таныг хүлээж байна.
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Таны царай амжилттай бүртгэгдлээ. Хаалган дээр зогсоход скан таныг
          таниад лангуу нээгдэнэ. QR код байхгүй.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-stretch">
          <div className="relative w-44 shrink-0 bg-zinc-900">
            <img
              src={ticket.biometric.snapshot}
              alt="Бүртгэгдсэн царай"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 text-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-medium text-white">
                <ScanFace className="size-3" /> Face ID идэвхтэй
              </span>
            </div>
          </div>
          <CardContent className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <Badge variant="success">
                {ticket.status === "valid" ? "Хүчинтэй" : "Нэвтэрсэн"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                #{ticket.id}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-medium leading-tight">
                {ticket.eventTitle}
              </h2>
              <p className="text-sm text-muted-foreground">{ticket.tierName}</p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3.5" />
                {formatDate(ticket.eventDate)}
              </p>
              <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-3.5" />
                {ticket.venue}
              </p>
            </div>
            <div className="mt-auto flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">
                {ticket.seatLabel ? `${ticket.buyer.nationalId} · Seat ${ticket.seatLabel}` : ticket.buyer.nationalId}
              </span>
              <span className="text-sm font-semibold">
                {formatPrice(ticket.pricePaid)}
              </span>
            </div>
          </CardContent>
        </div>
      </Card>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline">
          <Link href="/tickets">
            <TicketIcon className="size-4" /> Тасалбараа харах
          </Link>
        </Button>
        <Button asChild>
          <Link href="/events">Өөр тоглолт үзэх</Link>
        </Button>
      </div>
    </main>
  );
}
