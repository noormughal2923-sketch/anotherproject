import { notFound } from "next/navigation";
import { Shield, CheckCircle2, CalendarDays, Building2, Award } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { verifyCertificate } from "@/lib/certificates";
import { formatDateTime } from "@/lib/datetime";

export const metadata = { title: "Verify Certificate" };
export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const cert = await verifyCertificate(code);

  if (!cert) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6 lg:px-8 animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Certificate Not Found
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          No valid certificate was found for the code <strong className="text-foreground font-mono">{code}</strong>.
          Please check the code and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8 animate-fade-in">
      <div className="text-center mb-8">
        <Badge variant="cgs" className="mb-3 uppercase tracking-wider text-xs">
          <Shield className="h-3 w-3 mr-1" /> Certificate Verified
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Authenticity Confirmed
        </h1>
      </div>

      <Card className="cgs-glow-card border-primary/20 bg-card shadow-2xl shadow-black/20">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/30 mb-4">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <Badge variant="success" className="mb-2">Valid Certificate</Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Certificate Number</span>
              <span className="font-heading font-bold text-primary font-mono text-xs">{cert.certificateNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Recipient</span>
              <span className="font-semibold text-foreground">{cert.recipientName}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Email</span>
              <span className="text-foreground">{cert.recipientEmail}</span>
            </div>
            {cert.organization && (
              <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Organization
                </span>
                <span className="text-foreground">{cert.organization}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2.5 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Award className="h-3.5 w-3.5" /> Program
              </span>
              <span className="text-foreground">{cert.bootcampTitle}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> Issued Date
              </span>
              <span className="text-foreground">{formatDateTime(cert.issuedAt, "Asia/Karachi")}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-center">
            <p className="text-xs text-emerald-400 font-semibold">
              ✓ This certificate is authentic and was issued by CyberGuardiansSociety (CGS).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
