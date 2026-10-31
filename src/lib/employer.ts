import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/session";

/** For employer pages: the signed-in employer and their company (redirects if missing). */
export async function employerPageContext() {
  const user = await requirePageUser(["EMPLOYER"]);
  const profile = await db.employerProfile.findUnique({ where: { userId: user.id }, include: { company: true } });
  if (!profile?.company) redirect("/onboarding");
  return { user, profile, company: profile.company };
}

export async function jobFormOptions() {
  const [categories, locations] = await Promise.all([
    db.jobCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.location.findMany({ where: { isActive: true }, orderBy: [{ country: "desc" }, { city: "asc" }], select: { id: true, city: true, country: true } }),
  ]);
  return {
    categories: categories.map((c) => ({ id: c.id, label: c.name })),
    locations: locations.map((l) => ({ id: l.id, label: l.country === "Uganda" ? l.city : `${l.city}, ${l.country}` })),
  };
}
