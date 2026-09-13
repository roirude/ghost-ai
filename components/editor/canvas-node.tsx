"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { CanvasNode as CanvasNodeType } from "@/types/canvas";

/**
 * Placeholder renderer for the `canvasNode` type. Every shape draws as a
 * bordered rectangle with a centered label for now — shape-specific visuals
 * come in a later unit.
 */
export function CanvasNode({ data, selected }: NodeProps<CanvasNodeType>) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-xl border-2 bg-bg-elevated px-3 py-2 text-center text-sm text-copy-primary ${
        selected ? "ring-2 ring-brand ring-offset-2 ring-offset-bg-base" : ""
      }`}
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Top} />
      <span className="pointer-events-none break-words">{data.label}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
