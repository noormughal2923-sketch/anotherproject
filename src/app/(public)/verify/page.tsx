"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Search, ArrowRight, Award, FileCheck2, Download, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifySearchPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim();
    if (clean) {
      router.push(`/verify/${encodeURIComponent(clean)}`);
    }
  };

  const setSampleCode = (sample: string) => {
    setCode(sample);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="text-center">
        <Badge variant="cgs" className="mb-3 uppercase tracking-wider text-xs">
          <Award className="h-3 w-3 mr-1" /> Official Credential Registry
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Verify Certificate
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
          Enter the unique certificate number located on your issued certificate to verify recipient authenticity, bootcamp attendance, and download your official PDF.
        </p>
      </div>

      {/* Main Search Card */}
      <Card className="cgs-glow-card mt-8 border-border/80 bg-card shadow-xl shadow-black/20 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <CardTitle className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Certificate Number Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-semibold text-foreground">
                Certificate Number / ID
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="code"
                  type="text"
                  placeholder="e.g. CGS-CAAB-300826-A07C6E1D"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pl-9 font-mono uppercase text-sm h-11 border-border focus-visible:ring-primary"
                  required
                  autoFocus
                />
              </div>

              <div className="text-[11px] text-muted-foreground space-y-1">
                <p>
                  Found at the footer of your certificate.
                </p>
              </div>
            </div>

            <Button type="submit" variant="cgs" className="w-full h-11 font-bold text-sm gap-2">
              Verify Certificate & Download <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Examples */}
          <div className="mt-6 pt-5 border-t border-border/50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Sample Formats:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSampleCode("CGSS2026-18082601-9614F9A3")}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors border border-border/60"
              >
                Session 1: CGSS2026-18082601-9614F9A3
              </button>
              <button
                type="button"
                onClick={() => setSampleCode("CGSS-200826-D7235A79")}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors border border-border/60"
              >
                Session 2: CGSS-200826-D7235A79
              </button>
              <button
                type="button"
                onClick={() => setSampleCode("CGS-CAAB-300826-A07C6E1D")}
                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary transition-colors border border-border/60"
              >
                CAAB: CGS-CAAB-300826-A07C6E1D
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Highlights Grid */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center text-center p-4 rounded-xl border border-border/60 bg-card/40">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2.5">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <h4 className="font-heading text-xs font-bold text-foreground">Instant Verification</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            Real-time validation against verified attendee records.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-4 rounded-xl border border-border/60 bg-card/40">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
            <Download className="h-4 w-4" />
          </div>
          <h4 className="font-heading text-xs font-bold text-foreground">Official PDF Download</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            Instant digital access to original high-res certificates.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-4 rounded-xl border border-border/60 bg-card/40">
          <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2.5">
            <Lock className="h-4 w-4" />
          </div>
          <h4 className="font-heading text-xs font-bold text-foreground">Tamper-Proof Record</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            Secured and authenticated by CyberGuardiansSociety.
          </p>
        </div>
      </div>
    </div>
  );
}
