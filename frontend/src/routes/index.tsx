import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/shared/ui/logo";
import { TypographyH1, TypographyLead } from "@/shared/ui/typography";
import { authClient, redirectIfAuthenticated } from "@/shared/auth";

export const Route = createFileRoute("/")({
  beforeLoad: redirectIfAuthenticated,
  component: LandingPage,
});

function LandingPage() {
  const { isPending } = authClient.useSession();


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
        <TypographyH1 className="mb-4 text-5xl">Memsystems</TypographyH1>
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
