"use client";

import { shallow, useOthers } from "@liveblocks/react/suspense";
import { ViewportPortal } from "@xyflow/react";

interface RemoteCursor {
  connectionId: number;
  name: string;
  color: string;
  x: number;
  y: number;
}

/**
 * A single remote pointer with its name badge. Positioned in canvas
 * coordinates; the surrounding `ViewportPortal` applies React Flow's pan/zoom
 * transform, so the cursor stays pinned to the point its owner is hovering.
 */
function Cursor({ name, color, x, y }: Omit<RemoteCursor, "connectionId">) {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 select-none"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden
        className="block drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
      >
        <path
          d="M2 1.5 L14.5 8.6 L8.6 9.8 L6.2 15.4 Z"
          fill={color}
          stroke="#08080a"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span
        // Tucked under the pointer's tail so the badge reads as attached to it.
        className="absolute top-4 left-3.5 max-w-32 truncate rounded-xl px-1.5 py-0.5 text-[11px] leading-tight font-medium whitespace-nowrap text-[#08080a]"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

/**
 * Live cursors for every other participant in the room.
 *
 * `useOthers` only ever yields *other* connections, so the current user's own
 * cursor is excluded by construction — their real pointer already stands in
 * for it. Entries with a `null` cursor (pointer off-canvas) are dropped.
 */
export function CanvasCursors() {
  const cursors = useOthers(
    (others) =>
      others.flatMap<RemoteCursor>((other) =>
        other.presence.cursor
          ? [
              {
                connectionId: other.connectionId,
                name: other.info.name,
                color: other.info.color,
                x: other.presence.cursor.x,
                y: other.presence.cursor.y,
              },
            ]
          : [],
      ),
    // Cursor updates arrive many times a second; `shallow` keeps the render to
    // the frames where a coordinate actually changed.
    shallow,
  );

  return (
    <ViewportPortal>
      {cursors.map(({ connectionId, ...cursor }) => (
        <Cursor key={connectionId} {...cursor} />
      ))}
    </ViewportPortal>
  );
}
