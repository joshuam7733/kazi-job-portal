"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Textarea } from "@/components/ui/field";
import { CompanyLogo } from "@/components/ui/misc";
import { FormMessage, SubmitButton } from "@/components/forms";
import { applyToJobAction } from "@/server/job-actions";
import { formatBytes, formatDate } from "@/lib/format";
import type { ScreeningQuestion } from "@/lib/validation/application";
import { cn } from "@/lib/utils";

type Props = {
  job: { id: string; slug: string; title: string; company: string; brandColor: string | null; logoUrl: string | null; questions: ScreeningQuestion[]; deadline: string | null };
  applicant: { name: string; email: string; headline: string | null; phone: string | null; location: string | null };
  resumes: { id: string; label: string; fileName: string; size: number; isDefault: boolean }[];
};

const MAX_CV = 4 * 1024 * 1024;

export function ApplyFlow({ job, applicant, resumes }: Props) {
  const [state, action] = useActionState(applyToJobAction, {});
  const steps = ["CV & cover letter", ...(job.questions.length ? ["Questions"] : []), "Review"];
  const [step, setStep] = useState(0);
  const [resumeChoice, setResumeChoice] = useState<string>(resumes.find((r) => r.isDefault)?.id ?? resumes[0]?.id ?? "upload");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), [step]);
  // If the server rejects answers or the CV, jump back to that step (adjusting state during render).
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.fieldErrors?.resumeId) setStep(0);
    else if (state.fieldErrors && Object.keys(state.fieldErrors).some((k) => k.startsWith("answer_"))) setStep(1);
  }

  const current = steps[step];

  const validate = () => {
    const e: Record<string, string> = {};
    if (current === "CV & cover letter") {
      if (resumeChoice === "upload") {
        if (!file) e.resume = "Choose a CV file to upload";
        else if (file.size > MAX_CV) e.resume = "That file is larger than 4 MB";
        else if (!/\.(pdf|docx?|DOCX?|PDF)$/.test(file.name)) e.resume = "Upload a PDF or Word document";
      }
      if (cover.length > 5000) e.cover = "Keep your cover letter under 5,000 characters";
    }
    if (current === "Questions") {
      for (const q of job.questions) if (q.required && !answers[q.id]?.trim()) e[`answer_${q.id}`] = "Answer this question to continue";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // On success the action redirects to the application page, which shows the confirmation.
  const selectedResume = resumes.find((r) => r.id === resumeChoice);

  return (
    <form action={action} encType="multipart/form-data" noValidate>
      <input type="hidden" name="jobId" value={job.id} />
      <div className="flex items-center gap-4">
        <CompanyLogo name={job.company} brandColor={job.brandColor} logoUrl={job.logoUrl} size={48} />
        <div className="min-w-0">
          <p className="text-sm text-muted">Applying to {job.company}</p>
          <p className="truncate text-lg font-bold">{job.title}</p>
        </div>
      </div>

      <ol className="mt-8 flex gap-2" aria-label="Application steps">
        {steps.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={cn("h-1 rounded-full bg-line", i <= step && "bg-accent")} />
            <p className={cn("mt-2 text-xs font-semibold sm:text-sm", i === step ? "text-ink" : "text-muted")} aria-current={i === step ? "step" : undefined}>
              <span className="sr-only">Step {i + 1} of {steps.length}: </span>
              {s}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-[20px] border border-line bg-surface p-5 sm:p-8">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">
          {current === "CV & cover letter" ? "Your CV and cover letter" : current === "Questions" ? `Questions from ${job.company}` : "Review your application"}
        </h1>
        <FormMessage state={state} className="mt-4" />

        {/* Step 1 — kept mounted so its fields are submitted with the form */}
        <div className={cn("mt-6 grid gap-6", current !== "CV & cover letter" && "hidden")}>
          <fieldset>
            <legend className="text-sm font-semibold">CV</legend>
            <div className="mt-2 grid gap-2">
              {resumes.map((r) => (
                <label key={r.id} className={cn("flex cursor-pointer items-center gap-3 rounded-[12px] border p-3.5", resumeChoice === r.id ? "border-accent bg-accent-soft" : "border-line-strong")}>
                  <input type="radio" name="resumeId" value={r.id} checked={resumeChoice === r.id} onChange={() => setResumeChoice(r.id)} className="accent-[var(--accent)]" />
                  <FileText className="size-5 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.label}</span>
                    <span className="block truncate text-xs text-muted">
                      {r.fileName}, {formatBytes(r.size)}
                    </span>
                  </span>
                  {r.isDefault && <span className="text-xs font-semibold text-muted">Default</span>}
                </label>
              ))}
              <label className={cn("flex cursor-pointer items-start gap-3 rounded-[12px] border p-3.5", resumeChoice === "upload" ? "border-accent bg-accent-soft" : "border-line-strong")}>
                <input type="radio" name="resumeId" value="" checked={resumeChoice === "upload"} onChange={() => setResumeChoice("upload")} className="mt-1 accent-[var(--accent)]" />
                <Upload className="mt-0.5 size-5 text-muted" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">Upload a new CV</span>
                  <span className="block text-xs text-muted">PDF or Word, up to 4 MB. It&apos;s also saved to your profile.</span>
                  {resumeChoice === "upload" && (
                    <input
                      type="file"
                      name="resumeFile"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      aria-label="CV file"
                      aria-invalid={Boolean(errors.resume)}
                      className="mt-3 block w-full text-sm file:mr-3 file:rounded-[8px] file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink-contrast"
                    />
                  )}
                </span>
              </label>
            </div>
            <FieldError>{errors.resume ?? state.fieldErrors?.resumeId?.[0]}</FieldError>
          </fieldset>
          <Field label="Cover letter" optional hint={`${cover.length.toLocaleString("en")} / 5,000 characters. Say why this role and why you.`} error={errors.cover}>
            {({ id, describedBy, invalid }) => (
              <Textarea id={id} name="coverLetter" rows={8} value={cover} onChange={(e) => setCover(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} />
            )}
          </Field>
        </div>

        {/* Step 2 */}
        {job.questions.length > 0 && (
          <div className={cn("mt-6 grid gap-6", current !== "Questions" && "hidden")}>
            {job.questions.map((q) => {
              const err = errors[`answer_${q.id}`] ?? state.fieldErrors?.[`answer_${q.id}`]?.[0];
              return q.type === "yesno" ? (
                <fieldset key={q.id}>
                  <legend className="text-sm font-semibold">
                    {q.label}
                    {!q.required && <span className="ml-1.5 font-normal text-muted">(optional)</span>}
                  </legend>
                  <div className="mt-2 flex gap-2">
                    {["Yes", "No"].map((v) => (
                      <label key={v} className={cn("flex cursor-pointer items-center gap-2 rounded-[10px] border px-4 py-2.5 font-semibold", answers[q.id] === v ? "border-accent bg-accent-soft" : "border-line-strong")}>
                        <input type="radio" name={`answer_${q.id}`} value={v} checked={answers[q.id] === v} onChange={() => setAnswers((a) => ({ ...a, [q.id]: v }))} className="accent-[var(--accent)]" />
                        {v}
                      </label>
                    ))}
                  </div>
                  <FieldError>{err}</FieldError>
                </fieldset>
              ) : (
                <Field key={q.id} label={q.label} optional={!q.required} error={err}>
                  {({ id, describedBy, invalid }) => (
                    <Textarea
                      id={id}
                      name={`answer_${q.id}`}
                      rows={4}
                      maxLength={2000}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        )}

        {/* Step 3 */}
        {current === "Review" && (
          <dl className="mt-6 grid gap-5 text-[15px]">
            <ReviewRow label="Applicant">
              <p className="font-semibold">{applicant.name}</p>
              <p className="text-muted">{[applicant.headline, applicant.location].filter(Boolean).join(", ")}</p>
              <p className="text-muted">{applicant.email}</p>
              <Link href="/dashboard/profile" className="mt-1 inline-block text-sm font-semibold text-accent-ink hover:underline dark:text-accent">
                Edit profile
              </Link>
            </ReviewRow>
            <ReviewRow label="CV">{resumeChoice === "upload" ? file?.name : `${selectedResume?.label} (${selectedResume?.fileName})`}</ReviewRow>
            <ReviewRow label="Cover letter">{cover ? <p className="line-clamp-4 whitespace-pre-line">{cover}</p> : <span className="text-muted">None</span>}</ReviewRow>
            {job.questions.map((q) => (
              <ReviewRow key={q.id} label={q.label}>
                {answers[q.id] || <span className="text-muted">No answer</span>}
              </ReviewRow>
            ))}
            {job.deadline && <p className="text-sm text-muted">Applications close on {formatDate(job.deadline)}.</p>}
          </dl>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href={`/jobs/${job.slug}`}>Cancel</Link>
            </Button>
          )}
          {current === "Review" ? (
            <SubmitButton size="lg" variant="accent" pendingText="Sending application…">
              Submit application
            </SubmitButton>
          ) : (
            <Button type="button" size="lg" onClick={() => validate() && setStep((s) => s + 1)}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line pb-5 last:border-0 sm:grid-cols-[180px_1fr] sm:gap-6">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
