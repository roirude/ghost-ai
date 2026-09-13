"use client";

import { useState } from "react";

import { slugify } from "@/lib/mock-projects";
import type { Project } from "@/types/project";

type ProjectDialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null;

export function useProjectDialogs() {
  const [dialog, setDialog] = useState<ProjectDialogState>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = slugify(name);

  function openCreateDialog() {
    setName("");
    setDialog({ type: "create" });
  }

  function openRenameDialog(project: Project) {
    setName(project.name);
    setDialog({ type: "rename", project });
  }

  function openDeleteDialog(project: Project) {
    setDialog({ type: "delete", project });
  }

  function closeDialog() {
    setDialog(null);
    setName("");
    setIsLoading(false);
  }

  async function submit() {
    setIsLoading(true);
    try {
      // Mock only — no API calls or persistence yet.
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      closeDialog();
    }
  }

  return {
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
  };
}
