"use client";

import { useEffect, useState } from "react";

export interface Collaborator {
  email: string;
  name: string | null;
  imageUrl: string | null;
}

export function useShareDialog(projectId: string, isOpen: boolean) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let ignore = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/projects/${projectId}/collaborators`);

        if (!ignore && response.ok) {
          const data = await response.json();
          setCollaborators(data.collaborators);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isOpen, projectId]);

  async function inviteCollaborator() {
    const trimmed = email.trim();

    if (!trimmed) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Failed to invite collaborator.");
        return;
      }

      const data = await response.json();
      setCollaborators(data.collaborators);
      setEmail("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeCollaborator(targetEmail: string) {
    setError(null);
    const response = await fetch(
      `/api/projects/${projectId}/collaborators/${encodeURIComponent(targetEmail)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Failed to remove collaborator.");
      return;
    }

    setCollaborators((current) => current.filter((c) => c.email !== targetEmail));
  }

  async function copyProjectLink() {
    const url = `${window.location.origin}/editor/${projectId}`;
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return {
    collaborators,
    isLoading,
    email,
    setEmail,
    isSubmitting,
    error,
    isCopied,
    inviteCollaborator,
    removeCollaborator,
    copyProjectLink,
  };
}
