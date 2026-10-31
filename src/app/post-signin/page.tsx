import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { homeForRole } from "@/lib/permissions";

/** Routes a freshly signed-in user to onboarding or their home area. */
export default async function PostSignIn() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  if (!user.onboarded && user.role !== "ADMIN") redirect("/onboarding");
  redirect(homeForRole(user.role));
}
