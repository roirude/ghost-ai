import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_SHAPE_SIZES,
  EDGE_STROKE_WIDTH,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
  type NodeColorPair,
} from "@/types/canvas";

/**
 * One pre-built diagram a user can drop onto an empty canvas. The nodes and
 * edges are the real `CanvasNode`/`CanvasEdge` types rather than a reduced
 * template-only shape, so importing is a plain hand-off into the existing
 * node/edge state — no translation layer that could drift from the renderer.
 */
export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/**
 * Palette lookup by id. Templates name a colour ("blue") instead of repeating
 * a `#rrggbb` pair on every node, which keeps the data below readable and
 * keeps templates on the shared palette rather than on hand-picked hexes.
 */
const COLORS: Record<string, NodeColorPair> = Object.fromEntries(
  NODE_COLORS.map((pair) => [pair.id, pair]),
);

/** Shorthand for one template node, expanded by `node()` below. */
interface TemplateNodeSpec {
  id: string;
  label: string;
  shape: CanvasNodeShape;
  /** An id from `NODE_COLORS`. */
  color: string;
  x: number;
  y: number;
  /** Overrides the shape's default footprint when a label needs more room. */
  width?: number;
  height?: number;
}

/**
 * Expands a template node spec into a real `CanvasNode`. Sizes default to the
 * shape's own footprint from `DEFAULT_SHAPE_SIZES`, so a template node matches
 * what dragging that shape out of the panel would produce.
 */
function node({
  id,
  label,
  shape,
  color,
  x,
  y,
  width,
  height,
}: TemplateNodeSpec): CanvasNode {
  const pair = COLORS[color];
  const size = DEFAULT_SHAPE_SIZES[shape];

  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width: width ?? size.width,
    height: height ?? size.height,
    data: {
      label,
      color: pair.color,
      textColor: pair.textColor,
      shape,
    },
  };
}

/**
 * Which side of a node an edge attaches to. These are the handle ids declared
 * by `canvas-node.tsx`, which names all four (`top`/`right`/`bottom`/`left`)
 * and declares no unidentified default handle — so a template edge *must* name
 * its endpoints. An edge that omits them is silently dropped by React Flow
 * (error #008), which is a blank canvas rather than a visible failure.
 */
type HandleId = "top" | "right" | "bottom" | "left";

/**
 * Expands a `[source, target]` pair (with an optional label) into a real
 * `CanvasEdge`. The stroke and marker mirror `DEFAULT_EDGE_OPTIONS` in
 * `canvas.tsx` so an imported edge is indistinguishable from a hand-drawn one
 * — including the arrowhead, which React Flow hoists from the edge object
 * rather than from the edge component.
 *
 * Handles default to a left-to-right flow (`right` → `left`), matching how
 * every template below is laid out; vertical hops name their sides explicitly.
 */
function edge(
  source: string,
  target: string,
  label?: string,
  sourceHandle: HandleId = "right",
  targetHandle: HandleId = "left",
): CanvasEdge {
  return {
    id: `${source}-${target}`,
    type: "canvasEdge",
    source,
    target,
    sourceHandle,
    targetHandle,
    markerEnd: {
      type: "arrowclosed" as const,
      color: DEFAULT_EDGE_COLOR,
      width: 16,
      height: 16,
    },
    style: {
      stroke: DEFAULT_EDGE_COLOR,
      strokeWidth: EDGE_STROKE_WIDTH,
      strokeLinecap: "round",
    },
    ...(label ? { data: { label } } : {}),
  };
}

/**
 * The built-in template library. Positions are authored on a loose 220x150
 * grid so each diagram reads as columns of flow stages; `fitView` after import
 * is what actually frames them, so the absolute origin does not matter.
 */
export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "An API gateway fanning out to three services, each with its own datastore.",
    nodes: [
      node({ id: "client", label: "Client", shape: "pill", color: "neutral", x: 0, y: 200 }),
      node({ id: "gateway", label: "API Gateway", shape: "hexagon", color: "blue", x: 240, y: 186 }),
      node({ id: "auth", label: "Auth Service", shape: "rectangle", color: "purple", x: 500, y: 40 }),
      node({ id: "orders", label: "Order Service", shape: "rectangle", color: "green", x: 500, y: 200 }),
      node({ id: "billing", label: "Billing Service", shape: "rectangle", color: "orange", x: 500, y: 360 }),
      node({ id: "auth-db", label: "Users DB", shape: "cylinder", color: "teal", x: 760, y: 24 }),
      node({ id: "orders-db", label: "Orders DB", shape: "cylinder", color: "teal", x: 760, y: 184 }),
      node({ id: "billing-db", label: "Billing DB", shape: "cylinder", color: "teal", x: 760, y: 344 }),
    ],
    edges: [
      edge("client", "gateway", "HTTPS"),
      edge("gateway", "auth"),
      edge("gateway", "orders"),
      edge("gateway", "billing"),
      edge("auth", "auth-db"),
      edge("orders", "orders-db"),
      edge("billing", "billing-db"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "A commit flowing through build and test to a gated production deploy.",
    nodes: [
      node({ id: "commit", label: "Commit", shape: "pill", color: "neutral", x: 0, y: 160 }),
      node({ id: "build", label: "Build", shape: "rectangle", color: "blue", x: 220, y: 164 }),
      node({ id: "test", label: "Test", shape: "rectangle", color: "purple", x: 440, y: 164 }),
      node({ id: "gate", label: "Passing?", shape: "diamond", color: "orange", x: 650, y: 136 }),
      node({ id: "staging", label: "Deploy Staging", shape: "rectangle", color: "green", x: 900, y: 60 }),
      node({ id: "production", label: "Deploy Production", shape: "rectangle", color: "green", x: 1120, y: 60, width: 180 }),
      node({ id: "notify", label: "Notify Team", shape: "rectangle", color: "red", x: 900, y: 300 }),
    ],
    edges: [
      edge("commit", "build"),
      edge("build", "test"),
      edge("test", "gate"),
      edge("gate", "staging", "pass"),
      edge("gate", "notify", "fail"),
      edge("staging", "production", "approve"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Producers publishing onto a broker that fans events out to consumers.",
    nodes: [
      node({ id: "web", label: "Web App", shape: "rectangle", color: "neutral", x: 0, y: 60 }),
      node({ id: "mobile", label: "Mobile App", shape: "rectangle", color: "neutral", x: 0, y: 260 }),
      node({ id: "broker", label: "Event Broker", shape: "hexagon", color: "orange", x: 270, y: 146 }),
      node({ id: "queue", label: "Dead Letter Queue", shape: "cylinder", color: "red", x: 270, y: 360, width: 180 }),
      node({ id: "analytics", label: "Analytics Worker", shape: "rectangle", color: "blue", x: 540, y: 20, width: 180 }),
      node({ id: "email", label: "Email Worker", shape: "rectangle", color: "purple", x: 540, y: 160, width: 180 }),
      node({ id: "search", label: "Search Indexer", shape: "rectangle", color: "green", x: 540, y: 300, width: 180 }),
      node({ id: "warehouse", label: "Warehouse", shape: "cylinder", color: "teal", x: 800, y: 4 }),
    ],
    edges: [
      edge("web", "broker", "publish"),
      edge("mobile", "broker", "publish"),
      edge("broker", "analytics"),
      edge("broker", "email"),
      edge("broker", "search"),
      edge("broker", "queue", "retry"),
      edge("analytics", "warehouse"),
    ],
  },
];
