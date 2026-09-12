"use client";

import { FolderOpen, Plus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      className={cn(
        "absolute top-3 left-3 bottom-3 z-40 flex w-72 flex-col rounded-2xl border border-surface-border bg-bg-surface/95 shadow-lg backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-[calc(100%+0.75rem)]"
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
          <X className="size-4" />
        </Button>
      </div>

      <Tabs defaultValue="my-projects" className="flex flex-1 flex-col overflow-hidden px-4 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>

        <TabsContent value="my-projects" className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <FolderOpen className="size-8 text-copy-faint" />
          <p className="text-sm text-copy-muted">No projects yet</p>
        </TabsContent>

        <TabsContent value="shared" className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Users className="size-8 text-copy-faint" />
          <p className="text-sm text-copy-muted">No shared projects yet</p>
        </TabsContent>
      </Tabs>

      <div className="border-t border-surface-border p-4">
        <Button className="w-full">
          <Plus className="size-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
