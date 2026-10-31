"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { Progress } from "@/components/ui/misc";
import { FormMessage, SubmitButton } from "@/components/forms";
import { completeOnboardingAction, saveSeekerStepAction } from "@/server/onboarding-actions";

const STEPS = [
  { key: "about", title: "Tell us about you", hint: "This is the first thing employers see." },
  { key: "preferences", title: "What are you looking for?", hint: "We use this to suggest jobs. You can skip anything." },
  { key: "background", title: "Your experience and education", hint: "Add your latest role and qualification — you can add more later." },
  { key: "cv", title: "Add your CV", hint: "Upload once and apply to jobs in a few taps." },
] as const;

export function SeekerOnboarding({ name }: { name: string }) {
  const [index, setIndex] = useState(0);
  const [state, action] = useActionState(saveSeekerStepAction, {});
  const [finishing, startFinish] = useTransition();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = STEPS[index];
  const handled = useRef<unknown>(null);

  const next = () => {
    if (index < STEPS.length - 1) setIndex((i) => i + 1);
    else startFinish(() => completeOnboardingAction());
  };

  useEffect(() => {
    if (state.ok && state.data?.step === step.key && handled.current !== state) {
      handled.current = state;
      next();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  useEffect(() => headingRef.current?.focus(), [index]);

  const addSkill = () => {
    const parts = skillDraft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) setSkills((s) => [...new Set([...s, ...parts])].slice(0, 25));
    setSkillDraft("");
  };

  return (
    <div>
      <p className="text-sm font-semibold text-muted">
        Step {index + 1} of {STEPS.length}
      </p>
      <Progress value={((index + 1) / STEPS.length) * 100} label="Onboarding progress" className="mt-2" />
      <h1 ref={headingRef} tabIndex={-1} className="mt-8 font-display text-3xl font-semibold outline-none">
        {step.title}
      </h1>
      <p className="mt-2 text-muted">{step.hint}</p>

      <form key={step.key} action={action} className="mt-8 grid gap-5" noValidate>
        <input type="hidden" name="step" value={step.key} />
        <FormMessage state={{ error: state.error }} />

        {step.key === "about" && (
          <>
            <Field label="Full name" error={state.fieldErrors?.name}>
              {({ id, describedBy, invalid }) => <Input id={id} name="name" defaultValue={state.values?.name ?? name} autoComplete="name" aria-describedby={describedBy} aria-invalid={invalid} />}
            </Field>
            <Field label="Professional headline" optional hint="For example: Registered nurse, or Recent Bachelor of Commerce graduate">
              {({ id, describedBy }) => <Input id={id} name="headline" maxLength={120} aria-describedby={describedBy} />}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Location" optional>
                {({ id }) => <Input id={id} name="locationText" placeholder="Kampala, Uganda" />}
              </Field>
              <Field label="Experience level" optional>
                {({ id }) => (
                  <Select id={id} name="experienceLevel" defaultValue="">
                    <option value="">Choose a level</option>
                    <option value="ENTRY">Entry level / graduate</option>
                    <option value="JUNIOR">Junior (1–2 years)</option>
                    <option value="MID">Mid-level (3–5 years)</option>
                    <option value="SENIOR">Senior (5+ years)</option>
                    <option value="LEAD">Lead / Manager</option>
                    <option value="EXECUTIVE">Executive</option>
                  </Select>
                )}
              </Field>
            </div>
          </>
        )}

        {step.key === "preferences" && (
          <>
            <div className="grid gap-2">
              <label htmlFor="ob-skill" className="text-sm font-semibold">
                Skills <span className="font-normal text-muted">(optional)</span>
              </label>
              <input type="hidden" name="skills" value={skills.join(",")} />
              {skills.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <li key={s} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pl-3 pr-1 text-sm font-semibold">
                      {s}
                      <button type="button" className="rounded-full p-1 text-muted hover:text-ink" aria-label={`Remove ${s}`} onClick={() => setSkills((l) => l.filter((x) => x !== s))}>
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  id="ob-skill"
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  Add
                </Button>
              </div>
            </div>
            <Field label="Roles you want" optional hint="Separate with commas.">
              {({ id, describedBy }) => <Input id={id} name="preferredRoles" placeholder="Accountant, Finance officer" aria-describedby={describedBy} />}
            </Field>
            <fieldset>
              <legend className="text-sm font-semibold">Work arrangement</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {[
                  ["ONSITE", "On-site"],
                  ["HYBRID", "Hybrid"],
                  ["REMOTE", "Remote"],
                ].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2">
                    <Checkbox name="preferredWorkplace" value={v} /> {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Expected monthly salary (UGX)" optional hint="Private — never shown to employers.">
              {({ id, describedBy }) => <Input id={id} name="salaryExpectation" inputMode="numeric" aria-describedby={describedBy} />}
            </Field>
          </>
        )}

        {step.key === "background" && (
          <>
            <fieldset className="grid gap-4 rounded-[14px] border border-line p-4">
              <legend className="px-1 text-sm font-semibold">Most recent role</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Job title" error={state.fieldErrors?.expTitle}>
                  {({ id, invalid }) => <Input id={id} name="expTitle" aria-invalid={invalid} />}
                </Field>
                <Field label="Employer" error={state.fieldErrors?.expCompany}>
                  {({ id, invalid }) => <Input id={id} name="expCompany" aria-invalid={invalid} />}
                </Field>
              </div>
              <div className="grid items-end gap-4 sm:grid-cols-2">
                <Field label="Start month" error={state.fieldErrors?.expStart}>
                  {({ id, invalid }) => <Input id={id} name="expStart" type="month" aria-invalid={invalid} />}
                </Field>
                <label className="flex h-11 items-center gap-2">
                  <Checkbox name="expCurrent" defaultChecked /> I work here now
                </label>
              </div>
            </fieldset>
            <fieldset className="grid gap-4 rounded-[14px] border border-line p-4">
              <legend className="px-1 text-sm font-semibold">Highest qualification</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Institution">{({ id }) => <Input id={id} name="eduInstitution" />}</Field>
                <Field label="Qualification">{({ id }) => <Input id={id} name="eduQualification" placeholder="e.g. Diploma in Nursing" />}</Field>
              </div>
              <Field label="Year completed" optional>
                {({ id }) => <Input id={id} name="eduEndYear" inputMode="numeric" maxLength={4} className="sm:max-w-40" />}
              </Field>
            </fieldset>
          </>
        )}

        {step.key === "cv" && (
          <>
            <Field label="CV" optional hint="PDF or Word, up to 4 MB. Only employers you apply to can open it.">
              {({ id, describedBy }) => (
                <input
                  id={id}
                  type="file"
                  name="cv"
                  accept=".pdf,.doc,.docx"
                  aria-describedby={describedBy}
                  className="block w-full rounded-[10px] border border-dashed border-line-strong p-4 text-sm file:mr-3 file:rounded-[8px] file:border-0 file:bg-ink file:px-3 file:py-2 file:font-semibold file:text-ink-contrast"
                />
              )}
            </Field>
            <Field label="Portfolio or website" optional error={state.fieldErrors?.portfolioUrl}>
              {({ id, invalid }) => <Input id={id} name="portfolioUrl" inputMode="url" aria-invalid={invalid} />}
            </Field>
            <Field label="LinkedIn" optional error={state.fieldErrors?.linkedinUrl}>
              {({ id, invalid }) => <Input id={id} name="linkedinUrl" inputMode="url" aria-invalid={invalid} />}
            </Field>
          </>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-6">
          {index > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setIndex((i) => i - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {step.key !== "about" && (
              <Button type="button" variant="ghost" onClick={next} loading={finishing}>
                {index === STEPS.length - 1 ? "Skip and finish" : "Skip for now"}
              </Button>
            )}
            <SubmitButton size="lg" pendingText="Saving…" loading={finishing}>
              {index === STEPS.length - 1 ? "Finish" : "Continue"}
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
