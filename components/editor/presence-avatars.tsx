"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { shallow, useOthers } from "@liveblocks/react/suspense";

/**
 * Collaborator avatars are capped so the stack never overruns the canvas
 * chrome; everyone past this point is summarised by the overflow chip.
 */
const MAX_VISIBLE_AVATARS = 5;

/** Shared avatar diameter, so collaborators and the Clerk button match. */
const AVATAR_SIZE_CLASS = "size-8";

interface Collaborator {
  connectionId: number;
  name: string;
  avatar: string;
  color: string;
}

/**
 * First letter of the collaborator's name, used when they have no photo.
 * Falls back to "?" for an empty or whitespace-only name.
 */
function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function CollaboratorAvatar({ name, avatar, color }: Collaborator) {
  return (
    <div
      title={name}
      // Display-only: no button, no handlers, and inert to the pointer so the
      // stack never intercepts a click meant for the canvas underneath.
      aria-hidden
      className={`${AVATAR_SIZE_CLASS} pointer-events-none -ml-2 flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-elevated text-xs font-medium text-copy-secondary ring-2 ring-bg-surface first:ml-0`}
      style={{ boxShadow: `inset 0 0 0 1.5px ${color}` }}
    >
      {avatar ? (
        // Clerk avatar URLs are external and unbounded, so `next/image` would
        // need a remote pattern per Clerk host for no benefit at this size.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="size-full object-cover" />
      ) : (
        initial(name)
      )}
    </div>
  );
}

/**
 * Room participants shown in the top-right of the editor canvas.
 *
 * The Liveblocks list is filtered against the signed-in Clerk user so the
 * current user is never drawn twice: collaborators come from presence, and the
 * current user is represented solely by Clerk's own `UserButton`.
 */
export function PresenceAvatars() {
  const { user } = useUser();
  const currentUserId = user?.id;

  const collaborators = useOthers(
    (others) =>
      others
        .filter((other) => other.id !== undefined && other.id !== currentUserId)
        .map<Collaborator>((other) => ({
          connectionId: other.connectionId,
          name: other.info.name,
          avatar: other.info.avatar,
          color: other.info.color,
        })),
    // Without `shallow` this selector allocates a new array on every presence
    // update — which is every cursor move in the room.
    shallow,
  );

  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = collaborators.length - visible.length;

  return (
    <div className="pointer-events-none absolute top-4 right-4 z-20">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border bg-bg-surface/95 p-1.5 shadow-lg backdrop-blur">
        {visible.length > 0 && (
          <div className="flex items-center">
            {visible.map((collaborator) => (
              <CollaboratorAvatar
                key={collaborator.connectionId}
                {...collaborator}
              />
            ))}
            {overflow > 0 && (
              <div
                aria-hidden
                className={`${AVATAR_SIZE_CLASS} pointer-events-none -ml-2 flex shrink-0 items-center justify-center rounded-full bg-bg-elevated text-xs font-medium text-copy-muted ring-2 ring-bg-surface`}
              >
                +{overflow}
              </div>
            )}
          </div>
        )}

        {/* Only earns its place once there is something to separate. */}
        {visible.length > 0 && (
          <div
            aria-hidden
            className="h-5 w-px shrink-0 bg-surface-border"
          />
        )}

        <div className={`${AVATAR_SIZE_CLASS} flex shrink-0 items-center justify-center`}>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "size-8",
                userButtonTrigger: "rounded-full",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
