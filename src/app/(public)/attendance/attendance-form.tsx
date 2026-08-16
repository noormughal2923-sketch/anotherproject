"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { AttendanceResult } from "@/lib/attendance";
import { formatDateTime } from "@/lib/datetime";
import { markAttendanceAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "portal-offline":
    "The attendance portal is currently offline. Please try again later.",
  "attendance-closed": "Attendance is currently closed. Please try again later.",
  "no-active-session":
    "There is no active session right now. Please try again when a session is live.",
  "not-registered":
    "This email address is not registered for the active session. Ensure you enter the exact email used during Google Form registration.",
  "already-marked":
    "Your attendance has already been verified and recorded for this session.",
  "rate-limited":
    "Too many submission attempts. Please wait a few minutes and try again.",
  "invalid-input": "Please enter a valid email address.",
};

export function AttendanceForm({
  sessionTitle,
  timezone,
}: {
  sessionTitle: string;
  timezone: string;
}) {
  const [state, formAction, pending] = useActionState<
    AttendanceResult | null,
    FormData
  >(markAttendanceAction, null);

  if (state?.status === "success") {
    return (
      <div className="flex flex-col items-center py-8 text-center animate-fade-in font-sans">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-950/30 mb-4">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <Badge variant="present" className="mb-2">
          Verified Present
        </Badge>

        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Attendance Confirmed!
        </h2>

        <div className="mt-4 w-full max-w-sm rounded-xl border border-border/80 bg-secondary/30 p-4 text-xs text-muted-foreground space-y-2 text-left">
          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-foreground">Participant:</span>
            <span className="font-semibold text-foreground">{state.name}</span>
          </div>
          <div className="flex justify-between border-b border-border/40 pb-2">
            <span className="font-medium text-foreground">Session:</span>
            <span className="max-w-[180px] truncate font-medium text-primary">{state.sessionTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-foreground">Timestamp:</span>
            <span className="text-muted-foreground">{formatDateTime(state.markedAt, timezone)}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button asChild variant="outline" size="sm" className="font-sans">
            <a href="/sessions">
              Browse Sessions <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 font-sans">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold text-foreground">
          Registration Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="e.g. participant@example.com"
          required
          inputMode="email"
          className="h-10 text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          Enter the exact email used on the CGS Google Registration Form.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-semibold text-foreground">
          Full Name <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          maxLength={100}
          className="h-10 text-sm"
        />
      </div>

      {state?.status === "error" && (
        <Alert variant="destructive" className="py-2.5">
          <AlertDescription className="text-xs">
            {ERROR_MESSAGES[state.code]}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" variant="cgs" size="lg" className="w-full font-sans font-semibold mt-2" disabled={pending}>
        {pending && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
        {pending ? "Verifying & Marking..." : "Submit Attendance"}
      </Button>

      <div className="pt-2 text-center">
        <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Active Session: <strong className="text-foreground">{sessionTitle}</strong>
        </span>
      </div>
    </form>
  );
}
