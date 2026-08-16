"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Mic,
  Settings,
  Users,
  RefreshCcw,
  FileText,
  UserCheck,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ADMIN_BASE_PATH } from "@/lib/constants";

const navSections = [
  {
    title: "Workspace",
    links: [{ href: ADMIN_BASE_PATH, label: "Overview", icon: LayoutDashboard }],
  },
  {
    title: "Attendance operations",
    links: [
      { href: `${ADMIN_BASE_PATH}/sessions`, label: "Sessions", icon: CalendarDays },
      { href: `${ADMIN_BASE_PATH}/attendance`, label: "Attendance", icon: ClipboardCheck },
      { href: `${ADMIN_BASE_PATH}/registrants`, label: "Registrants", icon: Users },
      { href: `${ADMIN_BASE_PATH}/speakers`, label: "Speakers", icon: Mic },
      { href: `${ADMIN_BASE_PATH}/google-sync`, label: "Google Sync", icon: RefreshCcw },
    ],
  },
  {
    title: "Administration",
    links: [
      { href: `${ADMIN_BASE_PATH}/admins`, label: "Administrators", icon: UserCheck, superAdminOnly: true },
      { href: `${ADMIN_BASE_PATH}/audit-logs`, label: "Audit log", icon: FileText },
      { href: `${ADMIN_BASE_PATH}/settings`, label: "Settings", icon: Settings },
    ],
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src="/cgs-logo.png"
        alt="CGS logo"
        className="h-10 w-10 shrink-0 rounded-full object-contain"
      />
      {!compact && (
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-bold leading-none tracking-tight text-foreground">CGS Console</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Attendance platform</p>
        </div>
      )}
    </div>
  );
}

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Administration" className="space-y-6">
      {navSections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">{section.title}</h2>
          <div className="space-y-1">
            {section.links.map((link) => {
              const active =
                link.href === ADMIN_BASE_PATH
                  ? pathname === ADMIN_BASE_PATH || pathname === "/admin"
                  : pathname === link.href ||
                    pathname.startsWith(`${link.href}/`) ||
                    pathname.startsWith(link.href.replace(ADMIN_BASE_PATH, "/admin"));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150",
                    active
                      ? "bg-primary-muted text-primary shadow-[inset_3px_0_0_var(--primary)]"
                      : "text-muted-foreground hover:bg-secondary/75 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  {link.superAdminOnly ? (
                    <Badge variant="outline" className="border-red-500/25 bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400">SUPER</Badge>
                  ) : active ? (
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function UserArea({ adminName, adminRole, onSignOut }: { adminName: string; adminRole?: string; onSignOut: () => Promise<void> }) {
  const initial = adminName.trim().slice(0, 1).toUpperCase() || "A";
  return (
    <div className="border-t border-border/80 p-4">
      <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-secondary/45 p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-muted font-heading text-sm font-bold text-primary">{initial}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{adminName}</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{adminRole === "SUPER_ADMIN" ? "Super administrator" : "Administrator"}</p>
        </div>
      </div>
      <form action={onSignOut}>
        <button type="submit" className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/30 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/35 hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar({ adminName, adminRole, onSignOut }: { adminName: string; adminRole?: string; onSignOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <>
      <aside className="sidebar-panel sticky top-0 hidden h-dvh w-[17.5rem] shrink-0 flex-col border-r border-border/80 bg-card/90 backdrop-blur-xl md:top-4 md:mb-4 md:ml-4 md:flex md:h-[calc(100dvh-2rem)] md:rounded-2xl md:border md:border-border/80 md:bg-card/85 md:shadow-2xl md:shadow-black/30 md:overflow-hidden">
        <div className="border-b border-border/80 px-5 py-5"><Brand /></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6"><Navigation pathname={pathname} /></div>
        <UserArea adminName={adminName} adminRole={adminRole} onSignOut={onSignOut} />
      </aside>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-center justify-between px-4"><Brand compact />
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Open navigation"
            aria-expanded={mobileDrawerOpen}
          ><Menu className="h-5 w-5" /></button>
        </div>
      </header>

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" aria-label="Close navigation" onClick={() => setMobileDrawerOpen(false)} className="absolute inset-0 bg-[#050816]/70 backdrop-blur-[2px]" />
          <aside className="drawer-panel relative flex h-full w-[min(21rem,calc(100%-3rem))] flex-col border-r border-border bg-card shadow-2xl shadow-black/45">
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-5"><Brand />
              <button type="button" onClick={() => setMobileDrawerOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close navigation"><X className="h-5 w-5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6"><Navigation pathname={pathname} onNavigate={() => setMobileDrawerOpen(false)} /></div>
            <UserArea adminName={adminName} adminRole={adminRole} onSignOut={onSignOut} />
          </aside>
        </div>
      )}
    </>
  );
}
