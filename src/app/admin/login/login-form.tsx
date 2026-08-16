"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null
  );
  const mountTime = useRef(0);
  const elapsedField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mountTime.current = Date.now();
  }, []);

  const handleSubmitClick = () => {
    if (elapsedField.current && mountTime.current > 0) {
      elapsedField.current.value = String(Date.now() - mountTime.current);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10 font-sans">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.2),transparent_65%)] blur-2xl" />
      <div className="absolute inset-0 -z-10 surface-grid opacity-70" />

      <div className="w-full max-w-md rounded-2xl border border-border/90 bg-card/95 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-8 animate-fade-in">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="hero-logo mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <img
              src="/cgs-logo.png"
              alt="CGS logo"
              className="h-16 w-16 rounded-full object-contain"
            />
          </div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Secure workspace</p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Sign in to manage sessions, registration sync, and verified attendance.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          {/* Honeypot field — hidden from humans, tempting for bots */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="company_website">Company website (leave empty)</label>
            <input
              id="company_website"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <input ref={elapsedField} name="_elapsed" type="hidden" defaultValue="0" />

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground">
              Administrator Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="admin@cyberguardianssociety.org"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
              className="text-sm"
            />
          </div>

          {state?.error && (
            <Alert variant="destructive" className="py-2.5 text-xs">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" variant="cgs" size="lg" className="mt-1 w-full" disabled={pending} onClick={handleSubmitClick}>
            {pending && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
            {pending ? "Authenticating..." : <>Continue to console <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
