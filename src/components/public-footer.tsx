import Link from "next/link";

export function PublicFooter({ orgName }: { orgName: string }) {
  return (
    <footer className="border-t border-border/70 bg-card/25 py-10 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <img
              src="/cgs-logo.png"
              alt={`${orgName} logo`}
              className="h-9 w-9 rounded-full object-contain"
            />
            <span className="font-heading font-bold text-foreground text-base">
              {orgName}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-sans">
            <Link href="/sessions" className="hover:text-foreground transition-colors">
              Sessions
            </Link>
            <Link href="/attendance" className="hover:text-foreground transition-colors">
              Mark Attendance
            </Link>
            <Link href="/status" className="hover:text-foreground transition-colors">
              Platform Status
            </Link>
          </div>

          <p className="text-xs text-muted-foreground font-sans">
            &copy; {new Date().getFullYear()} {orgName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}