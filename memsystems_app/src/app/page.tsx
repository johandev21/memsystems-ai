import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/home");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <h1 className="mb-4 font-heading text-5xl font-bold tracking-tight">
          memsystems
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          AI-powered study notebooks that help you learn faster with spaced
          repetition and intelligent assistance.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
