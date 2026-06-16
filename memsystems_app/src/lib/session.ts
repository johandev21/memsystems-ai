import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getSession() {
  const headersList = await headers();
  return auth.api.getSession({ headers: headersList });
}
