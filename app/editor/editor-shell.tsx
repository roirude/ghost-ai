"use client";

import { useState } from "react";

import { CreateProjectDialog } from "@/components/editor/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog";
import { EditorHome } from "@/components/editor/editor-home";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { Project } from "@/types/project";

interface EditorShellProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
  activeProjectId?: string;
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
  activeProjectId,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  } = useProjectActions(activeProjectId);

  return (
    <div className="fixed inset-0 flex flex-col bg-bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={isSidebarOpen}
          ownedProjects={ownedProjects}
          sharedProjects={sharedProjects}
          activeProjectId={activeProjectId}
          onClose={() => setIsSidebarOpen(false)}
          onCreateProject={openCreateDialog}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
        />
        <EditorHome onCreateProject={openCreateDialog} />
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
    </div>
  );
}
