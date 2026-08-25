"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Search, ArrowRight, Award } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8 animate-fade-in font-sans">
      <div className="text-center">
        <Badge variant="cgs" className="mb-3 uppercase tracking-wider text-xs">
          <Award className="h-3 w-3 mr-1" /> Credential Registry
        </Badge>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Verify Certificate
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter a CGS Certificate Number to verify recipient authenticity and bootcamp completion status.
        </p>
      </div>

      <Card className="cgs-glow-card mt-8 border-border/80 bg-card shadow-xl shadow-black/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-base font-bold text-foreground">
            Certificate Number Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold text-foreground">
                Certificate Code
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="code"
                  type="text"
                  placeholder="e.g. CGS-BC-2026-ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pl-9 font-mono uppercase text-sm"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Format: CGS-BC-2026-XXXXXX (found on the official certificate)
              </p>
            </div>

            <Button type="submit" variant="cgs" className="w-full font-semibold">
              Verify Authenticity <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
