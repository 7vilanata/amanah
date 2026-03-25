import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", {
  variants: {
    tone: {
      neutral: "bg-[var(--surface)] text-[var(--muted-strong)]",
      accent: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
      warning: "bg-[#f3dcc1] text-[#8a4b11]",
      success: "bg-[#d9f0df] text-[#1f6a3b]",
      danger: "bg-[#f8d9d4] text-[#a53a2f]",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
