import { CalendarDays, ShieldAlert, Radio } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSettings } from "@/lib/settings";
import { getActiveSession } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/datetime";
import { AttendanceForm } from "./attendance-form";

export const metadata = { title: "Mark Attendance" };
export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const settings = await getSettings();
  let activeSession = null;
  let upcoming: Array<any> = [];
  try {
    const [resActive, resUpcoming] = await Promise.all([
      getActiveSession(),
      prisma.session.findMany({
        where: {
          isActive: true,
          startTime: { gt: new Date() },
          registrationOpen: true,
        },
        orderBy: { startTime: "asc" },
        take: 3,
      }),
    ]);
    activeSession = resActive;
    upcoming = resUpcoming;
  } catch (err) {
    console.error("Error loading attendance page sessions:", err);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8 animate-fade-in">
      <div className="text-center">
        <Badge variant="cgs" className="mb-3 uppercase tracking-wider text-xs">
          Verification Terminal
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Mark Session Attendance
        </h1>
        <p className="mt-2 text-sm text-muted-foreground font-sans">
          Enter the registered email address you used on the CGS Google Form.
        </p>
      </div>

      <div className="mt-10">
        {!settings.portalOpen ? (
          <Alert variant="warning" className="border-red-500/30 bg-red-500/10">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <AlertTitle className="font-heading font-bold text-red-300">Portal Temporarily Offline</AlertTitle>
            <AlertDescription className="text-xs text-red-200/90 font-sans mt-1">
              The CGS attendance portal is currently offline. Please check back when a session is active.
            </AlertDescription>
          </Alert>
        ) : !activeSession ? (
          <div className="space-y-6">
            <Card className="border-border bg-card/75">
              <CardContent className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
                  <Radio className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground">
                  No Session Active Right Now
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground font-sans leading-relaxed">
                  Attendance verification opens automatically while a live CGS Google Meet session is running.
                </p>
              </CardContent>
            </Card>

            {upcoming.length > 0 && (
              <div className="rounded-2xl border border-border/80 bg-card/40 p-5">
                <h3 className="font-heading font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Upcoming Session Schedule
                </h3>
                <ul className="space-y-2.5 font-sans">
                  {upcoming.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 text-xs text-foreground p-2.5 rounded-lg bg-secondary/40"
                    >
                      <span className="font-medium truncate">{s.title}</span>
                      <span className="shrink-0 text-muted-foreground font-mono text-[11px]">
                        {formatDateTime(s.startTime, settings.timezone)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <Card className="cgs-glow-card border-primary/20 bg-card shadow-2xl shadow-black/20">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge variant="live">● LIVE NOW</Badge>
                <span className="text-xs text-muted-foreground font-sans">
                  {formatDateTime(activeSession.startTime, settings.timezone)}
                </span>
              </div>
              <CardTitle className="font-heading text-xl font-bold text-foreground">
                {activeSession.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <AttendanceForm
                sessionTitle={activeSession.title}
                timezone={settings.timezone}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
