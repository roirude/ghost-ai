import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-response";
import {
  addCollaborator,
  enrichCollaborators,
  listCollaborators,
  parseEmail,
} from "@/lib/collaborators";
import { findProjectOwner } from "@/lib/projects";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  const { projectId } = await params;
  const project = await findProjectOwner(projectId);

  if (!project) {
    return notFound();
  }

  const collaborators = await listCollaborators(projectId);
  const enriched = await enrichCollaborators(collaborators.map((c) => c.email));

  return NextResponse.json({ collaborators: enriched });
}

export async function POST(request: Request, { params }: RouteContext) {
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

  const email = parseEmail((body as Record<string, unknown> | null)?.email);

  if (!email) {
    return badRequest("A non-empty email is required.");
  }

  const { projectId } = await params;
  const project = await findProjectOwner(projectId);

  if (!project) {
    return notFound();
  }

  if (project.ownerId !== userId) {
    return forbidden();
  }

  await addCollaborator(projectId, email);

  const collaborators = await listCollaborators(projectId);
  const enriched = await enrichCollaborators(collaborators.map((c) => c.email));

  return NextResponse.json({ collaborators: enriched }, { status: 201 });
}
