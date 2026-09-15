"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useNodes,
  useReactFlow,
  type DefaultEdgeOptions,
} from "@xyflow/react";

import { CanvasControlBar } from "@/components/editor/canvas-control-bar";
import { CanvasCursors } from "@/components/editor/canvas-cursors";
import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import { ShapePanel } from "@/components/editor/shape-panel";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import {
  useCanvasAutosave,
  type CanvasSaveStatus,
} from "@/hooks/use-canvas-autosave";
import { useCanvasLoad } from "@/hooks/use-canvas-load";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  EDGE_STROKE_WIDTH,
  SHAPE_DRAG_MIME,
  parseShapeDragPayload,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";

import "@xyflow/react/dist/style.css";

const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];

const NODE_TYPES = { canvasNode: CanvasNodeRenderer };
const EDGE_TYPES = { canvasEdge: CanvasEdgeRenderer };

/**
 * Applied to every edge created by a drag between two handles, so a new
 * connection renders through `CanvasEdge` rather than React Flow's default
 * bezier. The marker is declared here rather than inside the renderer because
 * React Flow hoists marker definitions into a shared `<defs>` from the edge
 * object, not from what the edge component draws.
 */
const DEFAULT_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: DEFAULT_EDGE_COLOR,
    width: 16,
    height: 16,
  },
  style: {
    stroke: DEFAULT_EDGE_COLOR,
    strokeWidth: EDGE_STROKE_WIDTH,
    strokeLinecap: "round",
  },
};

const GRID_GAP = 24;

/** Dot colour — a lift off `--bg-base` rather than a visible grid line. */
const DOT_COLOR = "#26262e";

/**
 * An empty room has nothing to fit, so start at 1:1 on the origin instead of
 * letting `fitView` snap to an arbitrary zoom.
 */
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

/**
 * Length of the viewport tween used by the control bar and the matching
 * keyboard shortcuts — long enough to read as motion, short enough that a
 * held-down key still feels responsive.
 */
const VIEWPORT_ANIMATION_DURATION = 200;

/**
 * Passed to `deleteKeyCode` to turn React Flow's built-in keyboard deletion
 * off. An empty array rather than `null` because `null` is also what React Flow
 * reads as "no binding", but an array is what its own types document for the
 * "bind nothing" case.
 */
const DISABLED_KEY_CODES: string[] = [];

/**
 * True while the event came from somewhere the user is typing. Node labels are
 * edited in a `<textarea>` that lives inside the canvas, so without this a
 * Backspace aimed at a character would delete the whole node.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * The edges to delete alongside `nodes`: the ones explicitly selected, plus
 * every edge with an endpoint on a node being removed. React Flow's built-in
 * deletion cascades to attached edges on its own, but `onDelete` from
 * `useLiveblocksFlow` deletes exactly the ids it is handed — so without this a
 * deleted node would leave its edges behind, dangling off nothing.
 */
function withConnectedEdges<N extends { id: string }, E extends { id: string; source: string; target: string }>(
  selectedEdges: E[],
  nodes: N[],
  allEdges: E[],
): E[] {
  if (nodes.length === 0) return selectedEdges;

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeIds = new Set(selectedEdges.map((edge) => edge.id));
  const result = [...selectedEdges];

  for (const edge of allEdges) {
    if (edgeIds.has(edge.id)) continue;
    if (nodeIds.has(edge.source) || nodeIds.has(edge.target)) {
      result.push(edge);
    }
  }

  return result;
}

/**
 * Registers the canvas's template-import action with an owner outside the room.
 * The navbar button that triggers an import lives in `WorkspaceShell`, above
 * both `RoomProvider` and `ReactFlowProvider`, so it cannot call
 * `useLiveblocksFlow` itself — but the import has to run *inside* the room to
 * write through the same collaborative state every other edit uses. Handing the
 * action upward keeps that boundary intact.
 */
export interface CanvasImportHandle {
  onImportReady?: (importTemplate: (template: CanvasTemplate) => void) => void;
}

export interface CanvasProps extends CanvasImportHandle {
  /** Project whose saved canvas snapshot this room loads from and saves to. */
  projectId: string;
  /** Reports autosave progress to the navbar, which renders outside the room. */
  onSaveStatusChange?: (status: CanvasSaveStatus) => void;
  /**
   * Publishes the manual-save action upward, for the same reason
   * `onImportReady` exists: the navbar's Save button renders above the room and
   * cannot reach the autosave hook, which lives inside it.
   */
  onSaveReady?: (save: () => void) => void;
}

