import { describe, expect, it } from "vitest";
import { candidateStatusLabel } from "@/lib/constants";
import { formatSalary } from "@/lib/format";
import { profileCompleteness } from "@/lib/profile";
import { sniffMime } from "@/lib/storage";
import { safeInternalPath, slugify, toLines } from "@/lib/utils";
import { parseQuestions, validateAnswers } from "@/lib/validation/application";
import { signUpSchema } from "@/lib/validation/auth";
import { jobSchema, lenientJobParse } from "@/lib/validation/company";
import { experienceSchema } from "@/lib/validation/profile";

describe("auth validation", () => {
  const base = { name: "Amina N", email: "AMINA@Example.com ", password: "secret123", role: "JOB_SEEKER", acceptTerms: "on" };
  it("normalises email and accepts a valid sign-up", () => {
    const r = signUpSchema.safeParse(base);
    expect(r.success && r.data.email).toBe("amina@example.com");
  });
  it("rejects weak passwords and missing consent", () => {
    expect(signUpSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, password: "allletters" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, acceptTerms: undefined }).success).toBe(false);
  });
  it("does not allow self-registration as admin", () => {
    expect(signUpSchema.safeParse({ ...base, role: "ADMIN" }).success).toBe(false);
  });
});

describe("application answers", () => {
  const qs = parseQuestions([
    { id: "q1", label: "Can you start in January?", type: "yesno", required: true },
    { id: "q2", label: "Portfolio link", type: "text", required: false },
    { id: "bad" },
  ]);
  it("drops malformed questions", () => {
    expect(qs).toEqual([]); // one invalid entry invalidates the array — fail closed
  });
  it("requires answers to required questions and validates yes/no", () => {
    const questions = parseQuestions([
      { id: "q1", label: "Can you start in January?", type: "yesno", required: true },
      { id: "q2", label: "Portfolio link", type: "text", required: false },
    ]);
    const empty = new FormData();
    expect(Object.keys(validateAnswers(questions, empty).errors)).toEqual(["answer_q1"]);
    const fd = new FormData();
    fd.set("answer_q1", "Maybe");
    expect(validateAnswers(questions, fd).errors.answer_q1).toBeDefined();
    fd.set("answer_q1", "Yes");
    expect(validateAnswers(questions, fd).errors).toEqual({});
  });
});

describe("job validation", () => {
  const valid = {
    title: "Accountant",
    categoryId: "c1",
    locationId: "l1",
    workplace: "ONSITE",
    employmentType: "FULL_TIME",
    experienceLevel: "MID",
    educationLevel: "BACHELORS",
    openings: "1",
    salaryMin: "2,000,000",
    salaryMax: "1,000,000",
    summary: "Prepare monthly management accounts for our team.",
    description: "x".repeat(100),
    responsibilities: "Reconciliations and reporting",
    requirements: "Degree in accounting or finance",
    questions: [],
  };
  it("rejects a maximum salary below the minimum", () => {
    const r = jobSchema.safeParse(valid);
    expect(r.success).toBe(false);
    expect(!r.success && r.error.flatten().fieldErrors.salaryMax).toBeTruthy();
  });
  it("parses formatted salary numbers", () => {
    const r = jobSchema.safeParse({ ...valid, salaryMax: "3,500,000" });
    expect(r.success && r.data.salaryMin).toBe(2_000_000);
  });
  it("keeps valid fields of an incomplete draft", () => {
    const d = lenientJobParse({ title: "Draft role", summary: "too short", workplace: "REMOTE" });
    expect(d.title).toBe("Draft role");
    expect(d.workplace).toBe("REMOTE");
    expect(d.summary).toBeUndefined();
  });
});

describe("profile", () => {
  it("requires an end date unless the role is current", () => {
    const base = { title: "Developer", company: "Acme", startDate: "2024-01" };
    expect(experienceSchema.safeParse(base).success).toBe(false);
    expect(experienceSchema.safeParse({ ...base, isCurrent: "on" }).success).toBe(true);
    expect(experienceSchema.safeParse({ ...base, endDate: "2023-01" }).success).toBe(false);
  });
  it("scores completeness and lists what's missing", () => {
    const empty = profileCompleteness({ skills: 0, experience: 0, education: 0, resumes: 0, preferredRoles: 0, links: 0 });
    expect(empty.score).toBe(0);
    expect(empty.missing[0].label).toBe("Add your full name");
    const full = profileCompleteness({
      name: "A",
      headline: "H",
      summary: "x".repeat(50),
      locationText: "Kampala",
      experienceLevel: "MID",
      skills: 3,
      experience: 1,
      education: 1,
      resumes: 1,
      preferredRoles: 1,
      links: 1,
    });
    expect(full.score).toBe(100);
  });
});

describe("utilities", () => {
  it("only allows internal redirect paths", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("//evil.example")).toBe("/");
    expect(safeInternalPath("https://evil.example")).toBe("/");
    expect(safeInternalPath("/\\evil.example")).toBe("/");
  });
  it("slugifies accented and punctuated titles", () => {
    expect(slugify("Café Manager — Kampala!")).toBe("cafe-manager-kampala");
  });
  it("splits bullet text into lines", () => {
    expect(toLines("- one\n• two\n3) three\n\n")).toEqual(["one", "two", "three"]);
  });
  it("formats salary ranges compactly and hides undisclosed pay", () => {
    expect(formatSalary({ salaryMin: 2_500_000, salaryMax: 4_000_000, salaryCurrency: "UGX", salaryPeriod: "MONTH" })).toBe("UGX 2.5M–4M/mo");
    expect(formatSalary({ salaryMin: 1, salaryMax: 2, salaryCurrency: "UGX", salaryPeriod: "MONTH", showSalary: false })).toBeNull();
  });
  it("collapses internal pipeline stages for candidates", () => {
    expect(candidateStatusLabel("SHORTLISTED")).toBe("Under review");
    expect(candidateStatusLabel("REJECTED")).toBe("Not selected");
  });
  it("detects real file types from magic bytes", () => {
    expect(sniffMime(Buffer.from("%PDF-1.4 rest"))).toBe("application/pdf");
    expect(sniffMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffMime(Buffer.from("MZ executable"))).toBeNull();
  });
});
