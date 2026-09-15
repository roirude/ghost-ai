"use client";

import { AlertCircle, Check, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { cn } from "@/lib/utils";

/**
 * The navbar's Save control. The canvas also saves itself, so this both reports
 * the autosave state and offers a manual save through the very same function —
 * a click is indistinguishable from a debounced autosave on the wire.
 *
 * `saved` and `error` are transient: the hook returns the button to `idle`
 * after a moment, which is what makes the label fall back to "Save".
 */
const STATUS_CONTENT = {
  idle: { icon: Save, label: "Save", className: "text-copy-secondary" },
  saving: { icon: Loader2, label: "Saving...", className: "text-copy-muted" },
  saved: { icon: Check, label: "Saved", className: "text-state-success" },
  error: { icon: AlertCircle, label: "Error", className: "text-state-error" },
} as const;

export function SaveStatusButton({
  status,
  onSave,
}: {
  status: CanvasSaveStatus;
  onSave: () => void;
}) {
  const { icon: Icon, label, className } = STATUS_CONTENT[status];

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSave}
      // A second save while one is in flight would race the first for the same
      // blob key, so the control is held closed until the write settles.
      disabled={status === "saving"}
      aria-live="polite"
      aria-label="Save canvas"
      className={cn("disabled:opacity-100", className)}
    >
      <Icon className={cn("size-4", status === "saving" && "animate-spin")} />
      {label}
    </Button>
  );
}
