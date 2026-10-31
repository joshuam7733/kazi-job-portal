"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { saveJobAction } from "@/server/employer-actions";

type Option = { id: string; label: string };
type TextKey =
  | "title"
  | "categoryId"
  | "locationId"
  | "workplace"
  | "employmentType"
  | "experienceLevel"
  | "educationLevel"
  | "openings"
  | "salaryMin"
  | "salaryMax"
  | "salaryCurrency"
  | "salaryPeriod"
  | "summary"
  | "description"
  | "responsibilities"
  | "requirements"
  | "preferredQualifications"
  | "benefits"
  | "skills"
  | "deadline";
export type JobFormValues = { [K in TextKey]?: string } & { showSalary?: boolean; questions?: { label: string; type: "text" | "yesno"; required: boolean }[] };

export function JobForm({
  jobId,
  categories,
  locations,
  initial = {},
  verified,
  status,
}: {
  jobId?: string;
  categories: Option[];
  locations: Option[];
  initial?: JobFormValues;
  verified: boolean;
  status?: string;
}) {
  const [state, action] = useActionState(saveJobAction, {});
  const v = { ...initial, ...(state.values ?? {}) } as JobFormValues;
  const fe = state.fieldErrors ?? {};
  const [questions, setQuestions] = useState(initial.questions ?? []);
  const live = status === "PUBLISHED";

  return (
    <form action={action} className="grid gap-6" noValidate>
      {jobId && <input type="hidden" name="jobId" value={jobId} />}
      <FormMessage state={{ error: state.error }} />

      <Panel title="The basics">
        <Field label="Job title" hint="Use the title candidates would search for." error={fe.title}>
          {({ id, describedBy, invalid }) => <Input id={id} name="title" maxLength={120} defaultValue={v.title} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Category" name="categoryId" value={v.categoryId} error={fe.categoryId} options={categories} placeholder="Choose a category" />
          <SelectField label="Location" name="locationId" value={v.locationId} error={fe.locationId} options={locations} placeholder="Choose a location" />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField
            label="Work arrangement"
            name="workplace"
            value={v.workplace ?? "ONSITE"}
            options={[
              { id: "ONSITE", label: "On-site" },
              { id: "HYBRID", label: "Hybrid" },
              { id: "REMOTE", label: "Remote" },
            ]}
          />
          <SelectField
            label="Job type"
            name="employmentType"
            value={v.employmentType ?? "FULL_TIME"}
            options={[
              { id: "FULL_TIME", label: "Full-time" },
              { id: "PART_TIME", label: "Part-time" },
              { id: "CONTRACT", label: "Contract" },
              { id: "INTERNSHIP", label: "Internship" },
              { id: "FREELANCE", label: "Freelance" },
            ]}
          />
          <Field label="Openings" error={fe.openings}>
            {({ id, invalid }) => <Input id={id} name="openings" type="number" min={1} max={500} defaultValue={v.openings ?? "1"} aria-invalid={invalid} />}
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Experience level"
            name="experienceLevel"
            value={v.experienceLevel ?? "MID"}
            options={[
              { id: "ENTRY", label: "Entry level" },
              { id: "JUNIOR", label: "Junior (1–2 years)" },
              { id: "MID", label: "Mid-level (3–5 years)" },
              { id: "SENIOR", label: "Senior (5+ years)" },
              { id: "LEAD", label: "Lead / Manager" },
              { id: "EXECUTIVE", label: "Executive" },
            ]}
          />
          <SelectField
            label="Minimum education"
            name="educationLevel"
            value={v.educationLevel ?? "NONE"}
            options={[
              { id: "NONE", label: "No formal requirement" },
              { id: "CERTIFICATE", label: "Certificate" },
              { id: "DIPLOMA", label: "Diploma" },
              { id: "BACHELORS", label: "Bachelor's degree" },
              { id: "MASTERS", label: "Master's degree" },
              { id: "DOCTORATE", label: "Doctorate" },
            ]}
          />
        </div>
      </Panel>

      <Panel title="Pay" description="Jobs that show pay get noticeably more applications.">
        <div className="grid gap-5 sm:grid-cols-4">
          <Field label="Minimum" error={fe.salaryMin}>
            {({ id, invalid }) => <Input id={id} name="salaryMin" inputMode="numeric" defaultValue={v.salaryMin} aria-invalid={invalid} />}
          </Field>
          <Field label="Maximum" error={fe.salaryMax}>
            {({ id, invalid }) => <Input id={id} name="salaryMax" inputMode="numeric" defaultValue={v.salaryMax} aria-invalid={invalid} />}
          </Field>
          <SelectField label="Currency" name="salaryCurrency" value={v.salaryCurrency ?? "UGX"} options={["UGX", "KES", "TZS", "RWF", "USD"].map((c) => ({ id: c, label: c }))} />
          <SelectField
            label="Per"
            name="salaryPeriod"
            value={v.salaryPeriod ?? "MONTH"}
            options={[
              { id: "MONTH", label: "Month" },
              { id: "YEAR", label: "Year" },
            ]}
          />
        </div>
        <label className="flex items-center gap-2 text-[15px]">
          <Checkbox name="showSalary" defaultChecked={v.showSalary ?? true} /> Show pay on the listing
        </label>
      </Panel>

      <Panel title="Description">
        <Field label="Summary" hint="One sentence shown in search results (20–220 characters)." error={fe.summary}>
          {({ id, describedBy, invalid }) => <Input id={id} name="summary" maxLength={220} defaultValue={v.summary} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="About the role" hint="What the role is, who it works with, and why it matters. Separate paragraphs with a blank line." error={fe.description}>
          {({ id, describedBy, invalid }) => <Textarea id={id} name="description" rows={7} maxLength={8000} defaultValue={v.description} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Responsibilities" hint="One per line." error={fe.responsibilities}>
          {({ id, describedBy, invalid }) => <Textarea id={id} name="responsibilities" rows={6} maxLength={5000} defaultValue={v.responsibilities} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Requirements" hint="One per line. Only list what's truly required." error={fe.requirements}>
          {({ id, describedBy, invalid }) => <Textarea id={id} name="requirements" rows={6} maxLength={5000} defaultValue={v.requirements} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Nice to have" optional hint="One per line.">
          {({ id, describedBy }) => <Textarea id={id} name="preferredQualifications" rows={4} maxLength={3000} defaultValue={v.preferredQualifications} aria-describedby={describedBy} />}
        </Field>
        <Field label="Benefits" optional hint="One per line.">
          {({ id, describedBy }) => <Textarea id={id} name="benefits" rows={4} maxLength={3000} defaultValue={v.benefits} aria-describedby={describedBy} />}
        </Field>
        <Field label="Skills" optional hint="Comma-separated, up to 12. Helps the job appear in skill searches.">
          {({ id, describedBy }) => <Input id={id} name="skills" defaultValue={v.skills} aria-describedby={describedBy} />}
        </Field>
      </Panel>

      <Panel title="Applications">
        <Field label="Application deadline" optional hint="The job closes automatically at the end of this day." error={fe.deadline}>
          {({ id, describedBy, invalid }) => <Input id={id} name="deadline" type="date" defaultValue={v.deadline} className="sm:max-w-56" aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-semibold">Screening questions</legend>
          <p className="-mt-1 text-sm text-muted">Up to 8. Candidates answer these when they apply.</p>
          {questions.map((q, i) => (
            <div key={i} className="grid gap-2 rounded-[12px] border border-line p-3 sm:grid-cols-[1fr_140px_auto_auto] sm:items-center">
              <label className="sr-only" htmlFor={`q-${i}`}>
                Question {i + 1}
              </label>
              <Input
                id={`q-${i}`}
                name="q_label"
                value={q.label}
                placeholder="e.g. Do you hold a valid driving permit?"
                maxLength={200}
                onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <select
                name="q_type"
                aria-label={`Answer type for question ${i + 1}`}
                value={q.type}
                onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, type: e.target.value as "text" | "yesno" } : x)))}
                className="h-11 rounded-[10px] border border-line-strong bg-surface px-3"
              >
                <option value="text">Written answer</option>
                <option value="yesno">Yes / No</option>
              </select>
              <input type="hidden" name="q_required" value={String(q.required)} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={q.required} onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} /> Required
              </label>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove question ${i + 1}`} onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </div>
          ))}
          {questions.length < 8 && (
            <Button type="button" variant="secondary" className="justify-self-start" onClick={() => setQuestions((qs) => [...qs, { label: "", type: "text", required: true }])}>
              <Plus /> Add a question
            </Button>
          )}
        </fieldset>
      </Panel>

      <div className="sticky bottom-20 z-10 flex flex-col gap-3 rounded-[14px] border border-line bg-surface/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
        <p className="text-sm text-muted">
          {verified
            ? live
              ? "Changes go live straight away unless our screening flags them."
              : "Verified companies publish straight away unless a listing is flagged by screening."
            : "Your company isn't verified yet, so our team will review this job before it goes live."}
        </p>
        <div className="flex gap-2">
          {!live && (
            <SubmitButton name="intent" value="draft" variant="secondary" pendingText="Saving…">
              Save draft
            </SubmitButton>
          )}
          <SubmitButton name="intent" value="submit" variant="accent" pendingText="Submitting…">
            {live ? "Save changes" : verified ? "Publish job" : "Submit for review"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
      <div>
        <h2 className="font-sans text-lg font-bold tracking-normal">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function SelectField({ label, name, value, options, error, placeholder }: { label: string; name: string; value?: string; options: Option[]; error?: string[]; placeholder?: string }) {
  return (
    <Field label={label} error={error}>
      {({ id, describedBy, invalid }) => (
        <Select id={id} name={name} defaultValue={value ?? ""} aria-describedby={describedBy} aria-invalid={invalid}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}
