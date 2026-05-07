"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Camera, Check, ImageUp, Loader2, Lock, Mail, ScanFace, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaceCapture } from "@/components/face-capture";
import {
  completeRegister,
  loginWithFace,
  sendRegisterOtp,
  verifyRegisterOtp,
} from "@/lib/auth";
import { computeDescriptorFromImage, loadModels } from "@/lib/face-matching";

type Mode = "login" | "register";
type RegisterStep = 1 | 2 | 3;

function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor, (value) => Number(value.toFixed(8)));
}

function redirectAfterLogin(role: string) {
  const next = new URLSearchParams(window.location.search).get("next");
  window.location.href = next || (role === "admin" ? "/admin" : "/events");
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSnapshot(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const getDescriptor = async (image: string): Promise<number[]> => {
    setBusy("face-model");
    await loadModels();
    const descriptor = await computeDescriptorFromImage(image);
    if (!descriptor) {
      throw new Error("Царай олдсонгүй. Илүү тод, нүүр бүтэн харагдсан зураг ашиглана уу.");
    }
    return descriptorToArray(descriptor);
  };

  const submitFaceLogin = async () => {
    if (!snapshot) {
      setError("Камераар царайгаа авах эсвэл зураг оруулна уу.");
      return;
    }

    setError(null);
    setBusy("face-login");
    try {
      const descriptor = await getDescriptor(snapshot);
      const user = await loginWithFace(descriptor);
      redirectAfterLogin(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(null);
    }
  };

  const submitOtpSend = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy("otp-send");
    try {
      const result = await sendRegisterOtp(email);
      setDevOtp(result.dev_otp ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP илгээхэд алдаа гарлаа.");
    } finally {
      setBusy(null);
    }
  };

  const submitOtpVerify = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy("otp-verify");
    try {
      const result = await verifyRegisterOtp({ email, otp });
      setVerificationToken(result.verification_token);
      setRegisterStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP баталгаажуулахад алдаа гарлаа.");
    } finally {
      setBusy(null);
    }
  };

  const submitRegisterInfo = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!nationalId.trim()) {
      setError("Регистрийн дугаар оруулна уу.");
      return;
    }
    setRegisterStep(3);
  };

  const complete = async () => {
    if (!snapshot) {
      setError("Царайгаа камераар авах эсвэл зураг оруулна уу.");
      return;
    }

    setError(null);
    setBusy("register-complete");
    try {
      const descriptor = await getDescriptor(snapshot);
      const result = await completeRegister({
        email,
        verificationToken,
        name,
        nationalId,
        biometricData: descriptor,
        biometricSnapshot: snapshot,
      });
      redirectAfterLogin(result.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Бүртгэл дуусгахад алдаа гарлаа.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="grid flex-1 place-items-center bg-zinc-50 px-6 py-12">
      <Card className="w-full max-w-2xl rounded-lg border-zinc-200 bg-white shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-lg bg-zinc-950 text-white">
              {mode === "login" ? <ScanFace className="size-5" /> : <UserPlus className="size-5" />}
            </div>
            <h1 className="mt-4 text-2xl font-light tracking-tight">
              {mode === "login" ? "Face login" : "Бүртгүүлэх"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "Камераар царайгаа уншуулж нэвтэрнэ. Камергүй бол зураг оруулж болно."
                : "Gmail OTP, регистр, царай танилтаар 3 алхамтай бүртгэл хийнэ."}
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-md border p-1">
            <Button type="button" variant={mode === "login" ? "default" : "ghost"} onClick={() => setMode("login")}>
              <Lock className="size-4" /> Login
            </Button>
            <Button type="button" variant={mode === "register" ? "default" : "ghost"} onClick={() => setMode("register")}>
              <UserPlus className="size-4" /> Register
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <div className="space-y-5">
              <FaceCapture onCapture={(value) => setSnapshot(value || null)} capturedSnapshot={snapshot} ctaLabel="Царай уншуулах" />
              <UploadBox onChange={readUpload} />
              <Button className="w-full" size="lg" onClick={submitFaceLogin} disabled={!!busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                Царайгаар нэвтрэх
              </Button>

              <p className="border-t pt-4 text-center text-sm text-muted-foreground">
                Admin нэвтрэх бол <a className="font-medium text-foreground underline" href="/admin/auth">admin auth</a> ашиглана.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <StepHeader step={registerStep} />

              {registerStep === 1 && (
                <div className="space-y-4">
                  <form className="space-y-3" onSubmit={submitOtpSend}>
                    <Field label="Gmail">
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />
                    </Field>
                    <Button type="submit" disabled={!!busy || !email}>
                      <Mail className="size-4" /> OTP илгээх
                    </Button>
                    {/* {devOtp && <p className="text-sm text-muted-foreground">Local OTP: <span className="font-mono">{devOtp}</span></p>} */}
                  </form>

                  <form className="space-y-3" onSubmit={submitOtpVerify}>
                    <Field label="OTP">
                      <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6 оронтой код" maxLength={6} required />
                    </Field>
                    <Button type="submit" disabled={!!busy || !email || otp.length !== 6}>
                      <Check className="size-4" /> Баталгаажуулах
                    </Button>
                  </form>
                </div>
              )}

              {registerStep === 2 && (
                <form className="space-y-4" onSubmit={submitRegisterInfo}>
                  <Field label="Нэр">
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Болд Батаа" />
                  </Field>
                  <Field label="Регистрийн дугаар">
                    <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="AA12345678" required />
                  </Field>
                  <Button type="submit" className="w-full">
                    Дараагийн алхам
                  </Button>
                </form>
              )}

              {registerStep === 3 && (
                <div className="space-y-4">
                  <FaceCapture onCapture={(value) => setSnapshot(value || null)} capturedSnapshot={snapshot} ctaLabel="Царай хадгалах" />
                  <UploadBox onChange={readUpload} />
                  <Button className="w-full" size="lg" onClick={complete} disabled={!!busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <ScanFace className="size-4" />}
                    Бүртгэл дуусгах
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function UploadBox({ onChange }: { onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-secondary/40">
      <ImageUp className="size-4" />
      Камергүй бол зураг оруулах
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
    </label>
  );
}

function StepHeader({ step }: { step: RegisterStep }) {
  const labels = ["Gmail OTP", "Регистр", "Царай"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {labels.map((label, index) => {
        const current = index + 1;
        return (
          <div
            key={label}
            className={`rounded-md border p-2 text-center text-xs ${
              current === step ? "border-zinc-950 bg-zinc-950 text-white" : current < step ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "text-muted-foreground"
            }`}
          >
            {current}. {label}
          </div>
        );
      })}
    </div>
  );
}
