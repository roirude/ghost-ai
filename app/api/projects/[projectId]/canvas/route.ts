import { NextResponse } from "next/server";

import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-response";
import {
  loadCanvasSnapshot,
  parseCanvasSnapshot,
  saveCanvasSnapshot,
} from "@/lib/canvas-storage";
import {
  findProjectWithAccess,
  getCurrentIdentity,
  hasProjectAccess,
} from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();

  if (!identity) {
    return unauthorized();
  }

  const { projectId } = await params;
  const project = await findProjectWithAccess(projectId);

  if (!project) {
    return notFound();
  }

  if (!hasProjectAccess(project, identity)) {
    return forbidden();
  }

  return NextResponse.json({
    canvas: await loadCanvasSnapshot(project.canvasJsonPath),
  });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();

  if (!identity) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const snapshot = parseCanvasSnapshot(body);

  if (!snapshot) {
    return badRequest("A canvas payload with nodes and edges arrays is required.");
  }

  const { projectId } = await params;
  const project = await findProjectWithAccess(projectId);

  if (!project) {
    return notFound();
  }

  // Collaborators edit the canvas, so the save boundary is project access
  // rather than ownership — the same rule the Liveblocks room is issued under.
  if (!hasProjectAccess(project, identity)) {
    return forbidden();
  }

  return NextResponse.json({ url: await saveCanvasSnapshot(projectId, snapshot) });
}
