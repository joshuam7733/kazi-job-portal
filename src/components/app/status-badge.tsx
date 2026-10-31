import type { ApplicationStatus, JobStatus } from "@prisma/client";
import { Badge } from "@/components/ui/misc";
import { candidateStatusLabel, JOB_STATUS_LABEL, PIPELINE_LABEL } from "@/lib/constants";

type Tone = "neutral" | "accent" | "sun" | "danger" | "info" | "outline" | "ink";

const APP_TONE: Record<ApplicationStatus, Tone> = {
  SUBMITTED: "neutral",
  SCREENING: "info",
  SHORTLISTED: "info",
  INTERVIEW: "sun",
  OFFER: "accent",
  HIRED: "accent",
  REJECTED: "danger",
  WITHDRAWN: "outline",
};

export function ApplicationStatusBadge({ status, audience = "candidate" }: { status: ApplicationStatus; audience?: "candidate" | "employer" }) {
  return <Badge tone={APP_TONE[status]}>{audience === "candidate" ? candidateStatusLabel(status) : PIPELINE_LABEL[status]}</Badge>;
}

const JOB_TONE: Record<JobStatus, Tone> = {
  DRAFT: "outline",
  PENDING_REVIEW: "sun",
  PUBLISHED: "accent",
  PAUSED: "neutral",
  CLOSED: "neutral",
  REJECTED: "danger",
  REMOVED: "danger",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={JOB_TONE[status]}>{JOB_STATUS_LABEL[status]}</Badge>;
}
