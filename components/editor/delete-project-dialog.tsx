"use client";

import { AppDialog } from "@/components/editor/app-dialog";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  isLoading: boolean;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  isLoading,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete project"
      description={
        project
          ? `This will permanently delete "${project.name}". This action cannot be undone.`
          : undefined
      }
      footer={
        <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
          Delete project
        </Button>
      }
    />
  );
}
