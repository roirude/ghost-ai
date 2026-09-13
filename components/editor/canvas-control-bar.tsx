"use client";

import type { LucideIcon } from "lucide-react";
import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react";

interface ControlAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

function ControlButton({ label, icon: Icon, onClick, disabled }: ControlAction) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-bg-subtle hover:text-copy-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

/**
 * Floating pill of zoom and history controls at the bottom-left of the canvas.
 * Sits at the same height as the shape panel, which is centered, so the two
 * toolbars read as one row without overlapping.
 */
export function CanvasControlBar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-20">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-bg-surface/95 p-2 shadow-lg backdrop-blur">
        <ControlButton label="Zoom out" icon={Minus} onClick={onZoomOut} />
        <ControlButton label="Fit view" icon={Maximize} onClick={onFitView} />
        <ControlButton label="Zoom in" icon={Plus} onClick={onZoomIn} />

        <div
          aria-hidden
          className="mx-1 h-5 w-px shrink-0 bg-surface-border"
        />

        <ControlButton
          label="Undo"
          icon={Undo2}
          onClick={onUndo}
          disabled={!canUndo}
        />
        <ControlButton
          label="Redo"
          icon={Redo2}
          onClick={onRedo}
          disabled={!canRedo}
        />
      </div>
    </div>
  );
}
