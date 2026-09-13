"use client";

import { UserButton } from "@clerk/nextjs";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface WorkspaceNavbarProps {
  projectName: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isAiSidebarOpen: boolean;
  onToggleAiSidebar: () => void;
  onOpenShare: () => void;
}

export function WorkspaceNavbar({
  projectName,
  isSidebarOpen,
  onToggleSidebar,
  isAiSidebarOpen,
  onToggleAiSidebar,
  onOpenShare,
}: WorkspaceNavbarProps) {
  return (
    <nav className="flex h-14 w-full shrink-0 items-center justify-between border-b border-surface-border bg-bg-surface px-3">
      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="size-5" />
          ) : (
            <PanelLeftOpen className="size-5" />
          )}
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span className="truncate text-sm font-medium text-copy-primary">
          {projectName}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onOpenShare}>
          <Share2 className="size-4" />
          Share
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleAiSidebar}
          aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
        >
          {isAiSidebarOpen ? (
            <PanelRightClose className="size-5" />
          ) : (
            <PanelRightOpen className="size-5" />
          )}
        </Button>
        <UserButton />
      </div>
    </nav>
  );
}
