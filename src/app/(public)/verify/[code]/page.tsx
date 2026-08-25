import Link from "next/link";
import { Shield, AlertCircle, ArrowLeft, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifyCertificate } from "@/lib/certificates";
import { formatDateTime } from "@/lib/datetime";
import { VerifyResultClient } from "./verify-result-client";

export const metadata = {
  title: "Verify Certificate | CyberGuardiansSociety",
  description: "Verify recipient authenticity and official certificate credentials.",
};

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code).trim();

  const cert = await verifyCertificate(decodedCode);

  if (!cert) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8 animate-fade-in font-sans">
        <div className="text-center mb-6">
          <Badge variant="destructive" className="mb-3 uppercase tracking-wider text-xs">
            <Shield className="h-3 w-3 mr-1" /> Credential Check
          </Badge>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Certificate Not Found
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            No valid certificate record was found matching the code:
          </p>
          <p className="mt-2 inline-block px-3 py-1 bg-muted/60 rounded-md font-mono text-sm text-foreground border border-border">
            {decodedCode}
          </p>
        </div>

        <Card className="cgs-glow-card border-border/80 bg-card shadow-xl shadow-black/20">
          <CardContent className="p-6 space-y-4 text-xs text-muted-foreground">
            <div className="space-y-2">
              <p className="font-semibold text-foreground text-sm">Please verify the following:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ensure you entered the exact certificate ID printed on your certificate document.</li>
                <li>Check for typos or omitted hyphens (e.g. <span className="font-mono text-foreground">CGSS2026-18082601-...</span> or <span className="font-mono text-foreground">CGSS-200826-...</span>).</li>
                <li>Certificates are issued only to participants who attended the respective bootcamp sessions.</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
              <Link href="/verify" className="w-full">
                <Button variant="cgs" className="w-full text-xs font-semibold gap-1.5">
                  <Search className="h-3.5 w-3.5" /> Try Another Certificate Number
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full text-xs gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = formatDateTime(cert.issuedAt, "Asia/Karachi");

  return (
    <VerifyResultClient
      certificate={{
        certificateNumber: cert.certificateNumber,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        bootcampTitle: cert.bootcampTitle,
        sessionName: cert.sessionName,
        sessionNumber: cert.sessionNumber,
        issuedAt: cert.issuedAt,
        organization: cert.organization,
        status: cert.status,
        hasPdf: cert.hasPdf,
        downloadUrl: cert.downloadUrl,
        previewUrl: cert.previewUrl,
        formattedDate,
      }}
    />
  );
}
