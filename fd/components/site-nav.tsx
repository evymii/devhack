"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ScanFace } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUser, isAdminUser, logoutUser, type CurrentUser } from "@/lib/auth"

const links = [
  { href: "/events", label: "Тоглолт" },
  { href: "/tickets", label: "Тасалбар" },
]

export function SiteNav() {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  const showAdmin = isAdminUser(user)

  const logout = async () => {
    await logoutUser()
    setUser(null)
    window.location.href = "/login"
  }

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
          {links.map((link) => (
            <Button asChild key={link.href} variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          {showAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          {user ? (
            <Button type="button" variant="outline" size="sm" className="ml-1" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="ml-1">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
