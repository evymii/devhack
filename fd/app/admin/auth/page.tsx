"use client";

import { FormEvent, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithPassword } from "@/lib/auth";

export default function AdminAuthPage() {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await loginWithPassword({ email, password });
      if (user.role !== "admin") {
        setError("Энэ хэрэглэгч admin эрхгүй байна.");
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next || "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid flex-1 place-items-center bg-zinc-950 px-6 py-12 text-zinc-100">
      <Card className="w-full max-w-md rounded-lg border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl">
        <CardContent className="space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-lg bg-emerald-500 text-zinc-950">
              <ShieldCheck className="size-5" />
            </div>
            <h1 className="mt-4 text-2xl font-light tracking-tight">Admin Auth</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Event, ticket, scan dashboard руу нэвтрэх admin account.
            </p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label>Admin Gmail</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="border-zinc-700 bg-zinc-950 text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="border-zinc-700 bg-zinc-950 text-zinc-100"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400" type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Admin нэвтрэх
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
