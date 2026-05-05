"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ScanFace,
  ShieldCheck,
  ShieldX,
  VideoOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listTickets, redeemTicket, type Ticket } from "@/lib/tickets";
import {
  computeDescriptorFromVideo,
  FACE_MATCH_THRESHOLD,
  FACE_MATCH_THRESHOLD_MAX,
  FACE_MATCH_THRESHOLD_MIN,
  findBestMatch,
  hydrateDescriptors,
  isFaceInsideFocusAreaFromVideo,
  loadModels,
  type MatchConfidence,
  type FaceDetectionFailure,
  type MatchResult,
  type TicketDescriptor,
} from "@/lib/face-matching";

type ScanState =
  | "idle"
  | "models-loading"
  | "camera-ready"
  | "matching"
  | "matched"
  | "no-match"
  | "error";

export function FaceScannerPanel({ embedded = false }: { embedded?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const descriptorsRef = useRef<TicketDescriptor[]>([]);
  const modelsLoadedRef = useRef(false);
  const isMatchingRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [capture, setCapture] = useState<string | null>(null);
  const [bestMatch, setBestMatch] = useState<MatchResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [noMatchReason, setNoMatchReason] = useState<
    "no-face" | "biometric-mismatch" | "partial-face" | "outside-focus-area" | "face-too-small" | null
  >(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isInFocusArea, setIsInFocusArea] = useState<boolean | null>(null);
  const [matchThreshold, setMatchThreshold] = useState(FACE_MATCH_THRESHOLD);

  const hydrateTicketsWithDescriptors = async (): Promise<void> => {
    const loadedTickets = await listTickets();
    setTickets(loadedTickets);
    descriptorsRef.current = await hydrateDescriptors(loadedTickets);
  };

  const start = async () => {
    setStatusMessage(null);
    setNoMatchReason(null);
    setBestMatch(null);
    setCapture(null);
    setIsVideoReady(false);
    setScanState("models-loading");

    try {
      if (!modelsLoadedRef.current) {
        await loadModels();
        modelsLoadedRef.current = true;
      }
      await hydrateTicketsWithDescriptors();
    } catch (error) {
      const detail = error instanceof Error ? ` (${error.message})` : "";
      setStatusMessage(`Model ачаалалт амжилтгүй.${detail}`);
      setScanState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 720, height: 540 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error("Видео элемент олдсонгүй"));
            return;
          }

          const onLoadedMetadata = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error("Камерын metadata ачаалж чадсангүй"));
          };
          const cleanup = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);
          if (video.readyState >= 1) {
            cleanup();
            resolve();
          }
        });
        await videoRef.current.play();
      }
      setIsVideoReady(true);
      setIsInFocusArea(null);
      setScanState("camera-ready");
    } catch {
      setStatusMessage(
        "Камерт хандах боломжгүй байна. Camera permission-оо зөвшөөрөөд дахин оролдоно уу.",
      );
      setScanState("error");
    }
  };

  const getCaptureFromVideo = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return null;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      return null;
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return null;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.translate(width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.88);
  };

  const scan = async () => {
    if (isMatchingRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      setStatusMessage("Камер бэлэн биш байна. Камераа дахин асаана уу.");
      setScanState("error");
      return;
    }
    if (!isVideoReady) {
      setStatusMessage("Камер дөнгөж асаж байна. 1-2 секунд хүлээгээд дахин оролдоно уу.");
      setNoMatchReason("no-face");
      setScanState("no-match");
      return;
    }

    const frameCapture = getCaptureFromVideo();
    if (!frameCapture) {
      setStatusMessage("Видео frame бэлэн болоогүй байна. Камер луу ойртоод дахин оролдоно уу.");
      setNoMatchReason(null);
      setScanState("camera-ready");
      return;
    }

    setCapture(frameCapture);
    setNoMatchReason(null);
    setBestMatch(null);
    setStatusMessage(null);
    setScanState("matching");
    isMatchingRef.current = true;

    try {
      const liveResult = await computeDescriptorFromVideo(video);
      if (!liveResult) {
        setNoMatchReason("no-face");
        setStatusMessage("Царай олдсонгүй");
        setScanState("no-match");
        return;
      }

      if (descriptorsRef.current.length === 0) {
        setStatusMessage("Хүчинтэй тасалбарын царайны өгөгдөл олдсонгүй.");
        setScanState("no-match");
        return;
      }

      const match = findBestMatch(
        liveResult.descriptor,
        descriptorsRef.current,
        matchThreshold,
      );
      if (!match) {
        setNoMatchReason("biometric-mismatch");
        setStatusMessage(
          "Таны царай таарахгүй байна, кассын ажилтантай уулзана уу",
        );
        setScanState("no-match");
        return;
      }

      setBestMatch(match);
      setScanState("matched");
    } catch (error) {
      const code = (error as { code?: FaceDetectionFailure } | null)?.code;
      if (code === "partial-face") {
        setNoMatchReason("partial-face");
        setStatusMessage("Царайгаа бүтэн харуулна уу.");
        setScanState("no-match");
      } else if (code === "outside-focus-area") {
        setNoMatchReason("outside-focus-area");
        setStatusMessage("Царайгаа хүрээний төв хэсэгт байрлуулна уу.");
        setScanState("no-match");
      } else if (code === "face-too-small") {
        setNoMatchReason("face-too-small");
        setStatusMessage("Царайгаа камер луу ойртуулна уу");
        setScanState("no-match");
      } else {
        setStatusMessage("Тулгалт хийх явцад алдаа гарлаа. Дахин оролдоно уу.");
        setScanState("error");
      }
    } finally {
      isMatchingRef.current = false;
    }
  };

  const admit = async () => {
    if (!bestMatch) return;
    await redeemTicket(bestMatch.ticket.id);
    await hydrateTicketsWithDescriptors().catch(() => {
      setStatusMessage("Тасалбар шинэчлэх үед алдаа гарлаа.");
      setScanState("error");
    });
    setBestMatch(null);
    setCapture(null);
    setScanState("camera-ready");
  };

  const retry = () => {
    setBestMatch(null);
    setCapture(null);
    setNoMatchReason(null);
    setStatusMessage(null);
    setScanState("camera-ready");
  };

  useEffect(() => {
    if (scanState !== "camera-ready" || !isVideoReady) {
      setIsInFocusArea(null);
      return;
    }

    let cancelled = false;
    const video = videoRef.current;
    if (!video) return;

    const timer = window.setInterval(async () => {
      if (cancelled || isMatchingRef.current) return;
      const inFocus = await isFaceInsideFocusAreaFromVideo(video);
      if (!cancelled) {
        setIsInFocusArea(inFocus);
      }
    }, 650);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [scanState, isVideoReady]);

  useEffect(() => {
    const videoElement = videoRef.current;
    return () => {
      isMatchingRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoElement) {
        videoElement.srcObject = null;
      }
      setIsVideoReady(false);
      setIsInFocusArea(null);
    };
  }, []);

  const Shell = embedded ? "div" : "main";

  return (
    <Shell
      className={
        embedded
          ? "grid w-full gap-6 lg:grid-cols-[1fr_320px]"
          : "mx-auto grid w-full max-w-6xl flex-1 gap-6 px-6 py-10 lg:grid-cols-[1fr_360px]"
      }
    >
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-tight">Хаалганы скан</h1>
            <p className="text-sm text-muted-foreground">Биометр танилт идэвхтэй байна.</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="size-3.5" /> Ажилтны горим
          </Badge>
        </div>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm text-muted-foreground">Distance threshold</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={matchThreshold === FACE_MATCH_THRESHOLD_MIN ? "default" : "outline"}
                onClick={() => setMatchThreshold(FACE_MATCH_THRESHOLD_MIN)}
              >
                0.40
              </Button>
              <Button
                type="button"
                size="sm"
                variant={matchThreshold === FACE_MATCH_THRESHOLD ? "default" : "outline"}
                onClick={() => setMatchThreshold(FACE_MATCH_THRESHOLD)}
              >
                {FACE_MATCH_THRESHOLD.toFixed(2)}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={matchThreshold === FACE_MATCH_THRESHOLD_MAX ? "default" : "outline"}
                onClick={() => setMatchThreshold(FACE_MATCH_THRESHOLD_MAX)}
              >
                0.45
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-zinc-950">
            {(scanState === "matching" ||
              scanState === "matched" ||
              scanState === "no-match" ||
              scanState === "error") &&
            capture ? (
                <img
                  src={capture}
                  alt="Captured live face frame"
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
            {(scanState === "camera-ready" || scanState === "matching") && (
              <div
                className={`pointer-events-none absolute left-1/2 top-1/2 h-[76%] w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-dashed ${
                  isInFocusArea === true
                    ? "border-emerald-400/90"
                    : isInFocusArea === false
                      ? "border-amber-400/90"
                      : "border-white/60"
                }`}
              />
            )}
            <canvas ref={canvasRef} className="hidden" />

            {scanState === "idle" && (
              <Overlay>
                <ScanFace className="size-12 opacity-80" />
                <Button size="lg" onClick={start}>Камер асаах</Button>
              </Overlay>
            )}

            {scanState === "models-loading" && (
              <Overlay>
                <Loader2 className="size-8 animate-spin" />
                <p>AI Моделиудыг ачаалж байна...</p>
              </Overlay>
            )}

            {scanState === "camera-ready" && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center">
                <Button
                  size="lg"
                  onClick={scan}
                  disabled={!isVideoReady}
                  className="rounded-full shadow-xl"
                >
                  <Camera className="mr-2 size-4" /> Царай уншуулах
                </Button>
              </div>
            )}

            {scanState === "matching" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-full bg-background/90 px-4 py-2 text-sm">
                  <Loader2 className="size-4 animate-spin text-emerald-500" />
                  Тулгалт хийж байна...
                </div>
              </div>
            )}

            {scanState === "matched" && bestMatch && (
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white">
                <Check className="size-4" /> {(100 - bestMatch.distance * 100).toFixed(1)}% Тохирлоо
              </div>
            )}
          </div>
        </Card>

        {statusMessage && (
          <Card
            className={
              scanState === "error"
                ? "border-red-300 bg-red-50"
                : scanState === "no-match"
                  ? "border-amber-300 bg-amber-50"
                  : "border-zinc-200"
            }
          >
            <CardContent className="p-4 text-sm">{statusMessage}</CardContent>
          </Card>
        )}

        {scanState === "matched" && bestMatch && (
          <Card className="border-emerald-500 bg-emerald-50/50">
            <CardContent className="flex items-center gap-4 p-4">
              <img
                src={bestMatch.ticket.biometric.snapshot}
                alt="Matched ticket face"
                className="size-20 rounded-md object-cover border-2 border-emerald-500"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold">{bestMatch.ticket.buyer.nationalId}</h3>
                <p className="text-sm">{bestMatch.ticket.eventTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Distance: {bestMatch.distance.toFixed(4)} · Confidence:{" "}
                  <ConfidenceLabel value={bestMatch.confidence} />
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={admit} size="lg" className="bg-emerald-600 hover:bg-emerald-700">Оруулах</Button>
                <Button variant="ghost" onClick={retry}>Цуцлах</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {scanState === "no-match" && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <ShieldX className="text-red-500" />
                <p className="font-medium text-red-700">
                  {noMatchReason === "biometric-mismatch"
                    ? "Таны царай таарахгүй байна, кассын ажилтантай уулзана уу"
                    : noMatchReason === "partial-face"
                      ? "Царайгаа бүтэн харуулна уу"
                      : noMatchReason === "outside-focus-area"
                        ? "Царайгаа хүрээний төв хэсэгт байрлуулна уу"
                        : noMatchReason === "face-too-small"
                          ? "Царайгаа камер луу ойртуулна уу"
                          : "Царай олдсонгүй"}
                </p>
              </div>
              <Button variant="outline" onClick={retry}>Дахин оролдох</Button>
            </CardContent>
          </Card>
        )}

        {scanState === "error" && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <VideoOff className="text-red-500" />
                <p className="font-medium text-red-700">
                  {statusMessage ?? "Системийн алдаа гарлаа. Дахин эхлүүлнэ үү."}
                </p>
              </div>
              <Button variant="outline" onClick={start}>
                Дахин эхлүүлэх
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <aside>
        <Card className="sticky top-20">
          <CardContent className="p-5 space-y-4">
            <h2 className="font-medium">Бүртгэлтэй үзэгчид ({tickets.length})</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2 border rounded-lg text-xs">
                  <img
                    src={t.biometric.snapshot}
                    alt="Ticket holder face"
                    className="size-8 rounded-full object-cover"
                  />
                  <div className="flex-1 truncate">
                    <p className="font-bold">{t.buyer.nationalId}</p>
                    <p className="opacity-60">{t.status === "valid" ? "Хүчинтэй" : "Орсон"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>
    </Shell>
  );
}

export default function ScannerPage() {
  return <FaceScannerPanel />;
}

function ConfidenceLabel({ value }: { value: MatchConfidence }) {
  if (value === "high") {
    return <span className="font-medium text-emerald-700">High</span>;
  }
  if (value === "medium") {
    return <span className="font-medium text-amber-700">Medium</span>;
  }
  return <span className="font-medium text-red-700">Low</span>;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-6 text-center text-white">
      {children}
    </div>
  );
}
