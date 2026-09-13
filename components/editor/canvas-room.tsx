"use client";

import { Component, type ReactNode } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

import { Canvas, type CanvasImportHandle } from "@/components/editor/canvas";

interface CanvasRoomProps extends CanvasImportHandle {
  roomId: string;
}

function CanvasMessage({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-base">
      <p className="text-sm text-copy-muted">{children}</p>
    </div>
  );
}

interface CanvasErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * Catches Liveblocks connection failures so a dropped room doesn't take the
 * whole workspace down with it.
 */
class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function CanvasRoom({ roomId, onImportReady }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <CanvasErrorBoundary
          fallback={
            <CanvasMessage>
              Could not connect to this canvas. Try reloading the page.
            </CanvasMessage>
          }
        >
          <ClientSideSuspense
            fallback={<CanvasMessage>Loading canvas…</CanvasMessage>}
          >
            <Canvas onImportReady={onImportReady} />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
