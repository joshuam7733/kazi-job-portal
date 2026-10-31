import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "About KAZI", alternates: { canonical: "/about" } };

const CONTENT = `# About KAZI

*Kazi* means **work** in Swahili. KAZI Job Portal is a recruitment platform built for job seekers and employers in Uganda and across East Africa.

We focus on three things:

1. **Trust.** Employers are verified, listings are screened, and job seekers never pay to apply.
2. **Clarity.** Salaries shown where employers share them, honest job details, and a clear status for every application.
3. **Access.** Fast pages that work on everyday phones and slower connections.

KAZI is currently launching. Listings marked **Sample data** are demonstration content that shows how the platform works.
`;

export default function AboutPage() {
  return <Markdown>{CONTENT}</Markdown>;
}
