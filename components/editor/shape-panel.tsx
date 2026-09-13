"use client";

import type { DragEvent } from "react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
  type LucideIcon,
} from "lucide-react";

import {
  DEFAULT_SHAPE_SIZES,
  SHAPE_DRAG_MIME,
  type CanvasNodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

interface ShapeOption {
  shape: CanvasNodeShape;
  label: string;
  icon: LucideIcon;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { shape: "rectangle", label: "Rectangle", icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", icon: Diamond },
  { shape: "circle", label: "Circle", icon: Circle },
  { shape: "pill", label: "Pill", icon: Pill },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon },
];

function handleDragStart(
  event: DragEvent<HTMLButtonElement>,
  shape: CanvasNodeShape,
) {
  const payload: ShapeDragPayload = {
    shape,
    ...DEFAULT_SHAPE_SIZES[shape],
  };

  const serialized = JSON.stringify(payload);

  event.dataTransfer.setData(SHAPE_DRAG_MIME, serialized);
  // Mirrored onto `text/plain` because some browsers withhold custom types
  // from the drop event; the canvas reads whichever one survives.
  event.dataTransfer.setData("text/plain", serialized);
  event.dataTransfer.effectAllowed = "copy";
}

/** Floating pill toolbar of draggable shapes, centered at the canvas bottom. */
export function ShapePanel() {
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-bg-surface/95 p-2 shadow-lg backdrop-blur">
        {SHAPE_OPTIONS.map(({ shape, label, icon: Icon }) => (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(event) => handleDragStart(event, shape)}
            title={`Drag to add a ${label.toLowerCase()}`}
            aria-label={`Drag to add a ${label.toLowerCase()}`}
            className="flex size-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-bg-subtle hover:text-copy-primary active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Icon className="size-4" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
