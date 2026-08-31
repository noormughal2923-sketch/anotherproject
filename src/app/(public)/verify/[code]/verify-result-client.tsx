"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  CalendarDays,
  Building2,
  Award,
  Download,
  Copy,
  Check,
  ExternalLink,
  Search,
  FileText,
  Eye,
  Share2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VerifyResultClientProps {
  certificate: {
    certificateNumber: string;
    recipientName: string;
    recipientEmail: string;
    bootcampTitle: string;
    sessionName?: string;
    sessionNumber?: number | null;
    issuedAt: string | Date;
    organization?: string | null;
    status: string;
    hasPdf: boolean;
    downloadUrl: string;
    previewUrl: string;
    formattedDate: string;
  };
}

export function VerifyResultClient({ certificate }: VerifyResultClientProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewTab, setPreviewTab] = useState<"card" | "pdf">("card");

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(certificate.certificateNumber);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Trigger download via anchor element
      const link = document.createElement("a");
      link.href = certificate.downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setTimeout(() => setIsDownloading(false), 1200);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 animate-fade-in font-sans">
      {/* Header Badge & Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Shield className="h-3.5 w-3.5" /> Certificate Verified
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Authenticity Confirmed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          This credential has been verified as authentic and officially issued by{" "}
          <strong className="text-foreground">CyberGuardiansSociety (CGS)</strong>.
        </p>
      </div>

      {/* Main Verification Card */}
      <Card className="cgs-glow-card border-emerald-500/30 bg-card shadow-2xl shadow-black/25 overflow-hidden">
        {/* Top Status Header */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-card to-emerald-950/40 border-b border-border/60 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base text-foreground">Official Certificate</span>
                <Badge variant="success" className="text-[10px] px-2 py-0.5">
                  Valid & Authentic
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">ID: {certificate.certificateNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="text-xs h-8 gap-1.5 border-border hover:border-primary"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied ID
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy ID
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs h-8 gap-1.5 border-border hover:border-primary"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied Link
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" /> Share
                </>
              )}
            </Button>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Primary Action Section: Download & Preview Switcher */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-primary/5 to-cyan-500/10 border border-emerald-500/25 p-5 sm:p-6 shadow-inner">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" /> Official Certificate Document
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Ready for Download & Verification
                </h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Download the high-resolution digital certificate issued for{" "}
                  <span className="text-foreground font-semibold">{certificate.recipientName}</span>.
                </p>
              </div>

              {/* DOWNLOAD BUTTON */}
              {certificate.hasPdf ? (
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full sm:w-auto min-w-[200px] h-12 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 gap-2 transition-all duration-200 active:scale-95"
                >
                  <Download className={`h-4 w-4 ${isDownloading ? "animate-bounce" : ""}`} />
                  {isDownloading ? "Downloading..." : "Download Certificate"}
                </Button>
              ) : (
                <div className="text-xs text-muted-foreground text-center sm:text-right">
                  <p className="font-semibold text-foreground">Certificate Verified ✓</p>
                  <p>PDF download not available for this certificate type.</p>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            {certificate.hasPdf && (
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-background/60 p-1 rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("card")}
                    className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                      previewTab === "card"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> Details View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("pdf")}
                    className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                      previewTab === "pdf"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" /> Certificate Preview
                  </button>
                </div>

                <a
                  href={certificate.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                >
                  Open in New Tab <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Conditional View: PDF Preview or Details Table */}
          {previewTab === "pdf" && certificate.hasPdf ? (
            <div className="space-y-3">
              <div className="relative w-full rounded-xl overflow-hidden border border-border/80 bg-neutral-950 aspect-[1.414/1] min-h-[420px] shadow-2xl">
                <iframe
                  src={`${certificate.previewUrl}#toolbar=0`}
                  title={`Certificate for ${certificate.recipientName}`}
                  className="w-full h-full border-0 rounded-xl"
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] text-muted-foreground">
                  If the preview does not load on your mobile browser, click{" "}
                  <a
                    href={certificate.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline font-medium"
                  >
                    Open in New Tab
                  </a>{" "}
                  or use the{" "}
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="text-emerald-400 underline font-medium"
                  >
                    Download Certificate
                  </button>{" "}
                  button.
                </p>
              </div>
            </div>
          ) : (
            /* Details Table */
            <div className="rounded-xl border border-border/60 bg-card/60 divide-y divide-border/40 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:px-4 gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recipient Name
                </span>
                <span className="font-heading text-base font-extrabold text-foreground">
                  {certificate.recipientName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:px-4 gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Certificate Number
                </span>
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 self-start sm:self-auto">
                  {certificate.certificateNumber}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:px-4 gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recipient Email
                </span>
                <span className="text-foreground font-mono text-xs">
                  {certificate.recipientEmail}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:px-4 gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-primary" /> Bootcamp Track
                </span>
                <span className="font-semibold text-foreground text-right sm:text-left">
                  {certificate.bootcampTitle}
                </span>
              </div>

              {certificate.organization && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:px-4 gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Issued By
                  </span>
                  <span className="text-foreground">{certificate.organization}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:px-4 gap-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" /> Issued Date
                </span>
                <span className="text-foreground">{certificate.formattedDate}</span>
              </div>
            </div>
          )}

          {/* Authentic Verification Notice */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-center">
            <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
              <Check className="h-4 w-4 shrink-0" />
              Official verification record: This certificate was securely issued by CyberGuardiansSociety.
            </p>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link href="/verify" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full text-xs font-semibold gap-1.5">
                <Search className="h-3.5 w-3.5" /> Verify Another Certificate
              </Button>
            </Link>

            {certificate.hasPdf && (
              <Button
                onClick={handleDownload}
                variant="cgs"
                className="w-full sm:w-auto text-xs font-semibold gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
