"use client";

import { FolderOpen, Pencil, Plus, Trash2, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectSidebarProps {
  isOpen: boolean;
  ownedProjects: Project[];
  sharedProjects: Project[];
  activeProjectId?: string;
  onClose: () => void;
  onCreateProject: () => void;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

interface ProjectListItemProps {
  project: Project;
  isActive: boolean;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function ProjectListItem({ project, isActive, onRename, onDelete }: ProjectListItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-xl px-2 py-2 hover:bg-bg-subtle",
        isActive && "bg-bg-subtle ring-1 ring-inset ring-brand"
      )}
    >
      <span className="truncate text-sm text-copy-primary">{project.name}</span>
      {project.isOwner && (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onRename(project)}
            aria-label={`Rename ${project.name}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onDelete(project)}
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function ProjectSidebar({
  isOpen,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  onClose,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/*
        Anchored to the edge rather than inset, so the closed state is a plain
        -100% slide that leaves nothing — shadow or rounded corner — on screen.
      */}
      <aside
        className={cn(
          "absolute inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-surface-border bg-bg-surface/95 shadow-[8px_0_24px_-12px_rgba(0,0,0,0.7)] backdrop-blur-sm transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
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

          <TabsContent value="my-projects" className="flex flex-1 flex-col overflow-y-auto">
            {ownedProjects.length > 0 ? (
              <div className="flex flex-col gap-1 py-2">
                {ownedProjects.map((project) => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    isActive={project.id === activeProjectId}
                    onRename={onRenameProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <FolderOpen className="size-8 text-copy-faint" />
                <p className="text-sm text-copy-muted">No projects yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="flex flex-1 flex-col overflow-y-auto">
            {sharedProjects.length > 0 ? (
              <div className="flex flex-col gap-1 py-2">
                {sharedProjects.map((project) => (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    isActive={project.id === activeProjectId}
                    onRename={onRenameProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <Users className="size-8 text-copy-faint" />
                <p className="text-sm text-copy-muted">No shared projects yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border p-4">
          <Button className="w-full" onClick={onCreateProject}>
            <Plus className="size-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}
