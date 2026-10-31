import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { ZodError } from "zod";
import { AuthError } from "@/lib/session";
import { UploadError } from "@/lib/storage";

export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Echo of submitted values so forms can repopulate after a server error. */
  values?: Record<string, string>;
  data?: Record<string, unknown>;
};

export const initialState: ActionState = {};

export function zodFail(error: ZodError, values?: Record<string, string>): ActionState {
  return { error: "Check the highlighted fields.", fieldErrors: error.flatten().fieldErrors as Record<string, string[]>, values };
}

export function formValues(fd: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")]));
}

/** Converts known errors into user-facing messages; logs and hides everything else. */
export function handleActionError(err: unknown): ActionState {
  unstable_rethrow(err);
  if (err instanceof AuthError || err instanceof UploadError) return { error: err.message };
  if (err instanceof Error && err.name === "UserFacingError") return { error: err.message };
  console.error("[action]", err);
  return { error: "Something went wrong on our side. Try again in a moment." };
}

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export function formString(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}
