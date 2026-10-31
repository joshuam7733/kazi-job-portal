import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE } from "@/lib/constants";
import { demoMode } from "@/lib/demo";
import { absoluteUrl } from "@/lib/utils";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s | ${SITE.shortName}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    locale: "en_UG",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  ...(demoMode ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1626" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[10px] focus:bg-ink focus:px-4 focus:py-2 focus:text-ink-contrast"
        >
          Skip to content
        </a>
        {demoMode && (
          <div role="note" className="bg-ink px-4 py-1.5 text-center text-xs font-medium text-ink-contrast">
            Prototype for review. All companies, jobs and people are sample data, and changes may be reset.
          </div>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
