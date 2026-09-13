import { auth, currentUser } from "@clerk/nextjs/server";

import { listProjects, listSharedProjects } from "@/lib/projects";

import { EditorShell } from "./editor-shell";

export default async function EditorPage() {
  const { userId } = await auth();

  if (!userId) {
    return <EditorShell ownedProjects={[]} sharedProjects={[]} />;
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const [owned, shared] = await Promise.all([
    listProjects(userId),
    email ? listSharedProjects(email) : Promise.resolve([]),
  ]);

  const ownedProjects = owned.map((project) => ({
    id: project.id,
    name: project.name,
    isOwner: true,
  }));

  const sharedProjects = shared.map((project) => ({
    id: project.id,
    name: project.name,
    isOwner: false,
  }));

  return <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects} />;
}
