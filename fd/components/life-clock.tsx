"use client"

import { useEffect, useState } from "react"

export function LifeClock({ isoDate }: { isoDate: string }) {
  const target = new Date(isoDate).getTime()
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const total = target - start
    const update = () => {
      const elapsed = Date.now() - start
      setPct(Math.min(100, Math.max(0, (elapsed / total) * 100)))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [target])

  return (
    <div className="flex items-center gap-6">
      <div>
        <div className="text-5xl font-light tabular-nums leading-none">{pct.toFixed(4)}%</div>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          Өнгөрсөн
        </p>
      </div>
      <div>
        <div className="text-5xl font-light tabular-nums leading-none text-muted-foreground">
          {(100 - pct).toFixed(4)}%
        </div>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Үлдсэн</p>
      </div>
    </div>
  )
}
