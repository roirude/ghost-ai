"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { slugify } from "@/lib/slug";
import type { Project } from "@/types/project";

type ProjectDialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null;

function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function useProjectActions(activeProjectId?: string) {
  const router = useRouter();
  const [dialog, setDialog] = useState<ProjectDialogState>(null);
  const [name, setName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slug = slugify(name);
  const roomId = slug ? `${slug}-${suffix}` : suffix;

  function openCreateDialog() {
    setName("");
    setSuffix(generateSuffix());
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

  async function createProject() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, name }),
      });

      if (!response.ok) {
        return;
      }

      closeDialog();
      router.push(`/editor/${roomId}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function renameProject() {
    if (dialog?.type !== "rename") {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${dialog.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        return;
      }

      closeDialog();
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteProject() {
    if (dialog?.type !== "delete") {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${dialog.project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        return;
      }

      const deletedActiveProject = dialog.project.id === activeProjectId;
      closeDialog();

      if (deletedActiveProject) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function submit() {
    if (dialog?.type === "create") {
      await createProject();
    } else if (dialog?.type === "rename") {
      await renameProject();
    } else if (dialog?.type === "delete") {
      await deleteProject();
    }
  }

  return {
    dialog,
    name,
    slug: roomId,
    isLoading,
    setName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submit,
  };
}
