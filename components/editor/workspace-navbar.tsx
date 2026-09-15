"use client";

import {
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
  Sparkles,
} from "lucide-react";

import { SaveStatusButton } from "@/components/editor/save-status-button";
import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { cn } from "@/lib/utils";

interface WorkspaceNavbarProps {
  projectName: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isAiSidebarOpen: boolean;
  onToggleAiSidebar: () => void;
  onOpenShare: () => void;
  onOpenTemplates: () => void;
  saveStatus: CanvasSaveStatus;
  /** Manual save, routed through the same function the autosave hook uses. */
  onSave: () => void;
}

export function WorkspaceNavbar({
  projectName,
  isSidebarOpen,
  onToggleSidebar,
  isAiSidebarOpen,
  onToggleAiSidebar,
  onOpenShare,
  onOpenTemplates,
  saveStatus,
  onSave,
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
        <SaveStatusButton status={saveStatus} onSave={onSave} />
        <Button variant="ghost" size="sm" onClick={onOpenTemplates}>
          <LayoutTemplate className="size-4" />
          Templates
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenShare}>
          <Share2 className="size-4" />
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAiSidebar}
          aria-expanded={isAiSidebarOpen}
          aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
          className={cn(
            "border-accent-ai/40 text-accent-ai-text hover:bg-accent-ai/10",
            isAiSidebarOpen && "border-accent-ai bg-accent-ai/15"
          )}
        >
          <Sparkles className="size-4" />
          AI
        </Button>
      </div>
    </nav>
  );
}
