"use client";

import { useCallback } from "react";

import { StarterTemplatePreview } from "@/components/editor/starter-template-preview";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the chosen template; the modal closes itself afterwards. */
  onImport: (template: CanvasTemplate) => void;
}

/**
 * Picker for the built-in template library. Composed directly from the dialog
 * primitives rather than through `AppDialog`, because the grid needs a wider,
 * height-capped content box than `AppDialog`'s fixed `max-w-lg` body allows.
 */
export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  const handleImport = useCallback(
    (template: CanvasTemplate) => {
      onImport(template);
      onOpenChange(false);
    },
    [onImport, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Starter templates</DialogTitle>
          <DialogDescription>
            Import a pre-built diagram to start from. This replaces everything
            currently on the canvas.
          </DialogDescription>
        </DialogHeader>

        {/*
          The grid scrolls rather than the dialog growing, so adding templates
          later never pushes the import buttons off-screen.
        */}
        <ScrollArea className="-mx-1 max-h-[60vh] px-1">
          <div className="grid grid-cols-1 gap-4 py-1 sm:grid-cols-2">
            {CANVAS_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-bg-surface p-3"
              >
                <StarterTemplatePreview template={template} />
                <div className="flex flex-1 flex-col gap-1">
                  <h3 className="text-sm font-medium text-copy-primary">
                    {template.name}
                  </h3>
                  <p className="text-sm text-copy-muted">
                    {template.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleImport(template)}
                >
                  Import
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
