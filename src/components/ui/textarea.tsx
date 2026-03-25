import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full rounded-xl border border-[var(--border)] bg-white/90 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-soft)] focus:ring-4 focus:ring-[color:color-mix(in_srgb,var(--accent)_12%,transparent)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
