import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { getSettings } from "@/lib/settings";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicNav orgName={settings.orgName} />
      <main className="flex-1">{children}</main>
      <PublicFooter orgName={settings.orgName} />
    </div>
  );
}