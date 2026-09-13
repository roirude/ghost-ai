import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-response";
import { ensureProjectRoom, getCursorColor, getLiveblocks } from "@/lib/liveblocks";
import {
  findProjectWithAccess,
  getCurrentIdentity,
  hasProjectAccess,
} from "@/lib/project-access";
import { parseProjectId } from "@/lib/projects";

export async function POST(request: Request) {
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

  // The Liveblocks client sends the room it wants to join; rooms are keyed by
  // project ID.
  const projectId = parseProjectId((body as Record<string, unknown> | null)?.room);

  if (!projectId) {
    return badRequest("A non-empty room is required.");
  }

  const project = await findProjectWithAccess(projectId);

  if (!project) {
    return notFound();
  }

  if (!hasProjectAccess(project, identity)) {
    return forbidden();
  }

  await ensureProjectRoom(projectId, identity.userId);

  const { status, body: token } = await getLiveblocks().identifyUser(
    identity.userId,
    {
      userInfo: {
        name: identity.name ?? identity.email ?? "Anonymous",
        avatar: identity.imageUrl ?? "",
        color: getCursorColor(identity.userId),
      },
    }
  );

  return new Response(token, { status });
}
