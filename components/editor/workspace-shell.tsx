"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { CanvasRoom } from "@/components/editor/canvas-room";
import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { ShareDialog } from "@/components/editor/share-dialog";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { WorkspaceNavbar } from "@/components/editor/workspace-navbar";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { useProjectActions } from "@/hooks/use-project-actions";
import { useShareDialog } from "@/hooks/use-share-dialog";
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
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("idle");

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

  // Same boundary, same reasoning as the import action above: the Save button
  // sits in the navbar, outside the room, while the save itself belongs to the
  // autosave hook inside it.
  const saveRef = useRef<(() => void) | null>(null);

  const handleSaveReady = useCallback((save: () => void) => {
    saveRef.current = save;
  }, []);

  const handleSave = useCallback(() => {
    // Null only while the room is still suspended, in which case there is no
    // canvas on screen for the button to have been clicked over.
    saveRef.current?.();
  }, []);

  // Closing here rather than on the destination's mount: the sidebar floats
  // over the canvas, so leaving it open would cover the project just opened.
  const handleSelectProject = useCallback(
    (selected: Project) => {
      setIsSidebarOpen(false);

      if (selected.id !== project.id) {
        router.push(`/editor/${selected.id}`);
      }
    },
    [project.id, router],
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
        saveStatus={saveStatus}
        onSave={handleSave}
      />
      {/*
        The canvas owns this whole region and is never resized by chrome: the
        sidebars are absolutely positioned siblings that float over it, so the
        dotted background always runs edge to edge underneath them.
      */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-bg-base">
        <div className="absolute inset-0">
          <CanvasRoom
            roomId={project.id}
            projectId={project.id}
            onImportReady={handleImportReady}
            onSaveStatusChange={setSaveStatus}
            onSaveReady={handleSaveReady}
          />
        </div>

        <ProjectSidebar
          isOpen={isSidebarOpen}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={project.id}
          onClose={() => setIsSidebarOpen(false)}
          onSelectProject={handleSelectProject}
          onCreateProject={openCreateDialog}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
        />

        <AiSidebar
          isOpen={isAiSidebarOpen}
          onClose={() => setIsAiSidebarOpen(false)}
        />
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
