"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  DEFAULT_EDGE_COLOR,
  EDGE_ACTIVE_OPACITY,
  EDGE_INTERACTION_WIDTH,
  EDGE_LABEL_PLACEHOLDER,
  EDGE_REST_OPACITY,
  EDGE_STROKE_WIDTH,
  type CanvasEdge as CanvasEdgeType,
  type CanvasEdgeData,
} from "@/types/canvas";

/** Corner rounding on the right-angle path. Matches the node radius scale. */
const EDGE_BORDER_RADIUS = 8;

/**
 * Shared typography for the label badge and its editor. Both have to agree
 * exactly, or swapping the badge for the input on double-click would shift the
 * text — the same constraint the node label editor works under.
 */
const LABEL_TEXT_CLASS = "text-[11px] leading-none";

/**
 * Renderer for the `canvasEdge` type. Routing is orthogonal (`getSmoothStepPath`
 * with rounded corners), the line is dimmed at rest and brightened when hovered
 * or selected, and the label is an inline editor opened by double-click.
 */
export function CanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
  data,
}: EdgeProps<CanvasEdgeType>) {
  // `labelX`/`labelY` are the path midpoint the same call computes for the
  // rendered geometry, so the badge tracks the actual route — including the
  // corner offsets — instead of a midpoint guessed from the endpoints.
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: EDGE_BORDER_RADIUS,
  });

  const { updateEdgeData } = useReactFlow<never, CanvasEdgeType>();

  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = data?.label ?? "";

  // An edge is "active" when it is hovered or selected: that is what lifts the
  // stroke out of its resting dim and what reveals the empty-label hint.
  const active = hovered || Boolean(selected);

  // Editing is only meaningful while the edge is still on the canvas and
  // reachable; losing activity (the pointer leaves and selection moves on)
  // should not strand an open editor, so close it.
  useEffect(() => {
    if (!editing) return;

    const input = inputRef.current;

    if (!input) return;

    input.focus();
    input.select();
  }, [editing]);

  const onDoubleClick = useCallback((event: MouseEvent) => {
    // React Flow binds double-click on the pane to zoom; editing wins.
    event.stopPropagation();
    setEditing(true);
  }, []);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      // `updateEdgeData` merges into `data` and routes through the controlled
      // `onEdgesChange` that `useLiveblocksFlow` owns, so each keystroke is a
      // Storage write — no local mirror of the label to keep in step. This is
      // the same path `updateNodeData` takes for node labels.
      updateEdgeData(id, { label: event.target.value } satisfies Partial<CanvasEdgeData>);
    },
    [id, updateEdgeData],
  );

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      // Blurring closes editing through `onBlur` and hands focus back to the
      // canvas, so the next keystroke isn't swallowed by a detached input.
      event.currentTarget.blur();
      return;
    }

    // Backspace, Delete and the arrow keys are all canvas shortcuts at the
    // ReactFlow level; inside the input they have to stay as text editing.
    event.stopPropagation();
  }, []);

  const color = data?.color ?? DEFAULT_EDGE_COLOR;

  const showLabel = editing || label.length > 0 || active;

  return (
    <>
      {/*
        The pointer handlers sit on a wrapping `<g>` rather than on `BaseEdge`:
        `BaseEdge` spreads its props onto the *visible* path only, so handlers
        passed to it would fire just on the 1.5px line and the wide interaction
        path underneath would be inert — exactly the easy-hover the spec asks
        for. Wrapping covers both paths.
      */}
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={onDoubleClick}
      >
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          // A wide transparent companion path is React Flow's own mechanism
          // for an easy hover/click target: it widens what the pointer can
          // reach without touching the rendered stroke width.
          interactionWidth={EDGE_INTERACTION_WIDTH}
          style={{
            ...style,
            stroke: color,
            strokeWidth: EDGE_STROKE_WIDTH,
            strokeLinecap: "round",
            opacity: active ? EDGE_ACTIVE_OPACITY : EDGE_REST_OPACITY,
            transition: "opacity 150ms ease",
          }}
        />
      </g>
      {showLabel ? (
        <EdgeLabelRenderer>
          {/*
            `EdgeLabelRenderer` portals into a single non-transformed overlay
            above the canvas, so the label is plain DOM — styled text and a real
            input rather than SVG — positioned by the transform below.
          */}
          <div
            className="nodrag nopan absolute origin-center"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              // The overlay is click-through by default; only the badge itself
              // takes pointer events, so the rest of the canvas stays reachable.
              pointerEvents: "all",
            }}
            // Without this a press on the badge reaches the pane underneath and
            // starts a canvas pan instead of placing the caret.
            onPointerDown={stopPropagation}
            onDoubleClick={onDoubleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {editing ? (
              <span className="relative inline-block">
                {/*
                  An invisible sizer carrying the same text and typography is
                  what makes the input grow with its content: the input is
                  stretched over it, so the badge is always exactly as wide as
                  what has been typed.
                */}
                <span
                  className={`${LABEL_TEXT_CLASS} invisible block rounded-full border border-surface-border px-2 py-1 whitespace-pre`}
                >
                  {label || EDGE_LABEL_PLACEHOLDER}
                </span>
                <input
                  ref={inputRef}
                  value={label}
                  onChange={onChange}
                  onKeyDown={onKeyDown}
                  onBlur={() => setEditing(false)}
                  spellCheck={false}
                  placeholder={EDGE_LABEL_PLACEHOLDER}
                  className={`nodrag nopan ${LABEL_TEXT_CLASS} absolute inset-0 h-full w-full rounded-full border border-brand bg-bg-surface px-2 py-1 text-center text-copy-primary outline-none placeholder:text-copy-muted`}
                />
              </span>
            ) : label ? (
              <span
                className={`${LABEL_TEXT_CLASS} block cursor-text rounded-full border border-surface-border bg-bg-surface/95 px-2 py-1 whitespace-pre text-copy-secondary shadow-sm backdrop-blur`}
              >
                {label}
              </span>
            ) : (
              // Active but unlabelled: a faint prompt that this edge can carry
              // one, held back far enough not to compete with real labels.
              <span
                className={`${LABEL_TEXT_CLASS} block cursor-text rounded-full border border-dashed border-surface-border/70 px-2 py-1 whitespace-pre text-copy-muted opacity-60`}
              >
                {EDGE_LABEL_PLACEHOLDER}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

/** Keeps a press on the label from reaching React Flow's pan/drag handling. */
function stopPropagation(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}
