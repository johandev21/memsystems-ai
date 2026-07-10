import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/branding/logo";
import { TypographyH1, TypographyLead } from "@/components/ui/typography";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/home");

  const t = await getTranslations("Landing");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center flex flex-col items-center">
        <Logo className="mb-6 size-16 text-foreground" />
        <TypographyH1 className="mb-4 text-5xl">memsystems</TypographyH1>
        <TypographyLead className="mb-8 text-lg">
          {t("description")}
        </TypographyLead>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {t("getStarted")}
        </Link>
      </div>
    </div>
  );
}
