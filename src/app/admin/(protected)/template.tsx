"use client";

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition min-w-0 flex-1">{children}</div>;
}