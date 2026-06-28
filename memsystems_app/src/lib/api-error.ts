import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/lib/errors";

export function toErrorResponse(err: unknown) {
  if (err instanceof DomainError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    });
    return NextResponse.json({ error: details.join("; ") }, { status: 400 });
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
