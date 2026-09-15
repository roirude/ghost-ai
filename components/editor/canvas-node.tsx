"use client";

import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { NodeColorToolbar } from "@/components/editor/node-color-toolbar";
import { ShapeSurface } from "@/components/editor/shape-surface";
import {
  DEFAULT_NODE_TEXT_COLOR,
  DEFAULT_SHAPE_SIZES,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  NODE_LABEL_PLACEHOLDER,
  type CanvasNode as CanvasNodeType,
  type CanvasNodeData,
} from "@/types/canvas";

/** Sides that expose a connection handle, per `context/ui-context.md`. */
const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const;

/**
 * Handles are hidden at rest and faded in on hover. `group-hover` on the node
 * wrapper drives it; React Flow's own `.react-flow__handle` styling is
 * overridden here so the dots read as small white pins on the dark canvas. The
 * border is `--bg-base` rather than the border token so each dot keeps a dark
 * ring even where it sits on top of a light node fill.
 */
const HANDLE_CLASS =
  "!size-2 !border !border-bg-base !bg-copy-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-20";

/**
 * Resize affordances. The corner handles are small filled squares rather than
 * React Flow's default blue dots, and the connecting lines are dropped to a
 * hairline so a selected node reads as outlined, not boxed in.
 */
const RESIZE_HANDLE_STYLE = {
  width: 8,
  height: 8,
  borderRadius: 2,
  border: "1px solid var(--bg-base)",
  background: "var(--accent-primary)",
} as const;

const RESIZE_LINE_STYLE = {
  borderWidth: 1,
  borderColor: "var(--accent-primary)",
  opacity: 0.35,
} as const;

/**
 * Shared typography for the label and its editor. Both have to agree exactly
 * or swapping the span for the textarea on double-click would shift the text.
 */
const LABEL_TEXT_CLASS = "text-center text-sm leading-snug break-words";

/**
 * Renderer for the `canvasNode` type. Shape drawing lives in `ShapeSurface`,
 * which the shape-panel drag ghost shares so a preview matches its drop.
 */
export function CanvasNode({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNodeType>) {
  // React Flow only reports measured width/height once a node has been laid
  // out; until then, fall back to the shape's default footprint so the SVG
  // geometry never has to be computed against `undefined`.
  const fallback = DEFAULT_SHAPE_SIZES[data.shape];
  const nodeWidth = width ?? fallback.width;
  const nodeHeight = height ?? fallback.height;

  const { updateNodeData } = useReactFlow<CanvasNodeType>();

  const [editRequested, setEditRequested] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Editing is derived rather than stored, so a node that loses selection
  // (clicking the canvas, another node taking focus, a delete) can't be left in
  // edit mode behind the scenes without an effect to tidy up after it.
  const editing = editRequested && Boolean(selected);

  // Focus and select on open. Doing it in an effect rather than via `autoFocus`
  // keeps the caret placement under our control: a fresh label starts empty, so
  // selecting the existing text lets a retype replace it in one keystroke.
  useEffect(() => {
    if (!editing) return;

    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.focus();
    textarea.select();
  }, [editing]);

  const onDoubleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    // React Flow uses double-click on a node to zoom-to-fit; editing wins.
    event.stopPropagation();
    setEditRequested(true);
  }, []);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      // `updateNodeData` merges into `data` and routes through the controlled
      // `onNodesChange` that `useLiveblocksFlow` owns, so each keystroke is a
      // Storage write — no local mirror of the label to keep in step.
      updateNodeData(id, { label: event.target.value } satisfies Partial<CanvasNodeData>);
    },
    [id, updateNodeData],
  );

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      // Blurring closes editing through `onBlur`, and returns focus handling to
      // the canvas so the next keystroke isn't swallowed by a detached input.
      event.currentTarget.blur();
      return;
    }

    // Arrow keys, Backspace and Delete are all canvas shortcuts at the
    // ReactFlow level; inside the textarea they have to stay as text editing.
    event.stopPropagation();
  }, []);

  const label = data.label;

  // Nodes created before the palette existed have no stored `textColor`;
  // falling back keeps them legible instead of rendering black-on-black.
  const textColor = data.textColor ?? DEFAULT_NODE_TEXT_COLOR;

  return (
    <div className="group relative h-full w-full">
      {selected ? (
        <NodeColorToolbar nodeId={id} activeColor={data.color} />
      ) : null}
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        handleStyle={RESIZE_HANDLE_STYLE}
        lineStyle={RESIZE_LINE_STYLE}
      />
      <ShapeSurface
        shape={data.shape}
        width={nodeWidth}
        height={nodeHeight}
        color={data.color}
        textColor={textColor}
        emphasized={selected}
      >
        {/*
          The label box is always present at full width so opening the editor
          swaps content in place instead of resizing the centered slot. While
          editing, the span stays mounted as an invisible sizer so the box keeps
          the height the text occupies and the textarea can stretch over it.
        */}
        <div
          className="relative w-full px-1"
          onDoubleClick={onDoubleClick}
          // `nodrag`/`nopan` are React Flow's own opt-outs: without them a
          // press inside the text starts a node drag or a canvas pan instead of
          // placing the caret or selecting a word.
          onPointerDown={editing ? stopPropagation : undefined}
        >
          <span
            className={`${LABEL_TEXT_CLASS} block whitespace-pre-wrap ${
              editing ? "invisible" : ""
            }`}
            // The placeholder is the label colour held back rather than a
            // muted token, so it stays readable on every palette fill.
            style={{ color: textColor, opacity: !editing && !label ? 0.5 : 1 }}
          >
            {/* A zero-width space keeps an empty, unplaceheld line from
                collapsing to zero height mid-edit. */}
            {editing ? label || "\u200b" : label || NODE_LABEL_PLACEHOLDER}
          </span>
          {editing ? (
            <textarea
              ref={textareaRef}
              value={label}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onBlur={() => setEditRequested(false)}
              rows={1}
              spellCheck={false}
              placeholder={NODE_LABEL_PLACEHOLDER}
              style={{ color: textColor }}
              className={`nodrag nopan ${LABEL_TEXT_CLASS} absolute inset-0 h-full w-full resize-none overflow-hidden border-0 bg-transparent p-0 whitespace-pre-wrap outline-none placeholder:opacity-50`}
            />
          ) : null}
        </div>
      </ShapeSurface>
      {/*
        Every side carries both a source and a target handle, so a drag can
        start at any of the four and finish at any of the four. A source-only
        handle is a valid connection *end* solely under `ConnectionMode.Loose`
        and only once React Flow has resolved a target for the drop, which is
        what left connections working reliably from the top alone; an explicit
        target per side removes that dependency.

        The two share a side, so the ids are suffixed by type: React Flow keys
        a handle by node id plus handle id plus type, and a bare position id on
        both would make the pair ambiguous to the edges that reference them.
      */}
      {HANDLE_POSITIONS.map((position) => (
        <Fragment key={position}>
          <Handle
            id={`${position}-source`}
            type="source"
            position={position}
            isConnectable
            className={HANDLE_CLASS}
          />
          <Handle
            id={`${position}-target`}
            type="target"
            position={position}
            isConnectable
            className={HANDLE_CLASS}
          />
        </Fragment>
      ))}
    </div>
  );
}

/** Keeps a press inside the open editor from reaching React Flow's drag/pan. */
function stopPropagation(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}
