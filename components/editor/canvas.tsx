"use client";

import { useCallback, useEffect, useRef, type DragEvent } from "react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
} from "@xyflow/react";

import { CanvasControlBar } from "@/components/editor/canvas-control-bar";
import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
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

function CanvasFlow({ onImportReady }: CanvasImportHandle) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: INITIAL_NODES },
      edges: { initial: INITIAL_EDGES },
      suspense: true,
    });

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

  const onFitView = useCallback(() => {
    reactFlow.fitView({ duration: VIEWPORT_ANIMATION_DURATION });
  }, [reactFlow]);

  useKeyboardShortcuts({ reactFlow, undo, redo });

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

      const { shape, width, height } = payload;
      const dropPoint = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const node: CanvasNode = {
        id: createNodeId(shape),
        type: "canvasNode",
        // Center the shape on the cursor rather than hanging it off the corner.
        position: { x: dropPoint.x - width / 2, y: dropPoint.y - height / 2 },
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

  const importTemplate = useCallback(
    (template: CanvasTemplate) => {
      // A template *replaces* the canvas, so every existing element is removed
      // before the new ones are added. Both halves go through the controlled
      // `onNodesChange`/`onEdgesChange` that `useLiveblocksFlow` owns, so the
      // swap is an ordinary Storage write that syncs to peers and lands in the
      // room's undo history like any other edit.
      //
      // Edges are cleared first: removing a node cascades to the edges attached
      // to it, and clearing edges up front keeps that from racing the explicit
      // removals below.
      if (edges.length > 0) {
        onEdgesChange(
          edges.map((existing) => ({ type: "remove", id: existing.id }) as const),
        );
      }

      if (nodes.length > 0) {
        onNodesChange(
          nodes.map((existing) => ({ type: "remove", id: existing.id }) as const),
        );
      }

      onNodesChange(
        template.nodes.map((item) => ({ type: "add", item }) as const),
      );
      onEdgesChange(
        template.edges.map((item) => ({ type: "add", item }) as const),
      );

      // Deferred so the added elements are measured before the viewport is
      // framed; fitting in the same tick would fit an empty canvas.
      requestAnimationFrame(() => {
        reactFlow.fitView({ duration: VIEWPORT_ANIMATION_DURATION });
      });
    },
    [edges, nodes, onEdgesChange, onNodesChange, reactFlow],
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
    </div>
  );
}

export function Canvas({ onImportReady }: CanvasImportHandle) {
  return (
    <ReactFlowProvider>
      <CanvasFlow onImportReady={onImportReady} />
    </ReactFlowProvider>
  );
}
