import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/terms" } };

const CONTENT = `# Terms of use

> **Draft for review.** Have these terms reviewed by a qualified lawyer before launch.

## Using KAZI

KAZI connects job seekers with employers and recruitment agencies. You must provide accurate information and keep your password private.

## Job seekers

Applying through KAZI is free. Never pay anyone to be considered for a job listed on KAZI, and report any listing that asks you to.

## Employers and agencies

- Listings must describe real, currently open roles and identify the hiring organisation (agencies must state they are recruiting on behalf of a client).
- You must not charge candidates any fee for applying, interviewing, training or placement.
- You may use candidate information only to assess them for the role they applied to, and must not export it for other purposes.
- KAZI may pause, edit or remove listings and suspend accounts that break these rules.

## Content

You keep ownership of what you post. You give KAZI permission to display it on the platform to operate the service.

## Liability

KAZI reviews employers and screens listings, but cannot guarantee every listing or hiring outcome. Use good judgement and report anything suspicious.
`;

export default function TermsPage() {
  return <Markdown>{CONTENT}</Markdown>;
}
