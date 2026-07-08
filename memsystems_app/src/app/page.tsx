import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/branding/logo";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/home");

  const t = await getTranslations("Landing");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="max-w-md text-center flex flex-col items-center">
        <Logo className="mb-6 size-16 text-foreground" />
        <h1 className="mb-4 font-heading text-5xl font-bold tracking-tight">
          memsystems
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">{t("description")}</p>
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
