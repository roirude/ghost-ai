import type { Edge, Node } from "@xyflow/react";

export type CanvasNodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon";

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  shape: CanvasNodeShape;
}

/** The single custom node type rendered on the canvas. */
export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
  color?: string;
}

/** The single custom edge type rendered on the canvas. */
export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;

/**
 * Stored per-node color for freshly created nodes. This is the literal value of
 * the `--accent-primary` token rather than a Tailwind class, because `color` is
 * node data that will become user-editable.
 */
export const DEFAULT_NODE_COLOR = "#00c8d4";

export interface CanvasNodeSize {
  width: number;
  height: number;
}

/**
 * Default footprint for each shape. Rectangular shapes are wider than tall,
 * circles are square, and diamonds get extra room so labels fit inside the
 * narrowing corners.
 */
export const DEFAULT_SHAPE_SIZES: Record<CanvasNodeShape, CanvasNodeSize> = {
  rectangle: { width: 160, height: 64 },
  diamond: { width: 180, height: 120 },
  circle: { width: 120, height: 120 },
  pill: { width: 160, height: 56 },
  cylinder: { width: 160, height: 96 },
  hexagon: { width: 170, height: 88 },
};

/** Payload carried by a shape drag from the shape panel to the canvas. */
export interface ShapeDragPayload {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}

/** Custom MIME type used for shape drags out of the shape panel. */
export const SHAPE_DRAG_MIME = "application/x-ghost-shape";

/** Narrows an unparsed drag payload, which arrives as an untrusted string. */
export function parseShapeDragPayload(raw: string): ShapeDragPayload | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;

  const { shape, width, height } = parsed as Record<string, unknown>;

  if (typeof shape !== "string" || !(shape in DEFAULT_SHAPE_SIZES)) return null;
  if (typeof width !== "number" || typeof height !== "number") return null;

  return { shape: shape as CanvasNodeShape, width, height };
}
