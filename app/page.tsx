import { redirect } from "next/navigation";

import { readAuthState } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const authState = await readAuthState();

  if (authState.status === "authenticated") {
    redirect("/dashboard");
  }

  redirect("/login");
}
