"use client";

import { AppDialog } from "@/components/editor/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/types/project";

interface RenameProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  name: string;
  isLoading: boolean;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

export function RenameProjectDialog({
  open,
  onOpenChange,
  project,
  name,
  isLoading,
  onNameChange,
  onSubmit,
}: RenameProjectDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Rename project"
      description={project ? `Renaming "${project.name}"` : undefined}
      footer={
        <Button onClick={onSubmit} disabled={!name.trim() || isLoading}>
          Save
        </Button>
      }
    >
      <Input
        autoFocus
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && name.trim() && !isLoading) {
            onSubmit();
          }
        }}
        placeholder="Project name"
      />
    </AppDialog>
  );
}
