"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/sessions", label: "Sessions" },
  { href: "/attendance", label: "Attendance" },
  { href: "/status", label: "Platform status" },
];

export function PublicNav({ orgName }: { orgName: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClass = (href: string) => cn(
    "nav-link-underline rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
    (pathname === href || pathname.startsWith(`${href}/`))
      ? "bg-primary-muted text-primary"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label={`${orgName} home`}>
          <img
            src="/cgs-logo.png"
            alt={`${orgName} logo`}
            className="h-10 w-10 shrink-0 rounded-full object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          />
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold leading-none tracking-tight text-foreground sm:text-lg">{orgName}</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">Session & attendance</p>
          </div>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)} data-active={(pathname === link.href || pathname.startsWith(`${link.href}/`)) ? "true" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105 active:scale-95 md:hidden" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border/70 bg-card/95 px-4 py-3 shadow-xl shadow-black/10 backdrop-blur-xl md:hidden animate-fade-in">
          <nav aria-label="Mobile primary" className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className={cn(linkClass(link.href), "py-3 text-sm")}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}