function CanvasFlow({
  projectId,
  onImportReady,
  onSaveStatusChange,
  onSaveReady,
}: CanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: INITIAL_NODES },
      edges: { initial: INITIAL_EDGES },
      suspense: true,
    });

  // The saved snapshot only refills an empty room; autosave stays parked until
  // that decision has been made, so it can never persist the pre-load canvas.
  const { isLoaded } = useCanvasLoad({
    projectId,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
  });

  const { status: saveStatus, save } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: isLoaded,
  });

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [onSaveStatusChange, saveStatus]);

  useEffect(() => {
    onSaveReady?.(() => {
      void save();
    });
  }, [onSaveReady, save]);

  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;

  // Liveblocks owns the room's history, so undo/redo here rewinds the shared
  // Storage that `useLiveblocksFlow` writes through — not a local stack.
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const onZoomIn = useCallback(() => {
    reactFlow.zoomIn({ duration: VIEWPORT_ANIMATION_DURATION });
  }, [reactFlow]);

  const onZoomOut = useCallback(() => {
    reactFlow.zoomOut({ duration: VIEWPORT_ANIMATION_DURATION });
  }, [reactFlow]);

  // `fitView` on an empty canvas does not no-op: React Flow queues it and holds
  // it until nodes are measured, so it fires on whatever node lands next —
  // which is why dropping the *first* shape used to snap the viewport while
  // dropping into an occupied canvas did not. Nothing to frame means nothing to
  // do, so the call is skipped rather than left pending.
  const onFitView = useCallback(() => {
    if (nodes.length === 0) return;

    reactFlow.fitView({ duration: VIEWPORT_ANIMATION_DURATION });
  }, [nodes.length, reactFlow]);

  useKeyboardShortcuts({ reactFlow, undo, redo });

  // Presence carries the cursor in *canvas* coordinates, not screen pixels, so
  // every peer resolves it through their own viewport transform and the pointer
  // lands on the same point of the diagram regardless of their pan or zoom.
  const updateMyPresence = useUpdateMyPresence();

  const onMouseMove = useCallback(
    (event: ReactMouseEvent) => {
      updateMyPresence({
        cursor: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
      });
    },
    [screenToFlowPosition, updateMyPresence],
  );

  // Clearing to null rather than leaving the last coordinate keeps a stale
  // pointer from hanging on the canvas after someone moves away from it.
  const onMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  // Distinguishes nodes dropped within the same millisecond.
  const idCounter = useRef(0);

  const createNodeId = useCallback((shape: CanvasNodeShape) => {
    idCounter.current += 1;
    return `${shape}-${Date.now()}-${idCounter.current}`;
  }, []);

  // `preventDefault` on every dragover is what marks this element as a valid
  // drop target; skipping it for unrecognised drags is what made shape drops
  // fail, because the browser then rejects the drop before `onDrop` ever runs.
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      // Firefox only reliably surfaces the custom type; other browsers keep the
      // `text/plain` mirror, so try both before giving up.
      const payload =
        parseShapeDragPayload(event.dataTransfer.getData(SHAPE_DRAG_MIME)) ??
        parseShapeDragPayload(event.dataTransfer.getData("text/plain"));

      if (!payload) return;

      const { shape, width, height, grabOffsetX, grabOffsetY } = payload;

      // `screenToFlowPosition` already subtracts the canvas container's
      // bounding rect and divides out the current pan and zoom, so the cursor
      // arrives in flow units. What it cannot know is where inside the drag
      // ghost the user grabbed: the ghost is pinned to the cursor at that
      // offset for the whole drag, so the node's top-left is the cursor less
      // that offset. Left unsubtracted, the node lands below and right of the
      // pointer by however far down the ghost the grab was.
      //
      // The offset is in the ghost's screen pixels while the node's position is
      // in flow units, so the two points are converted separately and
      // subtracted in flow space — scaling the offset by hand would have to
      // re-derive the zoom this already accounts for.
      const dropPoint = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const offsetProbe = screenToFlowPosition({
        x: event.clientX + grabOffsetX,
        y: event.clientY + grabOffsetY,
      });

      const flowGrabOffsetX = offsetProbe.x - dropPoint.x;
      const flowGrabOffsetY = offsetProbe.y - dropPoint.y;

      const node: CanvasNode = {
        id: createNodeId(shape),
        type: "canvasNode",
        position: {
          x: dropPoint.x - flowGrabOffsetX,
          y: dropPoint.y - flowGrabOffsetY,
        },
        width,
        height,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          textColor: DEFAULT_NODE_TEXT_COLOR,
          shape,
        },
      };

      onNodesChange([{ type: "add", item: node }]);
    },
    [createNodeId, onNodesChange, screenToFlowPosition],
  );

  // React Flow's own nodes/edges, which carry the `selected` flag the canvas is
  // actually rendering. Read through the store rather than off the Liveblocks
  // arrays because selection is local UI state: it is deliberately not synced,
  // so a peer's selection can never make this client delete something.
  const flowNodes = useNodes<CanvasNode>();
  const flowEdges = useEdges<CanvasEdge>();

  // Bound to `window` rather than to the canvas wrapper. React Flow calls
  // `preventDefault` on a node's mousedown to drive its own dragging, which
  // stops the browser moving focus onto the node — so focus stays on `<body>`,
  // the keydown is raised there, and a handler on the wrapper would never see
  // it. This is the same reason `useKeyboardShortcuts` listens on `window`.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" && event.key !== "Backspace") return;

      // A node label is edited in a textarea inside the canvas, so a Backspace
      // meant for text would otherwise delete the node being labelled.
      if (isEditableTarget(event.target)) return;

      const selectedNodes = flowNodes.filter((node) => node.selected);
      const selectedEdges = flowEdges.filter((edge) => edge.selected);

      if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

      event.preventDefault();

      // Removal goes through `onDelete` rather than a `remove` change on
      // `onNodesChange`/`onEdgesChange`: `useLiveblocksFlow` ignores `remove`
      // changes outright (they are a no-op in its reducer), so routing a delete
      // that way silently left the node in Storage. `onDelete` is the hook's
      // own mutation and deletes straight out of the shared map, so the removal
      // reaches every connected client and lands in the room's undo history.
      //
      // Edges attached to a deleted node have to be named explicitly — the
      // mutation deletes exactly what it is given and does not cascade.
      onDelete({
        nodes: selectedNodes,
        edges: withConnectedEdges(selectedEdges, selectedNodes, flowEdges),
      });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flowEdges, flowNodes, onDelete]);

  const importTemplate = useCallback(
    (template: CanvasTemplate) => {
      // A template *replaces* the canvas, so every existing element is removed
      // before the new ones are added. The removal goes through `onDelete` for
      // the same reason the Delete-key handler does: `useLiveblocksFlow` treats
      // a `remove` change as a no-op, so clearing via `onNodesChange` left the
      // old canvas in Storage and the template merely piled on top of it.
      if (nodes.length > 0 || edges.length > 0) {
        onDelete({ nodes, edges });
      }

      onNodesChange(
        template.nodes.map((item) => ({ type: "add", item }) as const),
      );
      onEdgesChange(
        template.edges.map((item) => ({ type: "add", item }) as const),
      );

      // Deferred so the added elements are measured before the viewport is
      // framed; fitting in the same tick would fit an empty canvas — and an
      // empty fit is exactly what gets queued and then fires on an unrelated
      // later drop. A template with no nodes is therefore not fitted at all.
      if (template.nodes.length > 0) {
        requestAnimationFrame(() => {
          reactFlow.fitView({ duration: VIEWPORT_ANIMATION_DURATION });
        });
      }
    },
    [edges, nodes, onDelete, onEdgesChange, onNodesChange, reactFlow],
  );

  // Publishes the import action upward once it is available, and on every
  // change of identity, so the navbar always holds a callback closed over the
  // current node/edge state rather than a stale first-render snapshot.
  useEffect(() => {
    onImportReady?.(importTemplate);
  }, [importTemplate, onImportReady]);

  return (
    <div
      className="absolute inset-0 bg-bg-base"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        // Deletion is handled by the wrapper's own keydown so it routes through
        // Liveblocks. An empty array switches React Flow's built-in key path
        // off entirely rather than letting the two race for the same keystroke.
        deleteKeyCode={DISABLED_KEY_CODES}
        connectionMode={ConnectionMode.Loose}
        // The in-flight connection line matches the orthogonal routing the
        // dropped edge will use, so the preview is not a bezier that snaps.
        connectionLineType={ConnectionLineType.SmoothStep}
        proOptions={{ hideAttribution: true }}
        defaultViewport={DEFAULT_VIEWPORT}
        minZoom={0.1}
        maxZoom={4}
        panOnScroll
        className="h-full w-full bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={GRID_GAP}
          size={1.2}
          color={DOT_COLOR}
          className="bg-bg-base"
        />
        <CanvasCursors />
      </ReactFlow>
      <CanvasControlBar
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFitView={onFitView}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ShapePanel />
      <PresenceAvatars />
    </div>
  );
}

export function Canvas({
  projectId,
  onImportReady,
  onSaveStatusChange,
}: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasFlow
        projectId={projectId}
        onImportReady={onImportReady}
        onSaveStatusChange={onSaveStatusChange}
      />
    </ReactFlowProvider>
  );
}
