import type {
  AdminRole,
  ApplicationStatus,
  CompanySize,
  EducationLevel,
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  ReportReason,
  WorkplaceType,
} from "@prisma/client";

export const SITE = {
  name: "KAZI Job Portal",
  shortName: "KAZI",
  tagline: "Find Your Opportunity. Build Your Future.",
  description:
    "Discover meaningful career opportunities across Uganda and East Africa, connect with trusted employers, and take the next step toward your future.",
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
};

export const WORKPLACE_LABEL: Record<WorkplaceType, string> = {
  ONSITE: "On-site",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

export const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  ENTRY: "Entry level",
  JUNIOR: "Junior (1–2 yrs)",
  MID: "Mid-level (3–5 yrs)",
  SENIOR: "Senior (5+ yrs)",
  LEAD: "Lead / Manager",
  EXECUTIVE: "Executive",
};

export const EDUCATION_LABEL: Record<EducationLevel, string> = {
  NONE: "No formal requirement",
  CERTIFICATE: "Certificate",
  DIPLOMA: "Diploma",
  BACHELORS: "Bachelor's degree",
  MASTERS: "Master's degree",
  DOCTORATE: "Doctorate",
};

export const COMPANY_SIZE_LABEL: Record<CompanySize, string> = {
  S1_10: "1–10 employees",
  S11_50: "11–50 employees",
  S51_200: "51–200 employees",
  S201_500: "201–500 employees",
  S501_1000: "501–1,000 employees",
  S1000_PLUS: "1,000+ employees",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "In review",
  PUBLISHED: "Published",
  PAUSED: "Paused",
  CLOSED: "Closed",
  REJECTED: "Rejected",
  REMOVED: "Removed",
};

/** Employer-facing pipeline order (excludes terminal REJECTED/WITHDRAWN). */
export const PIPELINE: ApplicationStatus[] = ["SUBMITTED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED"];

export const PIPELINE_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

/**
 * Candidate-facing status. Internal screening stages collapse to "Under review" so candidates
 * see progress without employer-internal detail.
 */
export function candidateStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "SCREENING":
    case "SHORTLISTED":
      return "Under review";
    case "INTERVIEW":
      return "Interview";
    case "OFFER":
      return "Offer";
    case "HIRED":
      return "Hired";
    case "REJECTED":
      return "Not selected";
    case "WITHDRAWN":
      return "Withdrawn";
  }
}

export const CANDIDATE_STATUS_FILTERS = [
  { value: "submitted", label: "Submitted", statuses: ["SUBMITTED"] },
  { value: "review", label: "Under review", statuses: ["SCREENING", "SHORTLISTED"] },
  { value: "interview", label: "Interview", statuses: ["INTERVIEW"] },
  { value: "offer", label: "Offer", statuses: ["OFFER"] },
  { value: "hired", label: "Hired", statuses: ["HIRED"] },
  { value: "rejected", label: "Not selected", statuses: ["REJECTED"] },
  { value: "withdrawn", label: "Withdrawn", statuses: ["WITHDRAWN"] },
] as const satisfies { value: string; label: string; statuses: ApplicationStatus[] }[];

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SCAM_OR_FRAUD: "Looks like a scam or fraud",
  ASKS_FOR_PAYMENT: "Asks applicants to pay a fee",
  MISLEADING: "Misleading or inaccurate details",
  DISCRIMINATORY: "Discriminatory requirements",
  DUPLICATE: "Duplicate listing",
  OFFENSIVE: "Offensive content",
  OTHER: "Something else",
};

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super admin",
  MODERATOR: "Moderator",
  CONTENT_EDITOR: "Content editor",
  SUPPORT: "Support",
};

export const DATE_POSTED_OPTIONS = [
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export const SALARY_OPTIONS = [
  { value: "500000", label: "UGX 500k+ / month" },
  { value: "1000000", label: "UGX 1M+ / month" },
  { value: "2500000", label: "UGX 2.5M+ / month" },
  { value: "5000000", label: "UGX 5M+ / month" },
  { value: "8000000", label: "UGX 8M+ / month" },
];
