import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getSettings } from "@/lib/settings";

// Public pages read the session (header) and live listings, so render per request instead of at build
// time — this also means builds never need database access.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      {settings.maintenanceBanner && (
        <div role="status" className="bg-sun-soft px-4 py-2 text-center text-sm font-medium text-[#6b4700] dark:text-sun">
          {settings.maintenanceBanner}
        </div>
      )}
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
