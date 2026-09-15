import { get, put } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

/**
 * The canvas snapshot shape written to Vercel Blob. Versioned so a future
 * schema change can be recognised on read rather than silently misparsed.
 */
export interface CanvasSnapshot {
  version: 1;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export const CANVAS_SNAPSHOT_VERSION = 1;

/** Blob key for a project's canvas, per the storage model in the architecture context. */
export function canvasBlobPath(projectId: string): string {
  return `canvas/${projectId}.json`;
}

/**
 * Narrows a canvas payload arriving from the editor. Only the envelope is
 * checked — nodes and edges are React Flow objects whose full shape belongs to
 * the canvas renderer, not to this boundary — but an outright malformed body is
 * rejected before anything is uploaded.
 */
export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const { nodes, edges } = value as Record<string, unknown>;

  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return null;
  }

  return {
    version: CANVAS_SNAPSHOT_VERSION,
    nodes: nodes as CanvasNode[],
    edges: edges as CanvasEdge[],
  };
}

/**
 * Uploads the snapshot to Vercel Blob and records the returned URL on the
 * project. `allowOverwrite` keeps every save for a project at one stable key
 * instead of accumulating a new blob per autosave, and `addRandomSuffix: false`
 * is what makes that key predictable in the first place.
 *
 * Access is `private`: the configured store is a private one, which rejects a
 * public write outright. It is also the right level for this data — a canvas
 * belongs to its project's members, and a public blob URL would be readable by
 * anyone holding the link, bypassing the access checks on the route above.
 * Private blobs are not readable by a plain `fetch`, so reads go through the
 * SDK's `get` rather than the stored URL.
 */
export async function saveCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot
): Promise<string> {
  const blob = await put(
    canvasBlobPath(projectId),
    JSON.stringify(snapshot),
    {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    }
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return blob.url;
}

/**
 * Reads the saved snapshot for a project, or null when the project has never
 * been saved. A blob URL that no longer resolves is treated as "nothing saved"
 * rather than an error: the editor's only sensible response either way is to
 * start from an empty canvas.
 */
export async function loadCanvasSnapshot(
  canvasJsonPath: string | null
): Promise<CanvasSnapshot | null> {
  if (!canvasJsonPath) {
    return null;
  }

  // Read through the SDK rather than fetching the URL: the store is private, so
  // the stored URL carries no credentials and a bare fetch would be refused.
  // `useCache: false` for the same reason the key is stable — every save
  // overwrites one pathname, so a CDN-cached copy would be a stale canvas.
  const result = await get(canvasJsonPath, {
    access: "private",
    useCache: false,
  });

  if (!result?.stream) {
    return null;
  }

  return parseCanvasSnapshot(
    await new Response(result.stream).json()
  );
}
