import { Liveblocks } from "@liveblocks/node";

// Fixed palette; cursor colors are picked from it so a given user always shows
// up in the same color across rooms and sessions.
export const CURSOR_COLORS = [
  "#E57373",
  "#F06292",
  "#BA68C8",
  "#7986CB",
  "#64B5F6",
  "#4DD0E1",
  "#4DB6AC",
  "#81C784",
  "#FFD54F",
  "#FF8A65",
] as const;

/**
 * Maps a user ID to a palette color. Deterministic (djb2 over the ID) so the
 * same user keeps the same color without any stored state.
 */
export function getCursorColor(userId: string): string {
  let hash = 5381;

  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) + hash + userId.charCodeAt(i)) | 0;
  }

  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set.");
  }

  return new Liveblocks({ secret });
}

const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocks?: Liveblocks;
};

/**
 * The cached Liveblocks node client. Cached on `global` for the same reason as
 * the Prisma client: hot reloads and serverless warm starts reuse one client
 * instead of rebuilding it per request.
 *
 * Built on first use rather than at module load so that importing this module
 * (during `next build` page-data collection, for instance) does not require the
 * secret to be present.
 */
export function getLiveblocks(): Liveblocks {
  const client = globalForLiveblocks.liveblocks ?? createLiveblocksClient();
  globalForLiveblocks.liveblocks = client;
  return client;
}

/**
 * Ensures the room backing a project exists and that `userId` may write to it.
 * ID token auth requires rooms to be created up front with explicit
 * permissions, otherwise nobody can join them.
 *
 * The room is private by default and access is granted per user here, after the
 * caller has verified project access, so revoking a collaborator in the app
 * also revokes their ability to rejoin the room.
 */
export async function ensureProjectRoom(projectId: string, userId: string) {
  const liveblocks = getLiveblocks();

  const room = await liveblocks.getOrCreateRoom(projectId, {
    defaultAccesses: [],
    usersAccesses: { [userId]: ["room:write"] },
  });

  if (room.usersAccesses[userId]?.includes("room:write")) {
    return room;
  }

  return liveblocks.updateRoom(projectId, {
    usersAccesses: { [userId]: ["room:write"] },
  });
}
