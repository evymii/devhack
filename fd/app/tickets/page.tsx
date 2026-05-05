"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, ScanFace, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listTickets, type Ticket } from "@/lib/tickets";
import { formatDate, formatPrice } from "@/lib/events";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTickets(listTickets());
    setHydrated(true);
  }, []);

  if (!hydrated)
    return <main className="mx-auto w-full max-w-4xl px-6 py-12" />;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Тасалбар
          </p>
          <h1 className="mt-2 text-3xl font-light tracking-tight">
            Миний тасалбарууд
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Царайтай тань холбогдсон, дамжуулах боломжгүй тасалбарууд.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/events">Тоглолт үзэх</Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <TicketIcon className="size-8 text-muted-foreground" />
            <h2 className="text-lg font-medium">Одоохондоо тасалбар алга</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Та тасалбар авмагц царайтай нь холбогдсон төлвөөр энд харагдана.
            </p>
            <Button asChild className="mt-2">
              <Link href="/events">Тоглолт сонгох</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <div className="flex items-stretch">
                <div className="relative w-32 shrink-0 bg-zinc-900">
                  <img
                    src={t.biometric.snapshot}
                    alt="Face ID"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <ScanFace className="size-3" />
                    </span>
                  </div>
                </div>
                <CardContent className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-medium leading-tight">
                        {t.eventTitle}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {t.tierName}
                      </p>
                    </div>
                    <Badge
                      variant={t.status === "valid" ? "success" : "secondary"}
                    >
                      {t.status === "valid" ? "Хүчинтэй" : "Нэвтэрсэн"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(t.eventDate)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {t.venue}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t pt-2 text-sm">
                    <span className="text-muted-foreground">
                      {t.buyer.nationalId}
                    </span>
                    <span className="font-semibold">
                      {formatPrice(t.pricePaid)}
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
