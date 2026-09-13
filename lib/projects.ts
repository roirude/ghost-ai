import { prisma } from "@/lib/prisma";

export const DEFAULT_PROJECT_NAME = "Untitled Project";

export function parseProjectName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseProjectId(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function listProjects(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export function listSharedProjects(email: string) {
  return prisma.project.findMany({
    where: { collaborators: { some: { email } } },
    orderBy: { createdAt: "desc" },
  });
}

export function createProject(ownerId: string, name: string, id?: string) {
  return prisma.project.create({ data: { ...(id ? { id } : {}), ownerId, name } });
}

export function findProjectOwner(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
}

export function renameProject(projectId: string, name: string) {
  return prisma.project.update({ where: { id: projectId }, data: { name } });
}

export function deleteProject(projectId: string) {
  return prisma.project.delete({ where: { id: projectId } });
}
