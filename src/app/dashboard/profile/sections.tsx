"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { FileText, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { FormMessage, SubmitButton } from "@/components/forms";
import { formatBytes, formatDate } from "@/lib/format";
import type { ActionState } from "@/server/action-utils";
import {
  deleteEducationAction,
  deleteExperienceAction,
  deleteResumeAction,
  saveEducationAction,
  saveExperienceAction,
  savePersonalAction,
  savePreferencesAction,
  savePrivacyAction,
  saveSkillsAction,
  saveSummaryAction,
  setDefaultResumeAction,
  uploadResumeAction,
} from "@/server/profile-actions";

function Section({ id, title, description, children, action }: { id: string; title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[14px] border border-line bg-surface p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-sans text-lg font-bold tracking-normal">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Toasts the result of a section save once per submission. */
function useToastOnSave(state: ActionState) {
  const last = useRef<ActionState | null>(null);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);
}

export function PersonalSection({ email, values }: { email: string; values: Record<string, string> }) {
  const [state, action] = useActionState(savePersonalAction, {});
  useToastOnSave(state);
  const v = state.values ?? values;
  const fe = state.fieldErrors ?? {};
  return (
    <Section id="personal" title="Personal information">
      <form action={action} className="grid gap-4" noValidate>
        <FormMessage state={{ error: state.error }} />
        <Field label="Full name" error={fe.name}>
          {({ id, describedBy, invalid }) => <Input id={id} name="name" defaultValue={v.name} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Email" hint="Change your sign-in email from Settings.">
          {({ id, describedBy }) => <Input id={id} value={email} disabled aria-describedby={describedBy} />}
        </Field>
        <Field label="Professional headline" optional hint="For example: Accountant with 4 years in audit" error={fe.headline}>
          {({ id, describedBy, invalid }) => <Input id={id} name="headline" defaultValue={v.headline} maxLength={120} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location" optional error={fe.locationText}>
            {({ id, describedBy, invalid }) => <Input id={id} name="locationText" defaultValue={v.locationText} placeholder="Kampala, Uganda" aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="Phone" optional hint="Hidden from employers unless you allow it below." error={fe.phone}>
            {({ id, describedBy, invalid }) => <Input id={id} name="phone" type="tel" defaultValue={v.phone} autoComplete="tel" aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
        </div>
        <Field label="Portfolio or website" optional error={fe.portfolioUrl}>
          {({ id, describedBy, invalid }) => <Input id={id} name="portfolioUrl" defaultValue={v.portfolioUrl} inputMode="url" aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn" optional error={fe.linkedinUrl}>
            {({ id, describedBy, invalid }) => <Input id={id} name="linkedinUrl" defaultValue={v.linkedinUrl} inputMode="url" aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="GitHub" optional error={fe.githubUrl}>
            {({ id, describedBy, invalid }) => <Input id={id} name="githubUrl" defaultValue={v.githubUrl} inputMode="url" aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
        </div>
        <div>
          <SubmitButton pendingText="Saving…">Save personal details</SubmitButton>
        </div>
      </form>
    </Section>
  );
}

export function SummarySection({ summary }: { summary: string }) {
  const [state, action] = useActionState(saveSummaryAction, {});
  const [text, setText] = useState(summary);
  useToastOnSave(state);
  return (
    <Section id="summary" title="Professional summary" description="Two or three sentences about what you do and what you're looking for.">
      <form action={action} className="grid gap-3">
        <FormMessage state={{ error: state.error }} />
        <label htmlFor="summary" className="sr-only">
          Professional summary
        </label>
        <Textarea id="summary" name="summary" rows={5} maxLength={3000} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted tabular">{text.length} / 3,000</span>
          <SubmitButton size="sm" pendingText="Saving…">
            Save summary
          </SubmitButton>
        </div>
      </form>
    </Section>
  );
}

export function PreferencesSection({ values }: { values: { experienceLevel: string; preferredRoles: string; preferredWorkplace: string[]; salaryExpectation: string } }) {
  const [state, action] = useActionState(savePreferencesAction, {});
  useToastOnSave(state);
  return (
    <Section id="preferences" title="Job preferences" description="Used to suggest jobs. Salary expectations are never shown to employers.">
      <form action={action} className="grid gap-4">
        <FormMessage state={{ error: state.error }} />
        <Field label="Experience level">
          {({ id }) => (
            <Select id={id} name="experienceLevel" defaultValue={values.experienceLevel}>
              <option value="">Choose a level</option>
              <option value="ENTRY">Entry level</option>
              <option value="JUNIOR">Junior (1–2 years)</option>
              <option value="MID">Mid-level (3–5 years)</option>
              <option value="SENIOR">Senior (5+ years)</option>
              <option value="LEAD">Lead / Manager</option>
              <option value="EXECUTIVE">Executive</option>
            </Select>
          )}
        </Field>
        <Field label="Roles you're looking for" optional hint="Separate with commas, up to 5.">
          {({ id, describedBy }) => <Input id={id} name="preferredRoles" defaultValue={values.preferredRoles} aria-describedby={describedBy} />}
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold">Work arrangement</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {[
              ["ONSITE", "On-site"],
              ["HYBRID", "Hybrid"],
              ["REMOTE", "Remote"],
            ].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-[15px]">
                <Checkbox name="preferredWorkplace" value={v} defaultChecked={values.preferredWorkplace.includes(v)} />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Expected monthly salary (UGX)" optional error={state.fieldErrors?.salaryExpectation}>
          {({ id, describedBy, invalid }) => <Input id={id} name="salaryExpectation" inputMode="numeric" defaultValue={values.salaryExpectation} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <div>
          <SubmitButton size="sm" pendingText="Saving…">
            Save preferences
          </SubmitButton>
        </div>
      </form>
    </Section>
  );
}

export function SkillsSection({ skills: initial }: { skills: string[] }) {
  const [skills, setSkills] = useState(initial);
  const [draft, setDraft] = useState("");
  const [state, action] = useActionState(saveSkillsAction, {});
  useToastOnSave(state);
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setSkills((s) => [...new Set([...s, ...parts])].slice(0, 25));
    setDraft("");
  };
  return (
    <Section id="skills" title="Skills" description="Add up to 25. Employers and job suggestions use these.">
      <form action={action} className="grid gap-4">
        <input type="hidden" name="skills" value={skills.join(",")} />
        <FormMessage state={{ error: state.error }} />
        <ul className="flex flex-wrap gap-2" aria-label="Your skills">
          {skills.length === 0 && <li className="text-sm text-muted">No skills added yet.</li>}
          {skills.map((s) => (
            <li key={s} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pl-3 pr-1 text-sm font-semibold">
              {s}
              <button type="button" onClick={() => setSkills((list) => list.filter((x) => x !== s))} className="rounded-full p-1 text-muted hover:bg-line hover:text-ink" aria-label={`Remove ${s}`}>
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <label htmlFor="skill-input" className="sr-only">
            Add a skill
          </label>
          <Input
            id="skill-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="e.g. Excel, Customer service, React"
            maxLength={120}
          />
          <Button type="button" variant="secondary" onClick={add}>
            Add
          </Button>
        </div>
        <div>
          <SubmitButton size="sm" pendingText="Saving…">
            Save skills
          </SubmitButton>
        </div>
      </form>
    </Section>
  );
}

type Experience = { id: string; title: string; company: string; location: string; startDate: string; endDate: string; isCurrent: boolean; description: string };

export function ExperienceSection({ items }: { items: Experience[] }) {
  const [editing, setEditing] = useState<Experience | "new" | null>(null);
  const [pending, start] = useTransition();
  return (
    <Section
      id="experience"
      title="Work experience"
      action={
        <Button variant="secondary" size="sm" onClick={() => setEditing("new")}>
          <Plus /> Add role
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted">Add your most recent roles. Internships, volunteering and part-time work count too.</p>
      ) : (
        <ul className="grid gap-5">
          {items.map((e) => (
            <li key={e.id} className="flex gap-4 border-b border-line pb-5 last:border-0 last:pb-0" aria-busy={pending}>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{e.title}</p>
                <p className="text-sm">
                  {e.company}
                  {e.location ? `, ${e.location}` : ""}
                </p>
                <p className="text-sm text-muted">
                  {formatDate(`${e.startDate}-01`, "MMM yyyy")} – {e.isCurrent ? "Present" : e.endDate ? formatDate(`${e.endDate}-01`, "MMM yyyy") : ""}
                </p>
                {e.description && <p className="mt-2 whitespace-pre-line text-sm text-ink/85">{e.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <Tooltip content="Edit">
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${e.title}`} onClick={() => setEditing(e)}>
                    <Pencil />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${e.title}`}
                    onClick={() =>
                      start(async () => {
                        await deleteExperienceAction(e.id);
                        toast.success("Role removed");
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        {editing !== null && <ExperienceForm item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Dialog>
    </Section>
  );
}

function ExperienceForm({ item, onDone }: { item: Experience | null; onDone: () => void }) {
  const [state, action] = useActionState(saveExperienceAction, {});
  const [current, setCurrent] = useState(item?.isCurrent ?? false);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      onDone();
    }
  }, [state, onDone]);
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? item ?? ({} as Partial<Experience>);
  return (
    <DialogContent title={item ? "Edit role" : "Add a role"} className="max-w-xl">
      <form action={action} className="grid gap-4" noValidate>
        {item && <input type="hidden" name="id" value={item.id} />}
        <FormMessage state={{ error: state.error }} />
        <Field label="Job title" error={fe.title}>
          {({ id, describedBy, invalid }) => <Input id={id} name="title" defaultValue={v.title} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employer" error={fe.company}>
            {({ id, describedBy, invalid }) => <Input id={id} name="company" defaultValue={v.company} aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="Location" optional>
            {({ id }) => <Input id={id} name="location" defaultValue={v.location} />}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start month" error={fe.startDate}>
            {({ id, describedBy, invalid }) => <Input id={id} name="startDate" type="month" defaultValue={v.startDate} aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="End month" error={fe.endDate}>
            {({ id, describedBy, invalid }) => <Input id={id} name="endDate" type="month" defaultValue={v.endDate} disabled={current} aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
        </div>
        <label className="flex items-center gap-2 text-[15px]">
          <Checkbox name="isCurrent" checked={current} onChange={(e) => setCurrent(e.target.checked)} /> I work here now
        </label>
        <Field label="What you did" optional hint="One achievement per line works well.">
          {({ id, describedBy }) => <Textarea id={id} name="description" rows={5} maxLength={2000} defaultValue={v.description} aria-describedby={describedBy} />}
        </Field>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton pendingText="Saving…">Save role</SubmitButton>
        </div>
      </form>
    </DialogContent>
  );
}

type Education = { id: string; institution: string; qualification: string; field: string; level: string; startYear: string; endYear: string };

export function EducationSection({ items }: { items: Education[] }) {
  const [editing, setEditing] = useState<Education | "new" | null>(null);
  const [pending, start] = useTransition();
  return (
    <Section
      id="education"
      title="Education"
      action={
        <Button variant="secondary" size="sm" onClick={() => setEditing("new")}>
          <Plus /> Add education
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted">Add degrees, diplomas, certificates and professional qualifications.</p>
      ) : (
        <ul className="grid gap-5">
          {items.map((e) => (
            <li key={e.id} className="flex gap-4 border-b border-line pb-5 last:border-0 last:pb-0" aria-busy={pending}>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{e.qualification}</p>
                <p className="text-sm">{e.institution}</p>
                <p className="text-sm text-muted">{[e.field, [e.startYear, e.endYear].filter(Boolean).join("–")].filter(Boolean).join(", ")}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Tooltip content="Edit">
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${e.qualification}`} onClick={() => setEditing(e)}>
                    <Pencil />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${e.qualification}`}
                    onClick={() =>
                      start(async () => {
                        await deleteEducationAction(e.id);
                        toast.success("Education removed");
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        {editing !== null && <EducationForm item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Dialog>
    </Section>
  );
}

function EducationForm({ item, onDone }: { item: Education | null; onDone: () => void }) {
  const [state, action] = useActionState(saveEducationAction, {});
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Saved");
      onDone();
    }
  }, [state, onDone]);
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? item ?? ({} as Partial<Education>);
  return (
    <DialogContent title={item ? "Edit education" : "Add education"} className="max-w-xl">
      <form action={action} className="grid gap-4" noValidate>
        {item && <input type="hidden" name="id" value={item.id} />}
        <FormMessage state={{ error: state.error }} />
        <Field label="Institution" error={fe.institution}>
          {({ id, describedBy, invalid }) => <Input id={id} name="institution" defaultValue={v.institution} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Qualification" hint="For example: Bachelor of Commerce" error={fe.qualification}>
          {({ id, describedBy, invalid }) => <Input id={id} name="qualification" defaultValue={v.qualification} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Field of study" optional>
            {({ id }) => <Input id={id} name="field" defaultValue={v.field} />}
          </Field>
          <Field label="Level" optional>
            {({ id }) => (
              <Select id={id} name="level" defaultValue={v.level}>
                <option value="">Choose a level</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="DIPLOMA">Diploma</option>
                <option value="BACHELORS">Bachelor&apos;s degree</option>
                <option value="MASTERS">Master&apos;s degree</option>
                <option value="DOCTORATE">Doctorate</option>
              </Select>
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start year" optional error={fe.startYear}>
            {({ id, describedBy, invalid }) => <Input id={id} name="startYear" inputMode="numeric" maxLength={4} defaultValue={v.startYear} aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="End year" optional hint="Expected year if still studying." error={fe.endYear}>
            {({ id, describedBy, invalid }) => <Input id={id} name="endYear" inputMode="numeric" maxLength={4} defaultValue={v.endYear} aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <SubmitButton pendingText="Saving…">Save education</SubmitButton>
        </div>
      </form>
    </DialogContent>
  );
}

type Resume = { id: string; label: string; fileId: string; fileName: string; size: number; isDefault: boolean; createdAt: string; used: number };

export function ResumeSection({ resumes }: { resumes: Resume[] }) {
  const [state, action] = useActionState(uploadResumeAction, {});
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Uploaded");
      formRef.current?.reset();
    }
  }, [state]);
  return (
    <Section id="cv" title="CVs" description="Keep up to 5 versions. PDF or Word, up to 4 MB. Only employers you apply to can open them.">
      {resumes.length > 0 && (
        <ul className="mb-5 grid gap-2">
          {resumes.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-[12px] border border-line p-3.5" aria-busy={pending}>
              <FileText className="size-5 text-muted" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  <span className="truncate">{r.label}</span>
                  {r.isDefault && <Badge tone="accent">Default</Badge>}
                </p>
                <p className="truncate text-xs text-muted">
                  {r.fileName}, {formatBytes(r.size)}, uploaded {formatDate(r.createdAt)}
                  {r.used > 0 ? `, used in ${r.used} ${r.used === 1 ? "application" : "applications"}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button asChild variant="ghost" size="sm">
                  <a href={`/api/files/${r.fileId}`} target="_blank" rel="noopener">
                    Open
                  </a>
                </Button>
                {!r.isDefault && (
                  <Tooltip content="Make default">
                    <Button variant="ghost" size="icon-sm" aria-label={`Make ${r.label} the default CV`} onClick={() => start(() => setDefaultResumeAction(r.id))}>
                      <Star />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="Delete CV">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${r.label}`}
                    onClick={() =>
                      start(async () => {
                        const res = await deleteResumeAction(r.id);
                        if (res.error) toast.error(res.error);
                        else toast.success("CV deleted");
                      })
                    }
                  >
                    <Trash2 />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} action={action} className="grid gap-3 rounded-[12px] border border-dashed border-line-strong p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <FormMessage state={{ error: state.error }} className="sm:col-span-3" />
        <Field label="Label" optional>
          {({ id }) => <Input id={id} name="label" placeholder="e.g. Finance CV 2026" maxLength={60} />}
        </Field>
        <Field label="File">
          {({ id }) => (
            <input
              id={id}
              type="file"
              name="file"
              required
              accept=".pdf,.doc,.docx"
              className="block h-11 w-full text-sm file:mr-3 file:h-full file:rounded-[8px] file:border-0 file:bg-surface-2 file:px-3 file:text-sm file:font-semibold"
            />
          )}
        </Field>
        <SubmitButton pendingText="Uploading…">Upload CV</SubmitButton>
      </form>
    </Section>
  );
}

export function PrivacySection({ values }: { values: { showPhoneToEmployers: boolean; allowEmployerMessages: boolean; openToWork: boolean } }) {
  const [state, action] = useActionState(savePrivacyAction, {});
  useToastOnSave(state);
  const rows = [
    { name: "showPhoneToEmployers", label: "Show my phone number to employers I apply to", value: values.showPhoneToEmployers },
    { name: "allowEmployerMessages", label: "Allow employers I've applied to to message me", value: values.allowEmployerMessages },
    { name: "openToWork", label: "I'm actively looking for work", value: values.openToWork },
  ];
  return (
    <Section id="privacy" title="Privacy" description="Employers can never search for you. They only see what you send them when you apply.">
      <form action={action} className="grid gap-4">
        <FormMessage state={{ error: state.error }} />
        {rows.map((r) => (
          <label key={r.name} className="flex items-center justify-between gap-4 text-[15px]">
            {r.label}
            <Switch name={r.name} defaultChecked={r.value} label={r.label} />
          </label>
        ))}
        <div>
          <SubmitButton size="sm" pendingText="Saving…">
            Save privacy settings
          </SubmitButton>
        </div>
      </form>
    </Section>
  );
}
