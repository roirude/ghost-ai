"use client";

import { Check, Copy, X } from "lucide-react";

import { AppDialog } from "@/components/editor/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Collaborator } from "@/hooks/use-share-dialog";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  collaborators: Collaborator[];
  isLoading: boolean;
  email: string;
  onEmailChange: (email: string) => void;
  isSubmitting: boolean;
  error: string | null;
  isCopied: boolean;
  onInvite: () => void;
  onRemove: (email: string) => void;
  onCopyLink: () => void;
}

function collaboratorInitial(collaborator: Collaborator): string {
  return (collaborator.name ?? collaborator.email).charAt(0).toUpperCase();
}

export function ShareDialog({
  open,
  onOpenChange,
  isOwner,
  collaborators,
  isLoading,
  email,
  onEmailChange,
  isSubmitting,
  error,
  isCopied,
  onInvite,
  onRemove,
  onCopyLink,
}: ShareDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Share project"
      description={
        isOwner
          ? "Invite collaborators by email and manage access."
          : "People with access to this project."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="w-full justify-start" onClick={onCopyLink}>
            {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {isCopied ? "Copied!" : "Copy project link"}
          </Button>
        </div>

        {isOwner && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && email.trim() && !isSubmitting) {
                    onInvite();
                  }
                }}
                placeholder="Invite by email"
              />
              <Button onClick={onInvite} disabled={!email.trim() || isSubmitting}>
                Invite
              </Button>
            </div>
            {error && <p className="text-sm text-state-error">{error}</p>}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-copy-secondary">Collaborators</p>

          {isLoading ? (
            <p className="py-4 text-center text-sm text-copy-muted">Loading…</p>
          ) : collaborators.length > 0 ? (
            <div className="flex flex-col gap-1">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.email}
                  className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-bg-subtle"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {collaborator.imageUrl ? (
                      <img
                        src={collaborator.imageUrl}
                        alt=""
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-sm font-medium text-copy-secondary">
                        {collaboratorInitial(collaborator)}
                      </div>
                    )}
                    <div className="flex min-w-0 flex-col">
                      {collaborator.name && (
                        <span className="truncate text-sm text-copy-primary">
                          {collaborator.name}
                        </span>
                      )}
                      <span className="truncate text-xs text-copy-muted">
                        {collaborator.email}
                      </span>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => onRemove(collaborator.email)}
                      aria-label={`Remove ${collaborator.email}`}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-copy-muted">No collaborators yet</p>
          )}
        </div>
      </div>
    </AppDialog>
  );
}
