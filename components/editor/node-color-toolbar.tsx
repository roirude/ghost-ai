"use client";

import { useCallback, type CSSProperties, type PointerEvent } from "react";
import { useReactFlow } from "@xyflow/react";

import {
  NODE_COLORS,
  type CanvasNode as CanvasNodeType,
  type CanvasNodeData,
  type NodeColorPair,
} from "@/types/canvas";

/**
 * Gap between the toolbar's bottom edge and the node's top edge, in canvas
 * units. Wide enough to clear the resizer's top handles, which sit centered on
 * the node outline, so the toolbar never covers a resize affordance.
 */
const TOOLBAR_OFFSET = 14;

/**
 * Hover glow, expressed as a spread-less shadow so it stays a tight halo around
 * the swatch rather than a soft cloud. Driven by the swatch's own text colour.
 */
const GLOW_BLUR = 8;
const GLOW_ALPHA = 0.75;

/**
 * Floating palette shown above a selected node. Rendered inside the node so it
 * travels with it; React Flow scales it with the viewport like any other node
 * content, which keeps it pinned to the node at every zoom level.
 */
export function NodeColorToolbar({
  nodeId,
  activeColor,
}: {
  nodeId: string;
  /** The node's current fill, used to mark the matching swatch active. */
  activeColor: string;
}) {
  const { updateNodeData } = useReactFlow<CanvasNodeType>();

  const onSelect = useCallback(
    (pair: NodeColorPair) => {
      // `updateNodeData` merges into `data` and routes through the controlled
      // `onNodesChange` that `useLiveblocksFlow` owns, so the pair lands in
      // Storage and re-renders every peer's canvas — no server call of our own.
      updateNodeData(nodeId, {
        color: pair.color,
        textColor: pair.textColor,
      } satisfies Partial<CanvasNodeData>);
    },
    [nodeId, updateNodeData],
  );

  return (
    <div
      // `nodrag`/`nopan` are React Flow's own opt-outs: without them a press on
      // a swatch starts a node drag or a canvas pan instead of picking a colour.
      className="nodrag nopan absolute bottom-full left-1/2 z-10 -translate-x-1/2 rounded-xl border border-surface-border bg-bg-surface/95 p-1 shadow-lg backdrop-blur"
      style={{ marginBottom: TOOLBAR_OFFSET }}
      // A press anywhere in the toolbar — including the padding between
      // swatches — must not reach the canvas underneath.
      onPointerDown={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <div className="flex items-center gap-1">
        {NODE_COLORS.map((pair) => {
          const active =
            pair.color.toLowerCase() === activeColor.trim().toLowerCase();

          return (
            <button
              key={pair.id}
              type="button"
              title={pair.name}
              aria-label={`${pair.name} colour`}
              aria-pressed={active}
              onClick={() => onSelect(pair)}
              className="size-5 rounded-md border transition-shadow hover:[box-shadow:var(--swatch-glow)]"
              style={
                {
                  backgroundColor: pair.color,
                  // At rest the border is the swatch's text colour dimmed, so
                  // the near-black fills stay distinguishable from each other
                  // and from the panel. Active swatches take it at full
                  // strength plus a ring, which is what reads as "selected".
                  borderColor: active
                    ? pair.textColor
                    : withAlpha(pair.textColor, 0.45),
                  boxShadow: active
                    ? `0 0 0 2px var(--bg-surface), 0 0 0 3px ${pair.textColor}`
                    : undefined,
                  "--swatch-glow": `0 0 ${GLOW_BLUR}px ${withAlpha(
                    pair.textColor,
                    GLOW_ALPHA,
                  )}`,
                } as CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}

/** Keeps a press on the toolbar from reaching React Flow's drag/pan. */
function stopPropagation(event: PointerEvent | { stopPropagation: () => void }) {
  event.stopPropagation();
}

/**
 * Applies an alpha channel to a palette colour. Palette entries are `#rrggbb`
 * literals from `NODE_COLORS`; anything else is passed through untouched.
 */
function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());

  if (!match) return color;

  const value = Number.parseInt(match[1], 16);

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}
