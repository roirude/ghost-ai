import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CurrentIdentity {
  userId: string;
  email?: string;
  name?: string;
  imageUrl?: string;
}

export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return {
    userId,
    email,
    name: name.length > 0 ? name : undefined,
    imageUrl: user?.imageUrl,
  };
}

export function findProjectWithAccess(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: { collaborators: true },
  });
}

export function hasProjectAccess(
  project: { ownerId: string; collaborators: { email: string }[] },
  identity: CurrentIdentity
): boolean {
  if (project.ownerId === identity.userId) {
    return true;
  }

  return identity.email
    ? project.collaborators.some((collaborator) => collaborator.email === identity.email)
    : false;
}
