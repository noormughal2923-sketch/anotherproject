import Link from "next/link";
import { ArrowRight, CalendarDays, Video, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/datetime";
import { getActiveSession } from "@/lib/attendance";

export const metadata = { title: "Sessions" };
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const settings = await getSettings();
  const now = new Date();
  let active = null;
  let upcoming: Array<any> = [];
  let past: Array<any> = [];
  try {
    const [resActive, resUpcoming, resPast] = await Promise.all([
      getActiveSession(),
      prisma.session.findMany({
        where: { isActive: true, startTime: { gt: now } },
        orderBy: { startTime: "asc" },
        include: {
          speakers: { include: { speaker: true }, orderBy: { sortOrder: "asc" } },
          _count: { select: { registrations: true } },
        },
      }),
      prisma.session.findMany({
        where: { isActive: true, endTime: { lt: now } },
        orderBy: { startTime: "desc" },
        take: 20,
        include: {
          speakers: { include: { speaker: true }, orderBy: { sortOrder: "asc" } },
          _count: { select: { registrations: true } },
        },
      }),
    ]);
    active = resActive;
    upcoming = resUpcoming;
    past = resPast;
  } catch (err) {
    console.error("Error loading sessions page data:", err);
  }

  const liveSessions = [
    ...(active ? [{ ...active, isLiveNow: true }] : []),
    ...upcoming.map((s) => ({ ...s, isLiveNow: false })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="cgs" className="mb-3 uppercase tracking-wider text-xs">
          Schedule & Archive
        </Badge>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          CGS Cybersecurity Sessions
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Browse active, upcoming, and past technical sessions. Join live workshops, explore agendas, and mark your attendance.
        </p>
      </div>

      {/* Upcoming & Live Section */}
      {liveSessions.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-xl font-bold text-foreground">
              Active & Upcoming Sessions
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {liveSessions.map((s) => (
              <Card
                key={s.id}
                className={`cgs-glow-card flex flex-col justify-between ${
                  s.isLiveNow ? "border-primary/40 bg-[linear-gradient(135deg,rgb(239_68_68/0.13),transparent_45%,rgb(37_99_235/0.13)),var(--card)]" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {s.isLiveNow ? (
                      <Badge variant="live">● Live Now</Badge>
                    ) : (
                      <Badge variant="upcoming">Upcoming</Badge>
                    )}

                    {!s.registrationOpen && !s.isLiveNow && (
                      <Badge variant="warning">Reg Closed</Badge>
                    )}
                  </div>

                  <h3 className="font-heading text-xl font-semibold text-foreground">
                    {s.title}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {formatDateTime(s.startTime, settings.timezone)} —{" "}
                      {formatDateTime(s.endTime, settings.timezone)}
                    </span>
                  </div>

                  {s.description && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  )}

                  {s.speakers.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-foreground font-medium truncate">
                        {s.speakers.map((sp: any) => sp.speaker.name).join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>

                <div className="px-6 pb-6 pt-0">
                  <Link
                    href={`/session/${s.slug}`}
                    className="inline-flex w-full items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                  >
                    <span>View Full Session Details</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {liveSessions.length === 0 && (
        <div className="mt-12 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Video className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 font-heading font-medium text-foreground">
            No upcoming sessions currently scheduled
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Check back later for announcements on upcoming CGS cybersecurity workshops.
          </p>
        </div>
      )}

      {/* Past Sessions Section */}
      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-xl font-bold text-foreground mb-6">
            Past Sessions Archive
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((s) => (
              <Card key={s.id} className="bg-card/60 hover:bg-card transition-colors">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <Badge variant="completed" className="mb-2">Completed</Badge>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(s.startTime, settings.timezone)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <Link
                      href={`/session/${s.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      Archive Details <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
