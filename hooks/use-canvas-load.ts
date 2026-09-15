"use client";

import { useEffect, useRef, useState } from "react";
import type { NodeChange, EdgeChange } from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface UseCanvasLoadOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<CanvasEdge>[]) => void;
}

/**
 * Restores the last saved canvas into an empty Liveblocks room, once per mount.
 *
 * The room is the source of truth while anyone is connected, so a room that
 * already holds nodes or edges is left completely alone: replaying a snapshot
 * into live collaborative state would overwrite whatever the other peers are
 * working on. The snapshot only ever fills a room that has nothing in it —
 * typically the first person to reopen a project after everyone left.
 *
 * Returns `isLoaded`, which gates autosave: saving before the load settles
 * would write the empty pre-load canvas over the saved one.
 */
export function useCanvasLoad({
  projectId,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: UseCanvasLoadOptions) {
  const [isLoaded, setIsLoaded] = useState(false);

  // The decision is made against the room state at mount and never revisited,
  // so this effect runs exactly once regardless of how the graph changes.
  const hasRunRef = useRef(false);

  // Read through a ref so the current room contents are visible to a once-only
  // effect without becoming dependencies that would re-trigger it. Synced in
  // its own effect rather than during render, which React forbids for refs.
  const stateRef = useRef({ nodes, edges, onNodesChange, onEdgesChange });

  useEffect(() => {
    stateRef.current = { nodes, edges, onNodesChange, onEdgesChange };
  });

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    // An occupied room needs no restore, and must not get one.
    if (stateRef.current.nodes.length > 0 || stateRef.current.edges.length > 0) {
      setIsLoaded(true);
      return;
    }

    let ignore = false;

    (async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`);

        if (ignore || !response.ok) {
          return;
        }

        const data = await response.json();
        const canvas = data?.canvas as
          | { nodes: CanvasNode[]; edges: CanvasEdge[] }
          | null;

        if (ignore || !canvas) {
          return;
        }

        // Re-checked after the await: a peer may have joined and started
        // drawing, or imported a template, while the fetch was in flight.
        const current = stateRef.current;
        if (current.nodes.length > 0 || current.edges.length > 0) {
          return;
        }

        // Written through the controlled handlers `useLiveblocksFlow` owns, so
        // the restore is an ordinary Storage write that syncs to peers.
        current.onNodesChange(
          canvas.nodes.map((item) => ({ type: "add", item }) as const),
        );
        current.onEdgesChange(
          canvas.edges.map((item) => ({ type: "add", item }) as const),
        );
      } finally {
        if (!ignore) {
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [projectId]);

  return { isLoaded };
}
