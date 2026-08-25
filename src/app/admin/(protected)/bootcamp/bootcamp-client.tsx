"use client";

import { useState, useTransition } from "react";
import {
  Shield,
  Play,
  Square,
  Radio,
  Users,
  ClipboardCheck,
  Award,
  ChevronRight,
  Loader2,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ADMIN_BASE_PATH } from "@/lib/constants";
import {
  startBootcampSessionAction,
  endBootcampSessionAction,
} from "./actions";

type SessionData = {
  id: string;
  title: string;
  sessionNumber: number;
  status: string;
  attendanceOpen: boolean;
  registrationOpen: boolean;
  startTime: Date;
  endTime: Date;
  meetLink: string | null;
  registrations: number;
  attendance: number;
};

type BootcampStats = {
  totalRegistered: number;
  s1Attendance: number;
  s2Attendance: number;
  s3Attendance: number;
  completedAll3: number;
  certificateEligible: number;
  certificatesIssued: number;
};

const SESSION_COLORS = [
  { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-blue-500/10" },
  { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", glow: "shadow-amber-500/10" },
  { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-emerald-500/10" },
];

export function BootcampClient({
  sessions,
  stats,
}: {
  sessions: SessionData[];
  stats: BootcampStats;
}) {
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const handleStartSession = (sessionNumber: number) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await startBootcampSessionAction(sessionNumber, 120);
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: result.message ?? "Session started." });
      }
    });
  };

  const handleEndSession = (sessionNumber: number) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await endBootcampSessionAction(sessionNumber);
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: result.message ?? "Session ended." });
      }
    });
  };

  return (
    <div className="app-page space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-7">
        <div>
          <Badge variant="cgs" className="mb-2">
            <Shield className="h-3 w-3 mr-1" /> Bootcamp Control Center
          </Badge>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            CGS Cybersecurity Bootcamp
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage all 3 bootcamp sessions, track attendance, and control certificate eligibility from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="cgs">
            <Link href={`${ADMIN_BASE_PATH}/certificates`}>
              <Award className="h-4 w-4" /> Certificate Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <Alert
          variant={feedback.type === "error" ? "destructive" : "default"}
          className={
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : ""
          }
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription className="text-xs font-medium">
            {feedback.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Bootcamp Progress Stats */}
      <div className="rounded-2xl border border-border/80 bg-card/75 p-6">
        <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Bootcamp Progress Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "Registered", value: stats.totalRegistered, icon: Users },
            { label: "S1 Attendance", value: stats.s1Attendance, icon: ClipboardCheck },
            { label: "S2 Attendance", value: stats.s2Attendance, icon: ClipboardCheck },
            { label: "S3 Attendance", value: stats.s3Attendance, icon: ClipboardCheck },
            { label: "All 3 Sessions", value: stats.completedAll3, icon: CheckCircle2 },
            { label: "Cert Eligible", value: stats.certificateEligible, icon: Award },
            { label: "Certs Issued", value: stats.certificatesIssued, icon: Award },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-border/60 bg-secondary/30 p-3 text-center"
              >
                <Icon className="mx-auto h-4 w-4 text-primary mb-1" />
                <p className="font-heading text-xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Control Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {sessions.map((session, idx) => {
          const colors = SESSION_COLORS[idx] ?? SESSION_COLORS[0];
          const isLive = session.status === "LIVE" && session.attendanceOpen;

          return (
            <Card
              key={session.id}
              className={`relative overflow-hidden border-border/80 bg-card/75 transition-all duration-300 hover:shadow-lg ${
                isLive ? `${colors.border} ${colors.glow} shadow-lg` : ""
              }`}
            >
              {isLive && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${colors.bg.replace("/10", "/60")}`} />
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={isLive ? "live" : session.status === "COMPLETED" ? "completed" : "upcoming"}
                    className="text-[10px]"
                  >
                    {isLive ? "● LIVE" : session.status}
                  </Badge>
                  <span className={`text-xs font-bold ${colors.text}`}>
                    SESSION {session.sessionNumber}
                  </span>
                </div>
                <CardTitle className="font-heading text-base font-bold text-foreground mt-2 leading-tight">
                  {session.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-secondary/40 p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Registered</p>
                    <p className="font-heading text-lg font-bold text-foreground">
                      {session.registrations}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Attendance</p>
                    <p className="font-heading text-lg font-bold text-foreground">
                      {session.attendance}
                    </p>
                  </div>
                </div>

                {/* Attendance status */}
                <div className="flex items-center gap-2 text-xs">
                  <Radio className={`h-3.5 w-3.5 ${isLive ? "text-emerald-400 animate-pulse" : "text-muted-foreground"}`} />
                  <span className={isLive ? "text-emerald-400 font-semibold" : "text-muted-foreground"}>
                    Attendance {isLive ? "Open" : "Closed"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  {!isLive ? (
                    <Button
                      size="sm"
                      variant="cgs"
                      className="flex-1 text-xs"
                      disabled={pending}
                      onClick={() => handleStartSession(session.sessionNumber)}
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      Start Session
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 text-xs"
                      disabled={pending}
                      onClick={() => handleEndSession(session.sessionNumber)}
                    >
                      {pending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                      End Session
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`${ADMIN_BASE_PATH}/certificates`}
          className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/75 p-4 text-sm transition-all hover:bg-card hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary-muted text-primary">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-foreground text-sm">Certificate Eligibility</p>
              <p className="text-[11px] text-muted-foreground">{stats.certificateEligible} eligible participants</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href={`${ADMIN_BASE_PATH}/attendance`}
          className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/75 p-4 text-sm transition-all hover:bg-card hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-foreground text-sm">Attendance Records</p>
              <p className="text-[11px] text-muted-foreground">View all session attendance</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href={`${ADMIN_BASE_PATH}/google-sync`}
          className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/75 p-4 text-sm transition-all hover:bg-card hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-foreground text-sm">Google Form Sync</p>
              <p className="text-[11px] text-muted-foreground">Import registrations</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
