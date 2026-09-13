"use client";

import { useCallback, useRef, type DragEvent } from "react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";

import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import {
  DEFAULT_NODE_COLOR,
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

const GRID_GAP = 24;

/** Dot colour — a lift off `--bg-base` rather than a visible grid line. */
const DOT_COLOR = "#26262e";

/**
 * An empty room has nothing to fit, so start at 1:1 on the origin instead of
 * letting `fitView` snap to an arbitrary zoom.
 */
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

function CanvasFlow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      nodes: { initial: INITIAL_NODES },
      edges: { initial: INITIAL_EDGES },
      suspense: true,
    });

  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();

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
        data: { label: "", color: DEFAULT_NODE_COLOR, shape },
      };

      onNodesChange([{ type: "add", item: node }]);
    },
    [createNodeId, onNodesChange, screenToFlowPosition],
  );

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
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
        <Controls
          showInteractive={false}
          className="rounded-xl border border-surface-border bg-bg-surface/95 shadow-lg backdrop-blur [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-copy-secondary [&_button:hover]:bg-bg-subtle [&_button:hover]:text-copy-primary [&_button_svg]:fill-current"
        />
        <MiniMap
          pannable
          zoomable
          className="!bg-bg-surface/95 overflow-hidden rounded-xl border border-surface-border shadow-lg backdrop-blur"
          maskColor="rgba(8, 8, 9, 0.6)"
          nodeColor={DEFAULT_NODE_COLOR}
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  );
}
