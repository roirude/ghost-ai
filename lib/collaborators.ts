import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface CollaboratorInfo {
  email: string;
  name: string | null;
  imageUrl: string | null;
}

export function parseEmail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function listCollaborators(projectId: string) {
  return prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
}

export function addCollaborator(projectId: string, email: string) {
  return prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    update: {},
    create: { projectId, email },
  });
}

export function removeCollaborator(projectId: string, email: string) {
  return prisma.projectCollaborator.deleteMany({
    where: { projectId, email },
  });
}

export async function enrichCollaborators(
  emails: string[]
): Promise<CollaboratorInfo[]> {
  if (emails.length === 0) {
    return [];
  }

  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({
    emailAddress: emails,
    limit: emails.length,
  });

  const byEmail = new Map(
    users.flatMap((user) =>
      user.emailAddresses.map((address) => [
        address.emailAddress.toLowerCase(),
        user,
      ] as const)
    )
  );

  return emails.map((email) => {
    const user = byEmail.get(email);

    if (!user) {
      return { email, name: null, imageUrl: null };
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

    return {
      email,
      name: name.length > 0 ? name : null,
      imageUrl: user.imageUrl || null,
    };
  });
}
