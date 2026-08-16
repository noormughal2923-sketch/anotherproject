import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none transition-colors focus:outline-none font-sans",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        cgs: "border-primary/30 bg-primary-muted text-primary font-semibold",
        
        // Semantic Attendance Status Badges
        present: "border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium",
        absent: "border-red-500/30 bg-red-500/10 text-red-400 font-medium",
        late: "border-red-500/30 bg-red-500/10 text-red-400 font-medium",
        excused: "border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium",
        pending: "border-border bg-muted text-muted-foreground font-medium",

        // Session Status Badges
        live: "border-red-500/40 bg-red-500/15 text-red-400 animate-pulse font-bold tracking-wide",
        upcoming: "border-primary/30 bg-primary-muted text-primary font-medium",
        draft: "border-border bg-muted text-muted-foreground",
        completed: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        cancelled: "border-red-500/30 bg-red-950/40 text-red-400 line-through",
        
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-blue-500/20 bg-blue-500/10 text-blue-400",
        warning: "border-red-500/20 bg-red-500/10 text-red-400",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400",
        outline: "text-foreground border-border",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
