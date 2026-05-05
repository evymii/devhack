"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FaceCapture } from "@/components/face-capture";
import { getEventBySlug, formatDate, formatPrice } from "@/lib/events";
import { newBiometricId, newTicketId, saveTicket } from "@/lib/tickets";

type Step = "info" | "face" | "review";

type Form = {
  email: string;
  nationalId: string;
};

const initialForm: Form = {
  email: "",
  nationalId: "",
};

export default function CheckoutPage(
  props: PageProps<"/events/[slug]/checkout">,
) {
  const { slug } = use(props.params);
  const search = use(props.searchParams);
  const router = useRouter();
  const event = useMemo(() => getEventBySlug(slug), [slug]);
  const tierId =
    typeof search.tier === "string" ? search.tier : event?.tiers[0]?.id;
  const tier = event?.tiers.find((t) => t.id === tierId) ?? event?.tiers[0];

  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<Form>(initialForm);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!event || !tier) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="text-sm text-muted-foreground">Тоглолт олдсонгүй.</p>
      </main>
    );
  }

  const formComplete = form.email.trim() && form.nationalId.trim();

  const submit = () => {
    if (!snapshot) return;
    setSubmitting(true);
    const ticketId = newTicketId();
    saveTicket({
      id: ticketId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      venue: `${event.venue}, ${event.city}`,
      tierName: tier.name,
      pricePaid: tier.price,
      buyer: { ...form },
      biometric: {
        snapshot,
        enrolledAt: new Date().toISOString(),
      },
      status: "valid",
      createdAt: new Date().toISOString(),
    });
    router.push(`/events/${event.slug}/confirmation?t=${ticketId}`);
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Буцах
        </Button>
      </div>

      <div className="mb-8 flex items-center gap-2">
        <StepDot
          active={step === "info"}
          done={step !== "info"}
          label="1. Мэдээлэл"
        />
        <Connector />
        <StepDot
          active={step === "face"}
          done={step === "review"}
          label="2. Царай"
        />
        <Connector />
        <StepDot active={step === "review"} done={false} label="3. Хянах" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          {step === "info" && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h1 className="text-xl font-medium">Таны мэдээлэл</h1>
                  <p className="text-sm text-muted-foreground">
                    Царайны бүртгэлтэй хамт хадгалагдах ба зөвхөн нэвтрэх
                    баталгаажуулалтад ашиглана.
                  </p>
                </div>
                <Field label="Gmail">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="та@gmail.com"
                  />
                </Field>
                <Field label="Регистрийн дугаар">
                  <Input
                    value={form.nationalId}
                    onChange={(e) =>
                      setForm({ ...form, nationalId: e.target.value })
                    }
                    placeholder="АА12345678 эсвэл AA12345678"
                  />
                </Field>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setStep("face")}
                    disabled={!formComplete}
                    size="lg"
                  >
                    Face ID сонгохд үргэлжлүүлэх{" "}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "face" && (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h1 className="text-xl font-medium">Face ID - Пасс үг</h1>
                  <p className="text-sm text-muted-foreground">
                    Сайн гэрэлтэй орчинд камер руу шууд харна уу. Нэг удаа авч
                    энэхүү тасалбартай холбоно.
                  </p>
                </div>
                <FaceCapture
                  onCapture={(d) => setSnapshot(d || null)}
                  capturedSnapshot={snapshot}
                  ctaLabel="Царайгаа авах"
                />
                <div className="flex items-start gap-2 rounded-md border bg-secondary/30 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Таны царай зөвхөн энэ тасалбартай холбогдсон, буцаашгүй
                    биометрик загвар хэлбэрээр хадгалагдана. Сурталчилгаа,
                    гуравдагч этгээдэд огт ашиглахгүй.
                  </p>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("info")}>
                    <ArrowLeft className="size-4" /> Буцах
                  </Button>
                  <Button
                    onClick={() => setStep("review")}
                    disabled={!snapshot}
                    size="lg"
                  >
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
                  <h1 className="text-xl font-medium">Хянаж төлөх</h1>
                  <p className="text-sm text-muted-foreground">
                    Загварын төлбөр — бодит мөнгөн гүйлгээ хийгдэхгүй.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="aspect-square overflow-hidden rounded-lg border bg-zinc-900">
                    {snapshot && (
                      <img
                        src={snapshot}
                        alt="Бүртгэгдсэн царай"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <Row k="Gmail">{form.email}</Row>
                    <Row k="Регистрийн дугаар">{form.nationalId}</Row>
                    <Row k="Биометрик ID">
                      <span className="font-mono text-xs">
                        {newBiometricId().slice(0, 18)}…
                      </span>
                    </Row>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-md border p-3 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Баталгаажуулснаар та царайгаа зөвхөн энэ тоглолтын хаалган
                    дээрх скантай тулгахыг зөвшөөрнө.
                  </p>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("face")}>
                    <ArrowLeft className="size-4" /> Буцах
                  </Button>
                  <Button onClick={submit} disabled={submitting} size="lg">
                    {submitting
                      ? "Тасалбар бүртгэж байна…"
                      : `Баталгаажуулах — ${formatPrice(tier.price)}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <aside>
          <Card className="sticky top-20">
            <CardContent className="space-y-4 p-5">
              <div
                className={`h-24 rounded-md bg-linear-to-br ${event.heroGradient}`}
              />
              <div>
                <Badge variant="outline" className="mb-2">
                  {event.type === "festival" ? "Наадам" : "Стадион"}
                </Badge>
                <h2 className="text-base font-medium leading-tight">
                  {event.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.date)} · {event.venue}
                </p>
              </div>
              <div className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>{tier.name}</span>
                  <span className="font-medium">{formatPrice(tier.price)}</span>
                </div>
                <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  {tier.perks.map((p) => (
                    <li key={p}>· {p}</li>
                  ))}
                </ul>
              </div>
              <div className="border-t pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Дүн</span>
                  <span>{formatPrice(tier.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Үйлчилгээний хураамж
                  </span>
                  <span className="text-muted-foreground">$0</span>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
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
      <span
        className={
          active ? "text-sm font-medium" : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>
    </div>
  );
}

function Connector() {
  return <span className="h-px flex-1 bg-border" />;
}
