import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
}

export function apiError(status: number, error: string) {
  return NextResponse.json<ApiErrorBody>({ error }, { status });
}

export const unauthorized = () => apiError(401, "Unauthorized");
export const forbidden = () => apiError(403, "Forbidden");
export const notFound = () => apiError(404, "Not found");
export const badRequest = (message: string) => apiError(400, message);
