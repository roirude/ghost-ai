import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
      <Lock className="size-8 text-copy-faint" />
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-copy-primary">Access denied</h1>
        <p className="text-sm text-copy-muted">
          You don&apos;t have access to this project.
        </p>
      </div>
      <Button asChild>
        <Link href="/editor">Back to projects</Link>
      </Button>
    </div>
  );
}
