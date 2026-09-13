"use client";

import { AppDialog } from "@/components/editor/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  slug: string;
  isLoading: boolean;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  name,
  slug,
  isLoading,
  onNameChange,
  onSubmit,
}: CreateProjectDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create project"
      description="Start a new architecture workspace."
      footer={
        <Button onClick={onSubmit} disabled={!name.trim() || isLoading}>
          Create project
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
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
        <p className="text-sm text-copy-muted">
          {slug ? `ghost.ai/${slug}` : "Enter a name to see the project URL"}
        </p>
      </div>
    </AppDialog>
  );
}
