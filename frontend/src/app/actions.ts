"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export async function setUserLocale(locale: string) {
  await getSession();
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 31536000, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
