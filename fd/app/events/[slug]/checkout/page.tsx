"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Armchair, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaceCapture } from "@/components/face-capture";
import { type FestivalEvent, getEventBySlug, formatDate, formatPrice } from "@/lib/events";
import { getDeviceId, newBiometricId, purchaseTicket } from "@/lib/tickets";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

type Step = "seat" | "face" | "review";

function makeSeats(count: number): string[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
  const rowIndex = Math.floor(index / 20);
  const seatNumber = (index % 20) + 1;
  const row = String.fromCharCode(65 + rowIndex);
  return `${row}${seatNumber.toString().padStart(2, "0")}`;
  });
}

function nationalIdOf(user: CurrentUser | null): string {
  return user?.national_id ?? user?.nationalId ?? "";
}

export default function CheckoutPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tier?: string }>;
}) {
  const { slug } = use(props.params);
  const search = use(props.searchParams);
  const router = useRouter();
  const [event, setEvent] = useState<FestivalEvent | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("seat");
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tierId =
    typeof search.tier === "string" ? search.tier : event?.tiers[0]?.id;
  const tier = event?.tiers.find((t) => t.id === tierId) ?? event?.tiers[0];

  const seats = useMemo(() => makeSeats(tier?.capacity ?? tier?.remaining ?? 0), [tier?.capacity, tier?.remaining]);
  const unavailableSeats = useMemo(() => new Set(tier?.takenSeats ?? []), [tier?.takenSeats]);

  useEffect(() => {
    let mounted = true;

    getEventBySlug(slug)
      .then((result) => {
        if (mounted) setEvent(result ?? null);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Тоглолт ачаалахад алдаа гарлаа.");
        }
      })
      .finally(() => {
        if (mounted) setLoadingEvent(false);
      });

    getCurrentUser()
      .then((user) => {
        if (!mounted) return;
        setCurrentUser(user);
        if (!user) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
      })
      .finally(() => {
        if (mounted) setLoadingUser(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loadingEvent || loadingUser) {
    return <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12" />;
  }

  if (!event || !tier) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="text-sm text-muted-foreground">Тоглолт олдсонгүй.</p>
      </main>
    );
  }

  const submit = async () => {
    if (!snapshot || !selectedSeat || !currentUser) return;
    setSubmitting(true);
    setError(null);

    try {
      const ticket = await purchaseTicket({
        eventId: event.id,
        tierName: tier.name,
        deviceId: getDeviceId(),
        seatLabel: selectedSeat,
        buyer: {
          fullName: currentUser.name,
          email: currentUser.email,
          nationalId: nationalIdOf(currentUser),
        },
        biometricSnapshot: snapshot,
      });
      router.push(`/events/${event.slug}/confirmation?t=${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Тасалбар бүртгэхэд алдаа гарлаа.");
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Буцах
        </Button>
      </div>

      <div className="mb-8 flex items-center gap-2">
        <StepDot active={step === "seat"} done={step !== "seat"} label="1. Суудал" />
        <Connector />
        <StepDot active={step === "face"} done={step === "review"} label="2. Царай" />
        <Connector />
        <StepDot active={step === "review"} done={false} label="3. Хянах" />
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          {step === "seat" && (
            <Card>
              <CardContent className="space-y-5 p-6">
                <div>
                  <h1 className="text-xl font-medium">Суудлаа сонгоно уу</h1>
                  <p className="text-sm text-muted-foreground">
                    Энэ ангилалд нийт {seats.length} суудал байна. Боломжтой суудлаас нэгийг сонгоод царай баталгаажуулалт руу шилжинэ.
                  </p>
                </div>
                {seats.length > 0 ? (
                  <SeatMap
                    selectedSeat={selectedSeat}
                    seats={seats}
                    unavailableSeats={unavailableSeats}
                    onSelect={setSelectedSeat}
                  />
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Энэ ангилалд ticket pool үүсээгүй байна. Admin хэсгээс ticket нэмсний дараа суудал гарч ирнэ.
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="text-sm text-muted-foreground">
                    Сонгосон суудал: <span className="font-medium text-foreground">{selectedSeat ?? "-"}</span>
                  </div>
                  <Button onClick={() => setStep("face")} disabled={!selectedSeat} size="lg">
                    Үргэлжлүүлэх <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "face" && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h1 className="text-xl font-medium">Face ID</h1>
                  <p className="text-sm text-muted-foreground">
                    Gmail болон регистрийн мэдээллийг таны account-аас авна. Энд зөвхөн тасалбарт холбох царайг баталгаажуулна.
                  </p>
                </div>
                <AccountInfo user={currentUser} />
                <FaceCapture
                  onCapture={(d) => setSnapshot(d || null)}
                  capturedSnapshot={snapshot}
                  ctaLabel="Царайгаа авах"
                />
                <div className="flex items-start gap-2 rounded-md border bg-secondary/30 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  <p>Энэ царай зөвхөн тухайн тасалбарын нэвтрэх баталгаажуулалтад ашиглагдана.</p>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("seat")}>
                    <ArrowLeft className="size-4" /> Буцах
                  </Button>
                  <Button onClick={() => setStep("review")} disabled={!snapshot} size="lg">
                    Үргэлжлүүлэх <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "review" && (
            <Card>
              <CardContent className="space-y-5 p-6">
                <div>
                  <h1 className="text-xl font-medium">Хянах</h1>
                  <p className="text-sm text-muted-foreground">
                    Төлбөрийн demo flow. Бодит мөнгөн гүйлгээ хийгдэхгүй.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="aspect-square overflow-hidden rounded-lg border bg-zinc-900">
                    {snapshot && <img src={snapshot} alt="Бүртгэгдсэн царай" className="h-full w-full object-cover" />}
                  </div>
                  <div className="space-y-2 text-sm">
                    <Row k="Gmail">{currentUser?.email}</Row>
                    <Row k="Регистрийн дугаар">{nationalIdOf(currentUser)}</Row>
                    <Row k="Суудал">{selectedSeat}</Row>
                    <Row k="Биометрик ID">
                      <span className="font-mono text-xs">{newBiometricId().slice(0, 18)}...</span>
                    </Row>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-md border p-3 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 size-4 shrink-0" />
                  <p>Баталгаажуулснаар таны account-ийн мэдээлэл болон сонгосон суудал ticket дээр хадгалагдана.</p>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("face")}>
                    <ArrowLeft className="size-4" /> Буцах
                  </Button>
                  <Button onClick={submit} disabled={submitting} size="lg">
                    {submitting ? "Тасалбар бүртгэж байна..." : `Баталгаажуулах - ${formatPrice(tier.price)}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <aside>
          <Card className="sticky top-20">
            <CardContent className="space-y-4 p-5">
              <div className={`h-24 rounded-md bg-linear-to-br ${event.heroGradient}`} />
              <div>
                <Badge variant="outline" className="mb-2">
                  {event.type === "festival" ? "Наадам" : "Стадион"}
                </Badge>
                <h2 className="text-base font-medium leading-tight">{event.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.date)} · {event.venue}
                </p>
              </div>
              <div className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>{tier.name}</span>
                  <span className="font-medium">{formatPrice(tier.price)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Суудал</span>
                  <span>{selectedSeat ?? "Сонгоогүй"}</span>
                </div>
              </div>
              <div className="border-t pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Дүн</span>
                  <span>{formatPrice(tier.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Үйлчилгээний хураамж</span>
                  <span className="text-muted-foreground">0</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-base font-semibold">
                  <span>Нийт</span>
                  <span>{formatPrice(tier.price)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function SeatMap({
  selectedSeat,
  seats,
  unavailableSeats,
  onSelect,
}: {
  selectedSeat: string | null;
  seats: string[];
  unavailableSeats: Set<string>;
  onSelect: (seat: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-zinc-50 p-4">
      <div className="mx-auto mb-5 h-8 max-w-lg rounded-b-full bg-zinc-900 text-center text-xs font-medium uppercase tracking-widest text-white">
        Тайз
      </div>
      <div
        className="grid gap-1 overflow-x-auto pb-2"
        style={{ gridTemplateColumns: "repeat(20, minmax(1.75rem, 1fr))" }}
      >
        {seats.map((seat) => {
          const unavailable = unavailableSeats.has(seat);
          const selected = selectedSeat === seat;
          return (
            <button
              key={seat}
              type="button"
              disabled={unavailable}
              onClick={() => onSelect(seat)}
              className={`grid aspect-square min-w-7 place-items-center rounded text-[10px] font-medium transition ${
                selected
                  ? "bg-emerald-500 text-white"
                  : unavailable
                    ? "cursor-not-allowed bg-zinc-200 text-zinc-400"
                    : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-900 hover:text-white"
              }`}
              aria-label={`Seat ${seat}`}
            >
              <Armchair className="size-3" />
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="size-3 rounded bg-white ring-1 ring-zinc-200" /> Боломжтой</span>
        <span className="inline-flex items-center gap-1"><span className="size-3 rounded bg-emerald-500" /> Сонгосон</span>
        <span className="inline-flex items-center gap-1"><span className="size-3 rounded bg-zinc-200" /> Захиалагдсан</span>
      </div>
    </div>
  );
}

function AccountInfo({ user }: { user: CurrentUser | null }) {
  return (
    <div className="grid gap-2 rounded-md border bg-secondary/30 p-3 text-sm sm:grid-cols-2">
      <Row k="Gmail">{user?.email ?? "-"}</Row>
      <Row k="Регистр">{nationalIdOf(user) || "-"}</Row>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  const tone = active
    ? "border-foreground bg-foreground text-background"
    : done
      ? "border-emerald-500 bg-emerald-500 text-white"
      : "border-border bg-background text-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full border ${tone}`} />
      <span className={active ? "text-sm font-medium" : "text-sm text-muted-foreground"}>{label}</span>
    </div>
  );
}

function Connector() {
  return <span className="h-px flex-1 bg-border" />;
}
