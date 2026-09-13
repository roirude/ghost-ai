import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-response";
import { parseEmail, removeCollaborator } from "@/lib/collaborators";
import { findProjectOwner } from "@/lib/projects";

interface RouteContext {
  params: Promise<{ projectId: string; email: string }>;
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  const { projectId, email: rawEmail } = await params;
  const email = parseEmail(decodeURIComponent(rawEmail));

  if (!email) {
    return badRequest("A non-empty email is required.");
  }

  const project = await findProjectOwner(projectId);

  if (!project) {
    return notFound();
  }

  if (project.ownerId !== userId) {
    return forbidden();
  }

  await removeCollaborator(projectId, email);

  return NextResponse.json({ success: true });
}
