import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

// Response envelope per docs/API.md — every API returns { success, message?, data?, errors? }.

export function ok<T>(data: T, init?: { message?: string; status?: number }) {
  return NextResponse.json(
    { success: true, ...(init?.message ? { message: init.message } : {}), data },
    { status: init?.status ?? 200 },
  );
}

export function fail(
  message: string,
  status: number,
  errors?: Record<string, string[]>,
) {
  return NextResponse.json(
    { success: false, message, ...(errors ? { errors } : {}) },
    { status },
  );
}

export function validationError(error: ZodError) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    (errors[field] ??= []).push(issue.message);
  }
  return fail("Validation failed", 400, errors);
}

/** Catch-all for route handlers: AuthError → 401/403, anything else → 500. */
export function apiError(error: unknown, context: string) {
  if (error instanceof AuthError) return fail(error.message, error.status);
  console.error(`${context}:`, error);
  return serverError();
}

export const unauthorized = (message = "Not authenticated") => fail(message, 401);
export const forbidden = (message = "Access denied") => fail(message, 403);
export const notFound = (message = "Not found") => fail(message, 404);
export const serverError = (message = "Something went wrong.") => fail(message, 500);
