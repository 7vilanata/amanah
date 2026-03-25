import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type FormMessageProps = {
  success?: boolean;
  message?: string | null;
  className?: string;
};

export function FormMessage({ success = false, message, className }: FormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
        success
          ? "border-[#c2dfcc] bg-[#edf8f1] text-[#1f6a3b]"
          : "border-[#ebc4bf] bg-[#fff1ef] text-[#a53a2f]",
        className,
      )}
    >
      {success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <p>{message}</p>
    </div>
  );
}
