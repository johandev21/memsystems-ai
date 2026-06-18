"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-muted p-4">
            <FileQuestion className="size-10 text-muted-foreground" />
          </div>
        </div>
        <h1 className="mb-2 font-heading text-4xl font-bold tracking-tight">
          404
        </h1>
        <p className="mb-2 text-lg font-medium">Page not found</p>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    </div>
  );
}
