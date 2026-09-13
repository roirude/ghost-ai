import type { Project } from "@/types/project";

export const MOCK_OWNED_PROJECTS: Project[] = [
  { id: "1", name: "Checkout Service", slug: "checkout-service", isOwner: true },
  { id: "2", name: "Notification Pipeline", slug: "notification-pipeline", isOwner: true },
];

export const MOCK_SHARED_PROJECTS: Project[] = [
  { id: "3", name: "Payments Gateway", slug: "payments-gateway", isOwner: false },
];

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
