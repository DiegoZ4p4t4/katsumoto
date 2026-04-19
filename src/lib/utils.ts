import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildUpdatePayload<T extends Record<string, unknown>>(
  data: Partial<T>,
  allowedFields: readonly string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      result[field] = data[field];
    }
  }
  return result;
}
