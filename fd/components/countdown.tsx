"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

function diff(target: number) {
  const ms = Math.max(0, target - Date.now())
  const day = Math.floor(ms / 86400000)
  const hr = Math.floor((ms % 86400000) / 3600000)
  const min = Math.floor((ms % 3600000) / 60000)
  const sec = Math.floor((ms % 60000) / 1000)
  return { day, hr, min, sec }
}

function CountdownComponent({
  isoDate,
  size = "md",
}: {
  isoDate: string
  size?: "sm" | "md" | "lg"
}) {
  const target = new Date(isoDate).getTime()
  const [t, setT] = useState(() => diff(target))
  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  const num =
    size === "lg" ? "text-5xl sm:text-6xl" : size === "sm" ? "text-2xl" : "text-3xl"
  const lbl = size === "sm" ? "text-[10px]" : "text-xs"

  return (
    <div className="flex items-end gap-4">
      <Cell n={t.day} l="Өдөр" num={num} lbl={lbl} />
      <Cell n={t.hr} l="Цаг" num={num} lbl={lbl} />
      <Cell n={t.min} l="Минут" num={num} lbl={lbl} />
      <Cell n={t.sec} l="Секунд" num={num} lbl={lbl} />
    </div>
  )
}

function Cell({ n, l, num, lbl }: { n: number; l: string; num: string; lbl: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`${num} font-light leading-none tabular-nums tracking-tight`} suppressHydrationWarning>
        {String(n).padStart(2, "0")}
      </span>
      <span className={`${lbl} mt-1 text-muted-foreground`}>{l}</span>
    </div>
  )
}

export const Countdown = dynamic(() => Promise.resolve(CountdownComponent), {
  ssr: false,
  loading: () => <div className="flex items-end gap-4">
    <div className="flex flex-col items-center">
      <span className="text-3xl font-light leading-none tabular-nums tracking-tight">--</span>
      <span className="text-xs mt-1 text-muted-foreground">Өдөр</span>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-3xl font-light leading-none tabular-nums tracking-tight">--</span>
      <span className="text-xs mt-1 text-muted-foreground">Цаг</span>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-3xl font-light leading-none tabular-nums tracking-tight">--</span>
      <span className="text-xs mt-1 text-muted-foreground">Минут</span>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-3xl font-light leading-none tabular-nums tracking-tight">--</span>
      <span className="text-xs mt-1 text-muted-foreground">Секунд</span>
    </div>
  </div>
})
