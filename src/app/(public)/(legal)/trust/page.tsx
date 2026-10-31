import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = {
  title: "Trust & safety",
  description: "How KAZI verifies employers, screens listings and protects job seekers from fraudulent vacancies.",
  alternates: { canonical: "/trust" },
};

const CONTENT = `# Trust & safety

Job scams cost people money and time. These are the safeguards built into KAZI.

## Employer verification

Employers submit registration details for review by the KAZI team. Only approved companies display the **Verified employer** badge, and only verified companies can publish without manual review.

## Automatic listing screening

Every new or edited listing is screened for warning signs, including requests for application or "processing" fees, money transfer instructions, WhatsApp-only contact, guaranteed jobs or visas abroad, and unrealistic salaries. Listings that score above our risk threshold are held for a moderator before anyone can see them.

## Reporting

Every job page has a **Report this job** link. Reports go to our moderation queue, and a listing that receives several reports is automatically paused pending review.

## Your data

Employers only see applications sent to them. They cannot search candidate profiles, and CV files are never public.

## Listing standards

Listings are removed when they:

- ask candidates to pay for anything,
- hide the real employer,
- advertise roles that don't exist, or
- contain discriminatory requirements unrelated to the job.
`;

export default function TrustPage() {
  return <Markdown>{CONTENT}</Markdown>;
}
