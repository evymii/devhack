import Link from "next/link"
import { ScanFace } from "lucide-react"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/events", label: "Тоглолт" },
  { href: "/tickets", label: "Тасалбар" },
  { href: "/scanner", label: "Скан" },
]

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <ScanFace className="size-4" />
          </span>
          <span>FacePass</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Button asChild key={l.href} variant="ghost" size="sm">
              <Link href={l.href}>{l.label}</Link>
            </Button>
          ))}
          <Button asChild variant="outline" size="sm" className="ml-1">
            <Link href="#download">App татах</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
