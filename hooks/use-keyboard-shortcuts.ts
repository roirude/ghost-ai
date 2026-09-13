"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

/**
 * Matches the animation used by the on-screen zoom buttons, so a shortcut and
 * a click on the control bar move the viewport identically.
 */
const ZOOM_DURATION = 200;

/**
 * True while the event originated inside a field the user is typing in. Node
 * labels are edited in a `contentEditable` element rather than an `<input>`,
 * so an `isContentEditable` check is as load-bearing here as the tag check:
 * without it, typing `-` into a label would zoom the canvas out.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Binds the canvas zoom and history actions to the keyboard. Listens on
 * `window` rather than on the canvas element so the shortcuts work wherever
 * focus happens to sit, and bails out while the user is typing.
 */
export function useKeyboardShortcuts({
  reactFlow,
  undo,
  redo,
}: {
  reactFlow: Pick<ReactFlowInstance, "zoomIn" | "zoomOut"> | null;
  undo: () => void;
  redo: () => void;
}) {
  useEffect(() => {
    if (!reactFlow) return;

    function onKeyDown(event: KeyboardEvent) {
      if (!reactFlow) return;
      if (isEditableTarget(event.target)) return;

      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modifier) {
        if (key === "z") {
          event.preventDefault();
          // Shift turns the undo shortcut into the redo shortcut, which is the
          // platform convention on both macOS and Windows.
          if (event.shiftKey) redo();
          else undo();
          return;
        }

        if (key === "y") {
          event.preventDefault();
          redo();
        }

        return;
      }

      // `=` is the unshifted key that carries `+` on most layouts, so both
      // reach zoom in without forcing the user to hold shift.
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        reactFlow.zoomIn({ duration: ZOOM_DURATION });
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        reactFlow.zoomOut({ duration: ZOOM_DURATION });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reactFlow, redo, undo]);
}
