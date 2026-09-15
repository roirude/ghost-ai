"use client";

import { useCallback, useEffect, useRef, type DragEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";

import { ShapeSurface } from "@/components/editor/shape-surface";
import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_TEXT_COLOR,
  DEFAULT_SHAPE_SIZES,
  type CanvasNodeShape,
} from "@/types/canvas";

/**
 * Opacity of the ghost, so the preview reads as a pending placement rather
 * than as a node that already exists.
 */
const GHOST_OPACITY = 0.75;

/**
 * Where inside the ghost the browser pinned the cursor, in the ghost's own
 * pixels. The drop handler needs exactly this to place the node where the ghost
 * was drawn, so it is returned rather than recomputed at the drop site.
 */
export interface ShapeGrabOffset {
  grabOffsetX: number;
  grabOffsetY: number;
}

interface ShapeDragPreview {
  /**
   * Renders the ghost and hands it to the browser as the drag image. Call from
   * `onDragStart`, before writing the drag payload. Returns the cursor's
   * position within the ghost, which belongs in that payload.
   */
  showPreview: (
    event: DragEvent<Element>,
    shape: CanvasNodeShape,
  ) => ShapeGrabOffset;
  /** Tears the ghost down. Call from `onDragEnd`. */
  hidePreview: () => void;
}

/**
 * Drives the ghost shown while a shape is dragged out of the shape panel.
 *
 * The ghost is the real `ShapeSurface` at the shape's default drop size,
 * rendered into an offscreen host that is handed to `setDragImage`. The browser
 * snapshots that element synchronously during `dragstart` and then keeps the
 * snapshot pinned to the cursor for the whole drag, including over the canvas
 * and outside the window — behaviour a manually positioned React overlay cannot
 * match, because HTML5 drag does not emit usable cursor coordinates in
 * `dragover` across browsers.
 */
export function useShapeDragPreview(): ShapeDragPreview {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<Root | null>(null);

  const hidePreview = useCallback(() => {
    const root = rootRef.current;
    const host = hostRef.current;

    rootRef.current = null;
    hostRef.current = null;

    if (!root || !host) return;

    // Unmounting synchronously inside a drag event would fight React's own
    // render phase, so defer the teardown by a tick.
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  }, []);

  // A drag that is abandoned by unmounting the panel must not leak its host.
  useEffect(() => hidePreview, [hidePreview]);

  const showPreview = useCallback(
    (event: DragEvent<Element>, shape: CanvasNodeShape) => {
      // A previous drag that ended without `dragend` (a cancelled drag in some
      // browsers) would otherwise leave its host behind.
      hidePreview();

      const { width, height } = DEFAULT_SHAPE_SIZES[shape];

      const host = document.createElement("div");
      host.style.position = "fixed";
      // Parked off-viewport: the element has to be in the document and laid out
      // for the browser to snapshot it, but must never be visible itself.
      host.style.top = "-10000px";
      host.style.left = "-10000px";
      host.style.width = `${width}px`;
      host.style.height = `${height}px`;
      host.style.opacity = String(GHOST_OPACITY);
      host.style.pointerEvents = "none";

      document.body.appendChild(host);

      const root = createRoot(host);

      // The snapshot is taken the moment `dragstart` returns, so the ghost has
      // to be in the DOM before then — `flushSync` makes the mount synchronous
      // instead of letting React schedule it for a later tick.
      flushSync(() => {
        root.render(
          <ShapeSurface
            shape={shape}
            width={width}
            height={height}
            color={DEFAULT_NODE_COLOR}
            textColor={DEFAULT_NODE_TEXT_COLOR}
            emphasized
          />,
        );
      });

      hostRef.current = host;
      rootRef.current = root;

      // Centered on the cursor. The same offset is handed back so the drop
      // handler subtracts precisely what `setDragImage` pinned, instead of
      // assuming a centring the ghost might not actually have used.
      const grabOffsetX = width / 2;
      const grabOffsetY = height / 2;

      event.dataTransfer.setDragImage(host, grabOffsetX, grabOffsetY);

      return { grabOffsetX, grabOffsetY };
    },
    [hidePreview],
  );

  return { showPreview, hidePreview };
}
