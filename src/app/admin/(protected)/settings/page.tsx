import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="app-page max-w-4xl space-y-6 font-sans">
      <div>
        <Badge variant="cgs" className="mb-1">Governance & Controls</Badge>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Global Portal Settings
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure organization identity, default display timezone, portal online/offline availability, and global registration kill-switches.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <SettingsForm
            orgName={settings.orgName}
            timezone={settings.timezone}
            portalOpen={settings.portalOpen}
            registrationOpen={settings.registrationOpen}
            attendanceOpen={settings.attendanceOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
}
