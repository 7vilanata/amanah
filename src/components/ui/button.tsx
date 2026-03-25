import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--accent)] px-4 py-2.5 text-white hover:bg-[var(--accent-strong)]",
        secondary:
          "border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--foreground)] hover:border-[var(--accent-soft)] hover:bg-[var(--surface-strong)]",
        ghost: "px-3 py-2 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
        danger: "bg-[var(--danger)] px-4 py-2.5 text-white hover:bg-[#b93830]",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
