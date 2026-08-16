import { CheckCircle2, ShieldAlert, Radio, Server } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSettings } from "@/lib/settings";
import { sheetsConfigured } from "@/lib/google-sheets";

export const metadata = { title: "Platform Status" };
export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const settings = await getSettings();
  const sheetsOk = sheetsConfigured();

  const services = [
    {
      name: "Attendance Portal System",
      status: settings.portalOpen ? "operational" : "offline",
      description: "Public attendance recording & validation API",
    },
    {
      name: "Registration & Sync Engine",
      status: settings.registrationOpen && sheetsOk ? "operational" : "degraded",
      description: "Google Sheets sync & participant eligibility lookup",
    },
    {
      name: "System Maintenance Engine",
      status: settings.maintenanceMode ? "maintenance" : "operational",
      description: "Platform core availability",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 animate-fade-in">
      <div className="text-center">
        <Badge variant="cgs" className="mb-3">System Health</Badge>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          CGS Platform Status
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Real-time operational status of CyberGuardiansSociety services.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {services.map((svc) => (
          <Card key={svc.name} className="cgs-glow-card border-border/80 bg-card/75">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    {svc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{svc.description}</p>
                </div>
              </div>

              <div>
                {svc.status === "operational" && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Operational
                  </Badge>
                )}
                {svc.status === "degraded" && (
                  <Badge variant="warning" className="gap-1">
                    <ShieldAlert className="h-3 w-3" /> Limited Config
                  </Badge>
                )}
                {svc.status === "offline" && (
                  <Badge variant="destructive" className="gap-1">
                    <ShieldAlert className="h-3 w-3" /> Offline
                  </Badge>
                )}
                {svc.status === "maintenance" && (
                  <Badge variant="warning" className="gap-1">
                    <Radio className="h-3 w-3" /> Maintenance
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
