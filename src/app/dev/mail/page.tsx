import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Dev mailbox", robots: { index: false } };
export const dynamic = "force-dynamic";

type Mail = { to: string; subject: string; text: string; sentAt: string };

/** Development-only preview of emails written by the local mail adapter. Returns 404 in production. */
export default async function DevMailPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const dir = path.resolve(process.cwd(), "storage", "mail");
  let mails: Mail[] = [];
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, 50);
    mails = await Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(dir, f), "utf8")) as Mail));
  } catch {
    mails = [];
  }
  return (
    <main id="main" className="container-page max-w-3xl py-10">
      <Logo />
      <h1 className="mt-6 font-display text-3xl font-semibold">Dev mailbox</h1>
      <p className="mt-1 text-muted">Emails captured by the local adapter because SMTP isn&apos;t configured. Newest first, last 50.</p>
      {mails.length === 0 ? (
        <p className="mt-8 text-muted">No emails yet.</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {mails.map((m, i) => (
            <li key={i} className="rounded-[14px] border border-line bg-surface p-5">
              <p className="text-sm text-muted">
                To {m.to}, {new Date(m.sentAt).toLocaleString("en-GB")}
              </p>
              <p className="mt-1 font-bold">{m.subject}</p>
              <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-ink/85">{m.text}</pre>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
