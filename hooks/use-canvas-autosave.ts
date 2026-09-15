"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * How long the canvas must be still before a save fires. Long enough that a
 * drag across the canvas collapses into one write instead of one per frame,
 * short enough that a user who stops editing and closes the tab has been saved.
 */
const AUTOSAVE_DEBOUNCE_MS = 1500;

/**
 * How long "Saved" and "Error" stay on the button before it falls back to its
 * resting "Save" label. Long enough to be read, short enough that the navbar
 * does not keep reporting the outcome of an edit the user has moved on from.
 */
const STATUS_RESET_MS = 2000;

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /**
   * Autosave stays parked until the initial load has settled. Saving before
   * then would persist the empty pre-load canvas over a real saved one.
   */
  enabled: boolean;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");

  // The last payload actually written. Compared against the current one so a
  // re-render that did not change the graph — a selection, a peer's cursor —
  // does not queue a redundant upload.
  const savedPayloadRef = useRef<string | null>(null);

  // Read through a ref so `save` keeps a stable identity: it is handed up to
  // the navbar, which must not re-render on every canvas edit just because the
  // graph it would save has changed.
  const graphRef = useRef({ nodes, edges });

  useEffect(() => {
    graphRef.current = { nodes, edges };
  });

  // Terminal statuses are transient. The timer is tracked so a save that
  // finishes while an earlier reset is pending cannot be wiped by it.
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settle = useCallback((next: "saved" | "error") => {
    setStatus(next);

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = setTimeout(() => {
      resetTimeoutRef.current = null;
      setStatus("idle");
    }, STATUS_RESET_MS);
  }, []);

  useEffect(
    () => () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    },
    [],
  );

  /**
   * Writes the current graph. Shared by the debounced autosave below and by the
   * navbar's Save button, so a manual save takes exactly the same path — and
   * updates the same baseline — as one the canvas fired for itself.
   */
  const save = useCallback(async () => {
    const { nodes: currentNodes, edges: currentEdges } = graphRef.current;
    const payload = JSON.stringify({ nodes: currentNodes, edges: currentEdges });

    setStatus("saving");

    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      if (!response.ok) {
        settle("error");
        return;
      }

      savedPayloadRef.current = payload;
      settle("saved");
    } catch {
      settle("error");
    }
  }, [projectId, settle]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const payload = JSON.stringify({ nodes, edges });

    // First enabled pass: adopt the loaded canvas as the baseline rather than
    // immediately re-saving what was just read back.
    if (savedPayloadRef.current === null) {
      savedPayloadRef.current = payload;
      return;
    }

    if (savedPayloadRef.current === payload) {
      return;
    }

    let ignore = false;

    const timeout = setTimeout(() => {
      if (ignore) {
        return;
      }

      void save();
    }, AUTOSAVE_DEBOUNCE_MS);

    // Every further edit within the debounce window cancels the pending save,
    // so only the settled state of the canvas is ever uploaded.
    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [edges, enabled, nodes, save]);

  return { status, save };
}
