"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Award,
  Users,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Loader2,
  Shield,
  Filter,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  issueSingleCertificateAction,
  issueAllCertificatesAction,
} from "../bootcamp/actions";

type BootcampParticipant = {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  organization: string | null;
  countryCity: string | null;
  experienceLevel: string | null;
  isRegistered: boolean;
  s1Attended: boolean;
  s2Attended: boolean;
  s3Attended: boolean;
  sessionsAttended: number;
  isEligible: boolean;
  certificateIssued: boolean;
  certificateNumber: string | null;
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

type FilterMode =
  | "all"
  | "eligible"
  | "not_eligible"
  | "registered_incomplete"
  | "s1"
  | "s2"
  | "s3"
  | "issued";

export function CertificatesClient({
  stats,
  participants,
}: {
  stats: BootcampStats;
  participants: BootcampParticipant[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = participants;

    // Apply filter
    switch (filter) {
      case "eligible":
        list = list.filter((p) => p.isEligible);
        break;
      case "not_eligible":
        list = list.filter((p) => !p.isEligible);
        break;
      case "registered_incomplete":
        list = list.filter((p) => p.isRegistered && !p.isEligible);
        break;
      case "s1":
        list = list.filter((p) => p.s1Attended);
        break;
      case "s2":
        list = list.filter((p) => p.s2Attended);
        break;
      case "s3":
        list = list.filter((p) => p.s3Attended);
        break;
      case "issued":
        list = list.filter((p) => p.certificateIssued);
        break;
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.email.toLowerCase().includes(q) ||
          (p.name ?? "").toLowerCase().includes(q) ||
          (p.organization ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [participants, filter, search]);

  const handleIssueAll = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await issueAllCertificatesAction();
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({
          type: "success",
          message: result.message ?? "Certificates issued.",
        });
      }
    });
  };

  const handleIssueSingle = (userId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await issueSingleCertificateAction(userId);
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({
          type: "success",
          message: result.message ?? "Certificate issued.",
        });
      }
    });
  };

  const handleExportCSV = () => {
    const eligible = participants.filter((p) => p.isEligible);
    const headers = [
      "Name",
      "Email",
      "Organization",
      "WhatsApp",
      "S1",
      "S2",
      "S3",
      "Eligible",
      "Certificate Number",
    ];
    const rows = eligible.map((p) => [
      p.name ?? "",
      p.email,
      p.organization ?? "",
      p.whatsapp ?? "",
      p.s1Attended ? "YES" : "NO",
      p.s2Attended ? "YES" : "NO",
      p.s3Attended ? "YES" : "NO",
      p.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE",
      p.certificateNumber ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cgs-bootcamp-certificate-eligible.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filters: { key: FilterMode; label: string; count: number }[] = [
    { key: "all", label: "All", count: participants.length },
    { key: "eligible", label: "Eligible", count: stats.certificateEligible },
    {
      key: "not_eligible",
      label: "Not Eligible",
      count: participants.length - stats.certificateEligible,
    },
    {
      key: "registered_incomplete",
      label: "Incomplete",
      count: participants.filter((p) => p.isRegistered && !p.isEligible).length,
    },
    { key: "s1", label: "S1 Attendees", count: stats.s1Attendance },
    { key: "s2", label: "S2 Attendees", count: stats.s2Attendance },
    { key: "s3", label: "S3 Attendees", count: stats.s3Attendance },
    { key: "issued", label: "Issued", count: stats.certificatesIssued },
  ];

  return (
    <div className="app-page space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <Badge variant="cgs" className="mb-2">
            <Award className="h-3 w-3 mr-1" /> Certificate Management
          </Badge>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Certificate Eligibility Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            CGS Cybersecurity Bootcamp — Only participants who registered AND attended ALL 3 sessions are eligible.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            size="sm"
            variant="cgs"
            onClick={handleIssueAll}
            disabled={pending || stats.certificateEligible === 0}
            className="text-xs"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Award className="h-3.5 w-3.5" />
            )}
            Issue All Eligible
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: "Registered", value: stats.totalRegistered, icon: Users, color: "text-blue-400" },
          { label: "S1 Attended", value: stats.s1Attendance, icon: ClipboardCheck, color: "text-blue-400" },
          { label: "S2 Attended", value: stats.s2Attendance, icon: ClipboardCheck, color: "text-amber-400" },
          { label: "S3 Attended", value: stats.s3Attendance, icon: ClipboardCheck, color: "text-emerald-400" },
          { label: "All 3 Done", value: stats.completedAll3, icon: CheckCircle2, color: "text-primary" },
          { label: "Eligible", value: stats.certificateEligible, icon: Award, color: "text-primary" },
          { label: "Issued", value: stats.certificatesIssued, icon: Shield, color: "text-emerald-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/80 bg-card/75">
              <CardContent className="p-3 text-center">
                <Icon className={`mx-auto h-4 w-4 ${s.color} mb-1`} />
                <p className="font-heading text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground self-center mr-1" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, org..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Participant Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-xs">
          <thead className="border-b border-border/80 bg-secondary/30 text-left text-muted-foreground font-semibold">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3 hidden lg:table-cell">Organization</th>
              <th className="px-3 py-3 text-center">Reg</th>
              <th className="px-3 py-3 text-center">S1</th>
              <th className="px-3 py-3 text-center">S2</th>
              <th className="px-3 py-3 text-center">S3</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No participants match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-secondary/20 transition-colors ${
                    p.isEligible
                      ? "bg-emerald-500/[0.03]"
                      : ""
                  }`}
                >
                  <td className="px-3 py-2.5 font-medium text-foreground max-w-[140px] truncate">
                    {p.name ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground max-w-[180px] truncate">
                    {p.email}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground hidden lg:table-cell max-w-[120px] truncate">
                    {p.organization ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.isRegistered ? (
                      <CheckCircle2 className="inline h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="inline h-4 w-4 text-red-400" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.s1Attended ? (
                      <CheckCircle2 className="inline h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="inline h-4 w-4 text-red-400/50" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.s2Attended ? (
                      <CheckCircle2 className="inline h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="inline h-4 w-4 text-red-400/50" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.s3Attended ? (
                      <CheckCircle2 className="inline h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="inline h-4 w-4 text-red-400/50" />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.certificateIssued ? (
                      <Badge variant="success" className="text-[9px]">
                        ISSUED
                      </Badge>
                    ) : p.isEligible ? (
                      <Badge variant="cgs" className="text-[9px]">
                        ELIGIBLE
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[9px]">
                        NOT ELIGIBLE
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {p.certificateIssued ? (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {p.certificateNumber}
                      </span>
                    ) : p.isEligible ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] px-2"
                        disabled={pending}
                        onClick={() => handleIssueSingle(p.id)}
                      >
                        {pending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Issue"
                        )}
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Showing {filtered.length} of {participants.length} participants
      </p>
    </div>
  );
}
