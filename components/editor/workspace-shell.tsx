"use client";

import { useCallback, useRef, useState } from "react";

import { CanvasRoom } from "@/components/editor/canvas-room";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { WorkspaceNavbar } from "@/components/editor/workspace-navbar";
import { useProjectActions } from "@/hooks/use-project-actions";
import { useShareDialog } from "@/hooks/use-share-dialog";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface WorkspaceShellProps {
  project: Project;
  ownedProjects: Project[];
  sharedProjects: Project[];
}

export function WorkspaceShell({
  project,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // The canvas publishes its import action here once the room is connected.
  // A ref rather than state on purpose: the shell only ever *calls* this, so
  // storing it in state would re-render the whole workspace on every canvas
  // edit (the callback's identity tracks the current node/edge lists).
  const importTemplateRef = useRef<((template: CanvasTemplate) => void) | null>(
    null,
  );

  const handleImportReady = useCallback(
    (importTemplate: (template: CanvasTemplate) => void) => {
      importTemplateRef.current = importTemplate;
    },
    [],
  );

  const handleImportTemplate = useCallback((template: CanvasTemplate) => {
    // Null only while the room is still suspended, in which case the navbar
    // button has not been reachable yet anyway.
    importTemplateRef.current?.(template);
  }, []);

  const {
    dialog,
    name,
    slug,
    isLoading,
    setName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submit,
  } = useProjectActions(project.id);
  const {
    collaborators,
    isLoading: isLoadingCollaborators,
    email,
    setEmail,
    isSubmitting: isInviting,
    error: shareError,
    isCopied,
    inviteCollaborator,
    removeCollaborator,
    copyProjectLink,
  } = useShareDialog(project.id, isShareOpen);

  return (
    <div className="fixed inset-0 flex flex-col bg-bg-base">
      <WorkspaceNavbar
        projectName={project.name}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
      />
      {/*
        The canvas owns this whole region and is never resized by chrome: the
        sidebars are absolutely positioned siblings that float over it, so the
        dotted background always runs edge to edge underneath them.
      */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-bg-base">
        <div className="absolute inset-0">
          <CanvasRoom roomId={project.id} onImportReady={handleImportReady} />
        </div>

        <ProjectSidebar
          isOpen={isSidebarOpen}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={project.id}
          onClose={() => setIsSidebarOpen(false)}
          onCreateProject={openCreateDialog}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
        />

        <aside
          className={cn(
            "absolute inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-surface-border bg-bg-surface/95 shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.7)] backdrop-blur-sm transition-transform duration-200 ease-out",
            isAiSidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
          aria-hidden={!isAiSidebarOpen}
        >
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <h2 className="text-sm font-semibold text-copy-primary">AI Assistant</h2>
          </div>
          <div className="flex flex-1 items-center justify-center px-4 text-center">
            <p className="text-sm text-copy-muted">AI chat coming soon</p>
          </div>
        </aside>
      </div>

      <CreateProjectDialog
        open={dialog?.type === "create"}
        onOpenChange={(open) => !open && closeDialog()}
        name={name}
        slug={slug}
        isLoading={isLoading}
        onNameChange={setName}
        onSubmit={submit}
      />

      <RenameProjectDialog
        open={dialog?.type === "rename"}
        onOpenChange={(open) => !open && closeDialog()}
        project={dialog?.type === "rename" ? dialog.project : null}
        name={name}
        isLoading={isLoading}
        onNameChange={setName}
        onSubmit={submit}
      />

      <DeleteProjectDialog
        open={dialog?.type === "delete"}
        onOpenChange={(open) => !open && closeDialog()}
        project={dialog?.type === "delete" ? dialog.project : null}
        isLoading={isLoading}
        onConfirm={submit}
      />

      <StarterTemplatesModal
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onImport={handleImportTemplate}
      />

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        isOwner={project.isOwner}
        collaborators={collaborators}
        isLoading={isLoadingCollaborators}
        email={email}
        onEmailChange={setEmail}
        isSubmitting={isInviting}
        error={shareError}
        isCopied={isCopied}
        onInvite={inviteCollaborator}
        onRemove={removeCollaborator}
        onCopyLink={copyProjectLink}
      />
    </div>
  );
}
