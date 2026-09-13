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
  /** Opaque node fill. The `color` of a `NodeColorPair`. */
  color: string;
  /** Label colour paired with `color`. The `textColor` of a `NodeColorPair`. */
  textColor: string;
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
 * Default edge stroke from `context/ui-context.md`. A literal hex rather than a
 * theme token for the same reason the node palette is: edges are drawn into SVG
 * attributes and, once a colour is stored on edge data, into Liveblocks
 * Storage, where CSS variables mean nothing.
 */
export const DEFAULT_EDGE_COLOR = "#f8fafc";

/**
 * Edges are visually secondary to nodes, so the line stays thin and the
 * emphasis is carried entirely by opacity: dimmed at rest, full when the edge
 * is hovered or selected.
 */
export const EDGE_STROKE_WIDTH = 1.5;
export const EDGE_REST_OPACITY = 0.45;
export const EDGE_ACTIVE_OPACITY = 1;

/**
 * Width of the transparent companion path React Flow draws for pointer events.
 * This is what makes a thin edge easy to hover and click; it never affects the
 * rendered stroke.
 */
export const EDGE_INTERACTION_WIDTH = 20;

/** Shown on an active edge that has no label yet, and as the editor's placeholder. */
export const EDGE_LABEL_PLACEHOLDER = "Add label";

/**
 * One entry of the node colour palette: an opaque fill plus the vivid text
 * colour tuned to read against it. The two always travel together — picking a
 * swatch writes both onto the node — so they are stored as a pair rather than
 * as two independently chosen colours.
 */
export interface NodeColorPair {
  /** Stable key persisted-adjacent only in the UI; not written to node data. */
  id: string;
  /** Human-readable swatch name, used as the toolbar button's accessible label. */
  name: string;
  /** Opaque node fill, an `#rrggbb` literal. */
  color: string;
  /** Label colour for a node filled with `color`, an `#rrggbb` literal. */
  textColor: string;
}

/**
 * The canvas node palette from `context/ui-context.md`. These are literal hex
 * values rather than theme tokens because they are node *data*: a pair chosen
 * today has to keep rendering the same way after a token is retuned, and the
 * values are written into Liveblocks Storage where CSS variables mean nothing.
 */
export const NODE_COLORS: NodeColorPair[] = [
  { id: "neutral", name: "Neutral", color: "#1F1F1F", textColor: "#EDEDED" },
  { id: "blue", name: "Blue", color: "#10233D", textColor: "#52A8FF" },
  { id: "purple", name: "Purple", color: "#2E1938", textColor: "#BF7AF0" },
  { id: "orange", name: "Orange", color: "#331B00", textColor: "#FF990A" },
  { id: "red", name: "Red", color: "#3C1618", textColor: "#FF6166" },
  { id: "pink", name: "Pink", color: "#3A1726", textColor: "#F75F8F" },
  { id: "green", name: "Green", color: "#0F2E18", textColor: "#62C073" },
  { id: "teal", name: "Teal", color: "#062822", textColor: "#0AC7B4" },
];

/** Neutral dark. Freshly dropped nodes start here. */
export const DEFAULT_NODE_COLOR_PAIR: NodeColorPair = NODE_COLORS[0];

export const DEFAULT_NODE_COLOR = DEFAULT_NODE_COLOR_PAIR.color;
export const DEFAULT_NODE_TEXT_COLOR = DEFAULT_NODE_COLOR_PAIR.textColor;

/**
 * Finds the palette entry a node currently sits on. Matching is on the fill
 * alone: it is what a swatch writes, and a node carrying a colour from outside
 * the palette (older data, a hand-edited room) simply has no active swatch
 * rather than being force-fitted onto one.
 */
export function findNodeColorPair(color: string): NodeColorPair | undefined {
  const normalized = color.trim().toLowerCase();

  return NODE_COLORS.find((pair) => pair.color.toLowerCase() === normalized);
}

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

/**
 * Floor for interactive resizing. Small enough that a node can be shrunk well
 * below any shape's default footprint, but large enough that the label slot and
 * the four connection handles stay reachable.
 */
export const MIN_NODE_WIDTH = 60;
export const MIN_NODE_HEIGHT = 40;

/** Shown centered in a node whose label is still empty. */
export const NODE_LABEL_PLACEHOLDER = "Add text";

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
