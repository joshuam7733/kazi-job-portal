import { describe, expect, it } from "vitest";
import { publishDecision } from "@/lib/jobs/publish";
import { scoreJobRisk } from "@/lib/jobs/risk";
import { adminCan, homeForRole, permissionsFor } from "@/lib/permissions";
import { rateLimit, resetRateLimits } from "@/lib/rate-limit";

const clean = {
  title: "Accountant",
  summary: "Prepare monthly accounts for a growing logistics company.",
  description: "You will own reconciliations and tax filings.",
  requirements: "CPA part-qualified",
  responsibilities: "Monthly close",
  salaryMin: 2_000_000,
  salaryMax: 3_000_000,
  salaryPeriod: "MONTH" as const,
  companyVerified: true,
  companyAgeDays: 400,
};

describe("scoreJobRisk", () => {
  it("scores a normal listing from a verified company as low risk", () => {
    const r = scoreJobRisk(clean);
    expect(r.score).toBe(0);
    expect(r.flags).toEqual([]);
  });

  it("flags fee requests, WhatsApp-only contact and guarantees", () => {
    const r = scoreJobRisk({
      ...clean,
      title: "URGENT!! Cleaners needed — Guaranteed job",
      description: "Pay a registration fee of UGX 450,000 via mobile money. Apply on WhatsApp only.",
      companyVerified: false,
      companyAgeDays: 0,
    });
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(r.flags).toEqual(expect.arrayContaining(["Mentions a fee charged to applicants", "Moves applicants to WhatsApp/Telegram", "Company is not yet verified"]));
  });

  it("flags unrealistic salaries and caps the score at 100", () => {
    const r = scoreJobRisk({ ...clean, salaryMax: 900_000_000, description: "registration fee, send money via western union, guaranteed visa", companyVerified: false, companyAgeDays: 0 });
    expect(r.flags).toContain("Salary is far above the market range");
    expect(r.score).toBe(100);
  });
});

describe("publishDecision", () => {
  it("publishes verified, low-risk jobs immediately", () => {
    expect(publishDecision({ companyVerified: true, requireApproval: false, riskScore: 10, threshold: 40 }).status).toBe("PUBLISHED");
  });
  it("holds jobs from unverified companies", () => {
    expect(publishDecision({ companyVerified: false, requireApproval: false, riskScore: 0, threshold: 40 }).status).toBe("PENDING_REVIEW");
  });
  it("holds risky jobs and honours the global approval setting", () => {
    expect(publishDecision({ companyVerified: true, requireApproval: false, riskScore: 40, threshold: 40 }).status).toBe("PENDING_REVIEW");
    expect(publishDecision({ companyVerified: true, requireApproval: true, riskScore: 0, threshold: 40 }).status).toBe("PENDING_REVIEW");
  });
});

describe("permissions", () => {
  it("gives super admins everything", () => {
    expect(adminCan("SUPER_ADMIN", "admins:manage")).toBe(true);
    expect(permissionsFor("SUPER_ADMIN")).toContain("settings:manage");
  });
  it("limits content editors to content work", () => {
    expect(adminCan("CONTENT_EDITOR", "content:manage")).toBe(true);
    expect(adminCan("CONTENT_EDITOR", "users:manage")).toBe(false);
    expect(adminCan("CONTENT_EDITOR", "jobs:moderate")).toBe(false);
  });
  it("denies everything without an admin role", () => {
    expect(adminCan(null, "analytics:view")).toBe(false);
  });
  it("routes each role to its home", () => {
    expect(homeForRole("JOB_SEEKER")).toBe("/dashboard");
    expect(homeForRole("EMPLOYER")).toBe("/employer");
    expect(homeForRole("ADMIN")).toBe("/admin");
  });
});

describe("rateLimit", () => {
  it("allows up to the limit within a window, then blocks until reset", () => {
    resetRateLimits();
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, t).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, t + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
    expect(rateLimit("k", 3, 1000, t + 1001).ok).toBe(true);
  });
});
