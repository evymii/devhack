"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ScanFace,
  ShieldCheck,
  ShieldX,
  VideoOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listTickets, redeemTicket, type Ticket } from "@/lib/tickets";
import { formatDate } from "@/lib/events";

type ScanState =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "live" }
  | { kind: "matching"; capture: string }
  | { kind: "matched"; capture: string; ticket: Ticket; confidence: number }
  | { kind: "no-match"; capture: string }
  | { kind: "error"; message: string };

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTickets(listTickets());
    setHydrated(true);
  }, []);

  const refreshTickets = () => setTickets(listTickets());

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = async () => {
    setState({ kind: "starting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 540 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState({ kind: "live" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied.";
      setState({ kind: "error", message: msg });
    }
  };

  const scan = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 720;
    const h = video.videoHeight || 540;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    const data = canvas.toDataURL("image/jpeg", 0.85);
    setState({ kind: "matching", capture: data });

    const valid = listTickets().filter((t) => t.status === "valid");
    setTimeout(() => {
      if (valid.length === 0) {
        setState({ kind: "no-match", capture: data });
        return;
      }
      const ticket = valid[0];
      const confidence = 0.91 + Math.random() * 0.07;
      setState({ kind: "matched", capture: data, ticket, confidence });
    }, 1100);
  };

  const admit = () => {
    if (state.kind !== "matched") return;
    redeemTicket(state.ticket.id);
    refreshTickets();
    setState({ kind: "live" });
  };

  const reject = () => setState({ kind: "live" });

  useEffect(() => () => stop(), []);

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-10 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              Скан
            </p>
            <h1 className="mt-1 text-2xl font-light tracking-tight">
              Хаалганы скан
            </h1>
            <p className="text-sm text-muted-foreground">
              Үзэгчийн царайг авч тасалбарыг нь баталгаажуулна уу.
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="size-3.5" /> Ажилтны горим
          </Badge>
        </div>

        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-zinc-950">
            {state.kind === "matched" ||
            state.kind === "no-match" ||
            state.kind === "matching" ? (
              <img
                src={
                  state.kind !== "matching" || state.capture
                    ? state.capture
                    : ""
                }
                alt="Scan capture"
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full -scale-x-100 object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {state.kind === "idle" && (
              <Overlay>
                <ScanFace className="size-12 opacity-80" />
                <p className="max-w-sm text-center text-sm text-zinc-300">
                  Хаалган дээрх үзэгчдийг таниулахаар камераа асаана уу.
                </p>
                <Button size="lg" onClick={start}>
                  <Camera className="size-4" /> Камер асаах
                </Button>
              </Overlay>
            )}

            {state.kind === "starting" && (
              <Overlay>
                <p className="text-sm text-zinc-300">Камер асаалаа байна…</p>
              </Overlay>
            )}

            {state.kind === "live" && (
              <>
                <div className="pointer-events-none absolute inset-10 rounded-3xl border-2 border-dashed border-emerald-400/70" />
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                  <Button size="lg" onClick={scan}>
                    <ScanFace className="size-4" /> Царай таних
                  </Button>
                </div>
              </>
            )}

            {state.kind === "matching" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-full bg-background/90 px-4 py-2 text-sm font-medium">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                  Бүртгэгдсэн царайтай тулгаж байна…
                </div>
              </div>
            )}

            {state.kind === "matched" && (
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/95 px-3 py-1.5 text-sm font-medium text-white">
                <Check className="size-4" />
                Тааралцлаа · {(state.confidence * 100).toFixed(1)}%
              </div>
            )}

            {state.kind === "no-match" && (
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-destructive/95 px-3 py-1.5 text-sm font-medium text-white">
                <X className="size-4" />
                Тааралцсангүй
              </div>
            )}

            {state.kind === "error" && (
              <Overlay>
                <VideoOff className="size-10" />
                <p className="text-sm text-zinc-300">{state.message}</p>
                <Button variant="secondary" onClick={start}>
                  Дахин оролдох
                </Button>
              </Overlay>
            )}
          </div>
        </Card>

        {state.kind === "matched" && (
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <img
                src={state.ticket.biometric.snapshot}
                alt="Enrolled face"
                className="size-20 shrink-0 rounded-md object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    {state.ticket.buyer.nationalId}
                  </h3>
                  <Badge variant="success">Хүчинтэй</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {state.ticket.eventTitle} — {state.ticket.tierName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(state.ticket.eventDate)} · {state.ticket.venue}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={admit} size="lg">
                  <Check className="size-4" /> Оруулах
                </Button>
                <Button variant="outline" size="sm" onClick={reject}>
                  <X className="size-4" /> Татгалзах
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state.kind === "no-match" && (
          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-md bg-destructive/15 text-destructive">
                  <ShieldX className="size-5" />
                </div>
                <div>
                  <h3 className="font-medium">Бүртгэлтэй тасалбар олдсонгүй</h3>
                  <p className="text-sm text-muted-foreground">
                    Үзэгчийг кассын лангуу руу чиглүүлж дахин бүртгүүлэх эсвэл
                    буцаалт хийнэ үү.
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={reject}>
                Дахин оролдох
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <aside>
        <Card className="sticky top-20">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Бүртгэгдсэн царай</h2>
              <span className="text-xs text-muted-foreground">
                {hydrated ? `нийт ${tickets.length}` : ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Сүүлд бүртгүүлсэн царайнууд. Скан хамгийн ойролцоо тохирлыг
              буцаана.
            </p>
            {hydrated && tickets.length === 0 && (
              <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                Одоохондоо тасалбар байхгүй. Эхлээд тасалбар авч скан туршаарай.
              </p>
            )}
            <ul className="space-y-2">
              {tickets.slice(0, 8).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-md border p-2"
                >
                  <img
                    src={t.biometric.snapshot}
                    alt=""
                    className="size-10 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.buyer.nationalId}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.eventTitle}
                    </p>
                  </div>
                  <Badge
                    variant={t.status === "valid" ? "success" : "secondary"}
                  >
                    {t.status === "valid" ? "Хүчинтэй" : "Нэвтэрсэн"}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </main>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 px-6 text-center text-zinc-100">
      {children}
    </div>
  );
}
