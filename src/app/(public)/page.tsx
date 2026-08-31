import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Radio,
  Lock,
  Award,
  Sparkles,
  Users,
  Globe2,
  Shield,
  CheckCircle2,
  Video,
  FileSpreadsheet,
  Activity,
  BellRing,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/datetime";
import { getActiveSession } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();

  // If maintenance mode is active, display maintenance message
  if (settings.maintenanceMode) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          System Maintenance
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          The {settings.orgName} platform is currently undergoing scheduled maintenance and updates. Please check back shortly.
        </p>
      </div>
    );
  }

  type UpcomingSession = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    startTime: Date;
    speakers: { speaker: { name: string } }[];
  };

  let activeSession = null;
  let upcoming: UpcomingSession[] = [];
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
        take: 4,
        include: {
          speakers: { include: { speaker: true } },
        },
      }),
    ]);
    activeSession = resActive;
    upcoming = resUpcoming;
  } catch (err) {
    console.error("Error loading home page sessions:", err);
  }

  const stats = [
    { icon: Globe2, label: "Live Google Meet", sub: "interactive sessions" },
    { icon: Users, label: "Verified", sub: "participant registry" },
    { icon: Lock, label: "Secure", sub: "server-side checks" },
    { icon: Shield, label: "Protected", sub: "rate-limited APIs" },
  ];

  const steps = [
    {
      icon: FileSpreadsheet,
      step: "01",
      title: "Register via Google Form",
      text: "Sign up once through the official CGS registration form — your details are safely synced to the portal.",
    },
    {
      icon: Video,
      step: "02",
      title: "Join the Live Session",
      text: "Attend the scheduled Google Meet workshop with our cybersecurity speakers at the published time.",
    },
    {
      icon: ClipboardCheck,
      step: "03",
      title: "Mark Verified Attendance",
      text: "Use your registered email to mark attendance. Eligibility is validated server-side, instantly.",
    },
  ];

  const features = [
    {
      icon: Radio,
      title: "Live Sessions",
      text: "Interactive Google Meet events with speaker lineups and live status.",
      accent: "border-primary/25 bg-primary-muted text-primary",
      hover: "hover:border-primary/40",
    },
    {
      icon: BellRing,
      title: "Instant Sync",
      text: "Google Sheet registration sync keeps participant data always current.",
      accent: "border-blue-500/25 bg-blue-500/10 text-blue-400",
      hover: "hover:border-blue-500/40",
    },
    {
      icon: Award,
      title: "Verified Attendance",
      text: "Every attendance record is eligibility-checked on the server before saving.",
      accent: "border-red-500/20 bg-red-500/10 text-red-400",
      hover: "hover:border-red-500/40",
    },
    {
      icon: Activity,
      title: "Live Platform Status",
      text: "Real-time health checks for the portal, sync engine, and maintenance state.",
      accent: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
      hover: "hover:border-emerald-500/40",
    },
  ];

  return (
    <div className="relative overflow-hidden surface-grid">
      {/* Ambient Background Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[32rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.16),transparent_67%)] blur-2xl" />
      <div className="hero-orb pointer-events-none absolute -left-32 top-24 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgb(239_68_68/0.14),transparent_65%)] blur-2xl" />
      <div className="hero-orb-alt pointer-events-none absolute -right-32 top-1/3 -z-10 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.13),transparent_65%)] blur-2xl" />

      {/* ================= HERO SECTION ================= */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pt-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          {/* Hero copy */}
          <div className="min-w-0 text-center lg:text-left">
            <div className="stagger-item mb-3 flex justify-center lg:justify-start">
              <div className="hero-logo relative">
                <div className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.35),transparent_70%)] blur-lg" />
                <img
                  src="/cgs-logo.png"
                  alt={`${settings.orgName} logo`}
                  className="relative h-14 w-14 rounded-full object-contain sm:h-16 sm:w-16"
                />
              </div>
            </div>

            <div className="stagger-item">
              <Badge variant="cgs" className="mb-2 max-w-full px-3 py-1 text-[11px] uppercase tracking-wider">
                <Sparkles className="mr-1 h-3 w-3" />
                Official Attendance & Session Portal
              </Badge>
            </div>

            <h1 className="stagger-item mx-auto w-full max-w-3xl font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.08] tracking-tight text-foreground [text-wrap:balance] lg:mx-0">
              CyberGuardians <span className="cgs-gradient-text">Society</span>
            </h1>

            <p className="stagger-item mt-1.5 font-heading text-sm font-semibold tracking-wide text-primary sm:text-base">
              Learn. Defend. Secure.
            </p>

            <p className="stagger-item mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm lg:mx-0">
              Participate in live Google Meet cybersecurity sessions, verify your registration status, and mark your session attendance securely.
            </p>

            <div className="stagger-item mt-4 flex flex-col justify-center gap-2.5 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" variant="cgs" className="btn-shine w-full sm:w-auto h-10 px-5 text-xs font-semibold">
                <Link href="/attendance">
                  <ClipboardCheck className="h-4 w-4 mr-1.5" />
                  Mark Attendance
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="btn-shine w-full sm:w-auto h-10 px-5 text-xs font-semibold">
                <Link href="/sessions">
                  <CalendarDays className="h-4 w-4 mr-1.5" />
                  Browse Sessions
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="stagger-item mt-5 grid grid-cols-2 gap-2 min-[420px]:grid-cols-4 sm:gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-border/60 bg-card/70 px-2.5 py-2.5 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/20"
                >
                  <stat.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-heading text-[11px] font-bold text-foreground sm:text-xs">{stat.label}</span>
                  <span className="text-[10px] text-muted-foreground">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual panel */}
          <div className="stagger-item min-w-0">
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-[radial-gradient(circle,rgb(37_99_235/0.18),transparent_70%)] blur-xl" />

              {activeSession ? (
                <div className="cgs-glow-card overflow-hidden rounded-2xl border border-primary/25 bg-[linear-gradient(140deg,rgb(239_68_68/0.12),transparent_45%,rgb(37_99_235/0.14)),var(--card)] p-5 shadow-xl shadow-black/25 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      <Radio className="mr-1 inline h-3 w-3" />
                      Live Session
                    </p>
                    <Badge variant="live" className="px-2.5 py-0.5 text-[11px]">
                      ● LIVE NOW
                    </Badge>
                  </div>

                  <h2 className="mt-2.5 break-words font-heading text-lg font-bold leading-snug text-foreground sm:text-xl">
                    {activeSession.title}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {activeSession.description}
                  </p>

                  <div className="mt-3.5 space-y-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {formatDateTime(activeSession.startTime, settings.timezone)}
                    </p>
                    {activeSession.meetLink && (
                      <a
                        href={activeSession.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                      >
                        <Video className="h-3.5 w-3.5 shrink-0" />
                        Join Google Meet <ArrowRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <Button asChild variant="cgs" size="sm" className="btn-shine mt-4 w-full h-9 text-xs font-semibold">
                    <Link href="/attendance">
                      Mark Attendance Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : upcoming.length > 0 ? (
                <div className="rounded-2xl border border-border/80 bg-card/85 p-5 shadow-xl shadow-black/25 backdrop-blur-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      <CalendarDays className="mr-1 inline h-3 w-3" />
                      Next Up
                    </p>
                    <Badge variant="upcoming" className="text-[11px]">Upcoming</Badge>
                  </div>
                  <ul className="mt-3.5 space-y-2.5">
                    {upcoming.slice(0, 3).map((s) => (
                      <li key={s.id} className="flex min-w-0 items-start gap-2.5 rounded-lg border border-border/50 bg-secondary/30 p-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-muted text-primary">
                          <Video className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">{s.title}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {formatDateTime(s.startTime, settings.timezone)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full h-9 text-xs">
                    <Link href="/sessions">
                      View Full Schedule <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <p className="mt-2.5 font-heading text-sm font-bold text-foreground">No sessions scheduled yet</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    New cybersecurity workshops are announced here. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="cgs" className="mb-3 uppercase tracking-wider">
            Simple & Secure
          </Badge>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How the Portal Works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Three quick steps from registration to a verified attendance record — no complicated setup.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {steps.map((step) => (
            <div
              key={step.step}
              className="cgs-glow-card group relative min-w-0 rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-sm"
            >
              <span className="absolute right-5 top-4 font-heading text-4xl font-extrabold text-border/80 transition-colors group-hover:text-primary/30">
                {step.step}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary-muted text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className={`stagger-item flex min-w-0 items-start gap-3 rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${f.hover}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${f.accent}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SESSIONS ================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <Badge variant="cgs" className="mb-3 uppercase tracking-wider">
              Schedule
            </Badge>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Upcoming Sessions
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Register via the Google Form for upcoming cybersecurity workshops.
            </p>
          </div>
          <Link
            href="/sessions"
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View all sessions <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <Card className="mt-8 border-dashed bg-card/40">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No upcoming sessions scheduled right now. Check back soon!
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((s) => (
              <Card key={s.id} className="cgs-glow-card flex min-w-0 flex-col justify-between">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="upcoming">Upcoming</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(s.startTime, settings.timezone)}
                    </span>
                  </div>

                  <h3 className="break-words font-heading text-base font-semibold text-foreground sm:text-lg">
                    {s.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>

                  {s.speakers.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3">
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">Speakers:</span>
                      <span className="min-w-0 truncate text-xs font-medium text-foreground">
                        {s.speakers.map((sp) => sp.speaker.name).join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>

                <div className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                  <Button asChild variant="outline" size="sm" className="w-full justify-between">
                    <Link href={`/session/${s.slug}`}>
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-2 sm:px-6 sm:pb-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[linear-gradient(120deg,rgb(239_68_68/0.16),transparent_45%,rgb(37_99_235/0.16)),var(--card)] p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.25),transparent_70%)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgb(239_68_68/0.18),transparent_70%)] blur-2xl" />

          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary-muted text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Ready to join the next session?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Browse the schedule, register through the official Google Form, and mark your verified attendance during the live meet.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="cgs" className="btn-shine w-full sm:w-auto">
                <Link href="/sessions">
                  Explore Sessions <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                <Link href="/status">
                  <Activity className="h-5 w-5" />
                  Check Platform Status
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}