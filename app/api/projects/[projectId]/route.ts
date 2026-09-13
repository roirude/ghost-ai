import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  badRequest,
  forbidden,
  notFound,
  unauthorized,
} from "@/lib/api-response";
import {
  deleteProject,
  findProjectOwner,
  parseProjectName,
  renameProject,
} from "@/lib/projects";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const name = parseProjectName((body as Record<string, unknown> | null)?.name);

  if (!name) {
    return badRequest("A non-empty project name is required.");
  }

  const { projectId } = await params;
  const existing = await findProjectOwner(projectId);

  if (!existing) {
    return notFound();
  }

  if (existing.ownerId !== userId) {
    return forbidden();
  }

  return NextResponse.json({ project: await renameProject(projectId, name) });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  const { projectId } = await params;
  const existing = await findProjectOwner(projectId);

  if (!existing) {
    return notFound();
  }

  if (existing.ownerId !== userId) {
    return forbidden();
  }

  await deleteProject(projectId);

  return NextResponse.json({ success: true });
}
