import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { WorkspaceShell } from "@/components/editor/workspace-shell";
import {
  findProjectWithAccess,
  getCurrentIdentity,
  hasProjectAccess,
} from "@/lib/project-access";
import { listProjects, listSharedProjects } from "@/lib/projects";

interface WorkspacePageProps {
  params: Promise<{ roomId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const identity = await getCurrentIdentity();

  if (!identity) {
    redirect("/sign-in");
  }

  const { roomId } = await params;
  const project = await findProjectWithAccess(roomId);

  if (!project || !hasProjectAccess(project, identity)) {
    return <AccessDenied />;
  }

  const [owned, shared] = await Promise.all([
    listProjects(identity.userId),
    identity.email ? listSharedProjects(identity.email) : Promise.resolve([]),
  ]);

  const ownedProjects = owned.map((item) => ({
    id: item.id,
    name: item.name,
    isOwner: true,
  }));

  const sharedProjects = shared.map((item) => ({
    id: item.id,
    name: item.name,
    isOwner: false,
  }));

  return (
    <WorkspaceShell
      project={{ id: project.id, name: project.name, isOwner: project.ownerId === identity.userId }}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
