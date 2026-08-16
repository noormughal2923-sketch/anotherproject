import { AdminSidebar } from "@/components/admin-sidebar";
import { getAdmin } from "@/lib/auth";
import { signOutAction } from "./actions";
import { LoginForm } from "../login/login-form";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();
  if (!admin) {
    return <LoginForm />;
  }
  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <AdminSidebar
        adminName={admin.name ?? admin.email}
        adminRole={admin.role}
        onSignOut={signOutAction}
      />
      <main className="min-w-0 flex-1 surface-grid md:pb-4 md:pr-4">{children}</main>
    </div>
  );
}
