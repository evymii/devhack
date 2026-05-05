import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "default" | "secondary" | "outline" | "success" | "destructive"

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input text-foreground",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    destructive: "bg-destructive/15 text-destructive",
  }
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  )
}
