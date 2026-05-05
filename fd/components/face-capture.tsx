"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, Check, RotateCcw, ScanFace, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"

type Status = "idle" | "starting" | "live" | "captured" | "error"

type Props = {
  onCapture?: (snapshot: string) => void
  capturedSnapshot?: string | null
  ctaLabel?: string
}

export function FaceCapture({ onCapture, capturedSnapshot = null, ctaLabel = "Царайгаа авах" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<Status>(capturedSnapshot ? "captured" : "idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<string | null>(capturedSnapshot)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    setErrorMessage(null)
    setStatus("starting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus("live")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Камер ашиглах эрх олгогдсонгүй."
      setErrorMessage(msg)
      setStatus("error")
    }
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, w, h)
    const data = canvas.toDataURL("image/jpeg", 0.85)
    setSnapshot(data)
    setStatus("captured")
    stopStream()
    onCapture?.(data)
  }, [onCapture, stopStream])

  const retake = useCallback(() => {
    setSnapshot(null)
    setStatus("idle")
    onCapture?.("")
    void start()
  }, [onCapture, start])

  useEffect(() => () => stopStream(), [stopStream])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-zinc-950">
        {status === "captured" && snapshot ? (
          <img src={snapshot} alt="Captured face" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full -scale-x-100 object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {(status === "idle" || status === "starting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-zinc-100">
            <ScanFace className="size-10 opacity-80" />
            <p className="max-w-xs text-center text-sm text-zinc-300">
              Таны царай бол таны тасалбар. QR код, скрэншот хэрэгсэхгүй — зөвхөн та л өөрөө.
            </p>
            <Button onClick={start} disabled={status === "starting"} variant="default" size="lg">
              <Camera className="size-4" />
              {status === "starting" ? "Камер асаалаа байна…" : "Камер асаах"}
            </Button>
          </div>
        )}

        {status === "live" && (
          <>
            <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-emerald-400/70" />
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <Button onClick={capture} size="lg">
                <Camera className="size-4" />
                {ctaLabel}
              </Button>
            </div>
          </>
        )}

        {status === "captured" && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-medium text-white">
            <Check className="size-3.5" />
            Авлаа
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-6 text-center text-zinc-100">
            <VideoOff className="size-8" />
            <p className="text-sm">{errorMessage}</p>
            <Button variant="secondary" size="sm" onClick={start}>
              Дахин оролдох
            </Button>
          </div>
        )}
      </div>

      {status === "captured" && (
        <Button onClick={retake} variant="outline" size="sm" className="self-start">
          <RotateCcw className="size-4" />
          Дахин авах
        </Button>
      )}
    </div>
  )
}
