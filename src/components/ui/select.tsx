import * as React from "react";

import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-[var(--border)] bg-white/90 px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent-soft)] focus:ring-4 focus:ring-[color:color-mix(in_srgb,var(--accent)_12%,transparent)]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";

export { Select };
