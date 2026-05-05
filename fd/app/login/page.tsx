"use client";

import { FormEvent, useState } from "react";
import { Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithPassword } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await loginWithPassword({ email, password });
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next || (user.role === "admin" ? "/admin" : "/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid flex-1 place-items-center bg-zinc-50 px-6 py-12">
      <Card className="w-full max-w-md rounded-lg border-zinc-200 bg-white shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-lg bg-zinc-950 text-white">
              <Lock className="size-5" />
            </div>
            <h1 className="mt-4 text-2xl font-light tracking-tight">Login</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use Gmail and password to access your account.
            </p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label>Gmail</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@test.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button className="w-full" type="submit" disabled={loading}>
              <LogIn className="size-4" /> {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
