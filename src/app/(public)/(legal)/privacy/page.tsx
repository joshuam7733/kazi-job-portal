import type { Metadata } from "next";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

const CONTENT = `# Privacy policy

> **Draft for review.** This policy describes how the KAZI software handles personal data. Have it reviewed by a qualified lawyer against the Uganda Data Protection and Privacy Act, 2019 (and the laws of any other country you operate in) before launch.

## What we collect

- **Account details:** your name, email address and a securely hashed password.
- **Profile details you choose to add:** headline, location, experience, education, skills, salary expectations, links and CVs.
- **Applications:** the CV, cover letter and answers you send to an employer.
- **Usage data:** basic technical logs (such as IP address) used for security and rate limiting.

## Who can see your information

- Your CV and application are visible **only to the employer you apply to** and to KAZI administrators handling support or safety reviews.
- Employers cannot browse or search candidate profiles.
- Your phone number is hidden from employers unless you choose to share it in privacy settings.
- Private notes employers write about applications are never shown to candidates, and are only visible to that employer's team.

## How long we keep it

We keep your data while your account is active. You can delete your account at any time from **Settings → Delete account**; your profile, CVs, saved jobs, alerts and applications are then permanently removed.

## Your rights

You can access, correct, export or delete your personal data. Contact the support email listed in Settings for any request.

## Security

Passwords are hashed with bcrypt, CV files are stored privately and served only to authorised users, and administrative actions are logged.
`;

export default function PrivacyPage() {
  return <Markdown>{CONTENT}</Markdown>;
}
