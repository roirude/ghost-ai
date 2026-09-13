import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { badRequest, unauthorized } from "@/lib/api-response";
import {
  DEFAULT_PROJECT_NAME,
  createProject,
  listProjects,
  parseProjectId,
  parseProjectName,
} from "@/lib/projects";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  return NextResponse.json({ projects: await listProjects(userId) });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body !== null && typeof body !== "object") {
    return badRequest("Request body must be an object.");
  }

  const name =
    parseProjectName((body as Record<string, unknown> | null)?.name) ??
    DEFAULT_PROJECT_NAME;
  const id = parseProjectId((body as Record<string, unknown> | null)?.id);

  const project = await createProject(userId, name, id);

  return NextResponse.json({ project }, { status: 201 });
}
