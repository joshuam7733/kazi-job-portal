/** Profile completeness for job seekers — pure function so it can be unit tested. */
export type CompletenessInput = {
  name?: string | null;
  headline?: string | null;
  summary?: string | null;
  locationText?: string | null;
  experienceLevel?: string | null;
  skills: number;
  experience: number;
  education: number;
  resumes: number;
  preferredRoles: number;
  links: number;
};

const CHECKS: { key: keyof CompletenessInput | "links"; label: string; weight: number; href: string; test: (p: CompletenessInput) => boolean }[] = [
  { key: "name", label: "Add your full name", weight: 5, href: "/dashboard/profile#personal", test: (p) => Boolean(p.name?.trim()) },
  { key: "headline", label: "Write a professional headline", weight: 10, href: "/dashboard/profile#personal", test: (p) => Boolean(p.headline?.trim()) },
  { key: "locationText", label: "Add your location", weight: 5, href: "/dashboard/profile#personal", test: (p) => Boolean(p.locationText?.trim()) },
  { key: "summary", label: "Add a professional summary", weight: 10, href: "/dashboard/profile#summary", test: (p) => (p.summary?.trim().length ?? 0) >= 40 },
  { key: "experienceLevel", label: "Choose your experience level", weight: 5, href: "/dashboard/profile#preferences", test: (p) => Boolean(p.experienceLevel) },
  { key: "skills", label: "Add at least 3 skills", weight: 15, href: "/dashboard/profile#skills", test: (p) => p.skills >= 3 },
  { key: "experience", label: "Add your work experience", weight: 15, href: "/dashboard/profile#experience", test: (p) => p.experience >= 1 },
  { key: "education", label: "Add your education", weight: 10, href: "/dashboard/profile#education", test: (p) => p.education >= 1 },
  { key: "resumes", label: "Upload your CV", weight: 15, href: "/dashboard/profile#cv", test: (p) => p.resumes >= 1 },
  { key: "preferredRoles", label: "Tell us the roles you want", weight: 5, href: "/dashboard/profile#preferences", test: (p) => p.preferredRoles >= 1 },
  { key: "links", label: "Add a portfolio or LinkedIn link", weight: 5, href: "/dashboard/profile#personal", test: (p) => p.links >= 1 },
];

export function profileCompleteness(p: CompletenessInput) {
  let score = 0;
  const missing: { label: string; href: string }[] = [];
  for (const c of CHECKS) {
    if (c.test(p)) score += c.weight;
    else missing.push({ label: c.label, href: c.href });
  }
  return { score, missing };
}
