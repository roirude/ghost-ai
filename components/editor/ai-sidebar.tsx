"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Download, FileText, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Composer bounds. The textarea grows with its content between the two. */
const COMPOSER_MIN_HEIGHT = 72;
const COMPOSER_MAX_HEIGHT = 160;

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

/**
 * A single turn in the architect conversation. Local-only for now — nothing
 * leaves the component, since generation lands in a later unit.
 */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
          isUser
            ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
            : "border border-surface-border bg-bg-elevated text-accent-ai-text"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-bg-subtle">
        <Bot className="size-8 text-accent-ai" />
      </div>
      <p className="text-sm text-copy-muted">
        Describe the system you want and Ghost AI will draft an architecture on
        the canvas.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="rounded-xl bg-bg-subtle px-3 py-1.5 text-xs text-accent-ai-text transition-colors hover:bg-bg-elevated"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpecsTab() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button className="w-full bg-accent-ai text-white hover:bg-accent-ai/90">
        <Sparkles className="size-4" />
        Generate Spec
      </Button>

      {/* Static sample until spec generation is wired up. */}
      <div className="rounded-2xl border border-surface-border bg-bg-elevated p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
            <FileText className="size-4 text-accent-ai" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-copy-primary">
              E-commerce Backend Spec
            </h3>
            <p className="mt-1 text-xs text-copy-muted">
              Service boundaries for catalog, cart, and checkout, with an
              event-driven order pipeline and a shared Postgres store.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="mt-3 w-full"
          aria-label="Download spec"
        >
          <Download className="size-4" />
          Download
        </Button>
      </div>
    </div>
  );
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize: reset to the floor first so the measured scrollHeight
  // reflects the current text rather than the previous (taller) box.
  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    composer.style.height = `${COMPOSER_MIN_HEIGHT}px`;
    composer.style.height = `${Math.min(
      Math.max(composer.scrollHeight, COMPOSER_MIN_HEIGHT),
      COMPOSER_MAX_HEIGHT
    )}px`;
  }, [draft]);

  const send = useCallback(() => {
    const content = draft.trim();
    if (!content) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content },
    ]);
    setDraft("");
  }, [draft]);

  return (
    <aside
      className={cn(
        "absolute inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-surface-border bg-bg-surface/95 shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.7)] backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between gap-2 border-b border-surface-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="size-4 shrink-0 text-accent-ai" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-copy-primary">
              AI Workspace
            </h2>
            <p className="truncate text-xs text-copy-muted">
              Collaborate with Ghost AI
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="size-4" />
        </Button>
      </div>

      <Tabs
        defaultValue="architect"
        className="min-h-0 flex-1 gap-0 overflow-hidden"
      >
        <div className="px-4 py-3">
          <TabsList className="w-full bg-bg-subtle">
            <TabsTrigger
              value="architect"
              className="text-copy-muted data-[state=active]:bg-accent-ai/15 data-[state=active]:text-accent-ai"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="text-copy-muted data-[state=active]:bg-accent-ai/15 data-[state=active]:text-accent-ai"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="flex min-h-0 flex-col data-[state=inactive]:hidden"
        >
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 px-4 pb-4">
              {messages.length === 0 ? (
                <ChatEmptyState onSelectPrompt={setDraft} />
              ) : (
                messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-surface-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={composerRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  // Enter sends; Shift+Enter keeps the newline.
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                placeholder="Describe your system..."
                rows={1}
                style={{
                  minHeight: COMPOSER_MIN_HEIGHT,
                  maxHeight: COMPOSER_MAX_HEIGHT,
                }}
                className="min-h-0 flex-1 resize-none bg-bg-base"
              />
              <Button
                size="icon"
                onClick={send}
                disabled={draft.trim().length === 0}
                className="bg-accent-ai text-white hover:bg-accent-ai/90"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="specs"
          className="min-h-0 overflow-y-auto data-[state=inactive]:hidden"
        >
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
