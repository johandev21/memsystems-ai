import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/shared/ui/logo";
import { TypographyH1, TypographyLead } from "@/shared/ui/typography";
import { authClient } from "@/shared/auth";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      navigate({ to: "/home" });
    }
  }, [session, navigate]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center flex flex-col items-center">
        <Logo className="mb-6 size-16 text-foreground" />
        <TypographyH1 className="mb-4 text-5xl">memsystems</TypographyH1>
        <TypographyLead className="mb-8 text-lg">
          Your intelligent AI-powered research and study notebook system.
        </TypographyLead>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
