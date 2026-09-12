import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-xl border border-surface-border bg-bg-surface px-3 py-1 text-sm text-copy-primary shadow-xs transition-colors outline-none placeholder:text-copy-muted disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40",
        "aria-invalid:border-state-error aria-invalid:ring-2 aria-invalid:ring-state-error/30",
        className
      )}
      {...props}
    />
  );
}

export { Input };
