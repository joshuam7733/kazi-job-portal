"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { createCompanyAction } from "@/server/onboarding-actions";
import { updateCompanyAction } from "@/server/employer-actions";

type Option = { id: string; name?: string; label?: string };
type Defaults = Partial<Record<string, string>>;

export function CompanyForm({
  mode,
  industries,
  locations,
  defaults = {},
}: {
  mode: "create" | "edit";
  industries: Option[];
  locations: Option[];
  defaults?: Defaults;
}) {
  const [state, action] = useActionState(mode === "create" ? createCompanyAction : updateCompanyAction, {});
  const v = { ...defaults, ...(state.values ?? {}) };
  const fe = state.fieldErrors ?? {};
  const last = useRef<unknown>(null);
  useEffect(() => {
    if (state !== last.current && state.ok && state.message) toast.success(state.message);
    last.current = state;
  }, [state]);

  return (
    <form action={action} className="grid gap-5" noValidate encType="multipart/form-data">
      <FormMessage state={{ error: state.error }} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company name" error={fe.name}>
          {({ id, describedBy, invalid }) => <Input id={id} name="name" defaultValue={v.name} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Organisation type">
          {({ id }) => (
            <Select id={id} name="type" defaultValue={v.type ?? "EMPLOYER"}>
              <option value="EMPLOYER">Direct employer</option>
              <option value="AGENCY">Recruitment agency</option>
            </Select>
          )}
        </Field>
      </div>
      <Field label="Tagline" optional hint="One line about what you do." error={fe.tagline}>
        {({ id, describedBy, invalid }) => <Input id={id} name="tagline" maxLength={140} defaultValue={v.tagline} aria-describedby={describedBy} aria-invalid={invalid} />}
      </Field>
      <Field label="About the company" hint="What you do, who you serve, and what it's like to work there." error={fe.description}>
        {({ id, describedBy, invalid }) => <Textarea id={id} name="description" rows={6} maxLength={4000} defaultValue={v.description} aria-describedby={describedBy} aria-invalid={invalid} />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Industry" error={fe.industryId}>
          {({ id, describedBy, invalid }) => (
            <Select id={id} name="industryId" defaultValue={v.industryId ?? ""} aria-describedby={describedBy} aria-invalid={invalid}>
              <option value="">Choose one</option>
              {industries.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Location" error={fe.locationId}>
          {({ id, describedBy, invalid }) => (
            <Select id={id} name="locationId" defaultValue={v.locationId ?? ""} aria-describedby={describedBy} aria-invalid={invalid}>
              <option value="">Choose one</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Company size" error={fe.size}>
          {({ id, describedBy, invalid }) => (
            <Select id={id} name="size" defaultValue={v.size ?? ""} aria-describedby={describedBy} aria-invalid={invalid}>
              <option value="">Choose one</option>
              <option value="S1_10">1–10</option>
              <option value="S11_50">11–50</option>
              <option value="S51_200">51–200</option>
              <option value="S201_500">201–500</option>
              <option value="S501_1000">501–1,000</option>
              <option value="S1000_PLUS">1,000+</option>
            </Select>
          )}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Website" optional error={fe.website}>
          {({ id, describedBy, invalid }) => <Input id={id} name="website" inputMode="url" defaultValue={v.website} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Year founded" optional error={fe.foundedYear}>
          {({ id, describedBy, invalid }) => <Input id={id} name="foundedYear" inputMode="numeric" maxLength={4} defaultValue={v.foundedYear} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Contact email" hint="For KAZI to reach you. Not shown publicly." error={fe.contactEmail}>
          {({ id, describedBy, invalid }) => <Input id={id} name="contactEmail" type="email" defaultValue={v.contactEmail} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
        <Field label="Contact phone" optional error={fe.contactPhone}>
          {({ id, describedBy, invalid }) => <Input id={id} name="contactPhone" type="tel" defaultValue={v.contactPhone} aria-describedby={describedBy} aria-invalid={invalid} />}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Logo" optional hint="PNG, JPG or WebP, up to 1 MB. Square works best.">
          {({ id, describedBy }) => (
            <input id={id} type="file" name="logo" accept="image/png,image/jpeg,image/webp" aria-describedby={describedBy} className="block w-full text-sm file:mr-3 file:rounded-[8px] file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:font-semibold" />
          )}
        </Field>
        <Field label="Brand colour" optional hint="Used for your logo placeholder and page header.">
          {({ id, describedBy }) => <input id={id} type="color" name="brandColor" defaultValue={v.brandColor || "#0F1B2D"} aria-describedby={describedBy} className="h-11 w-24 cursor-pointer rounded-[10px] border border-line-strong bg-surface p-1" />}
        </Field>
      </div>
      {mode === "create" && (
        <>
          <Field label="Your job title" optional>
            {({ id }) => <Input id={id} name="jobTitle" placeholder="e.g. HR Manager" />}
          </Field>
          <fieldset id="verification" className="grid gap-4 rounded-[14px] border border-line bg-surface-2/50 p-5">
            <legend className="px-1 font-semibold">Request verification (recommended)</legend>
            <p className="-mt-1 text-sm text-muted">
              Verified companies get a badge and can publish jobs without waiting for manual review. You can also do this later from your company profile.
            </p>
            <Field label="Company registration number" optional hint="From your URSB certificate of incorporation or equivalent.">
              {({ id, describedBy }) => <Input id={id} name="registrationNumber" aria-describedby={describedBy} />}
            </Field>
            <Field label="Supporting document" optional hint="PDF or image of your registration certificate, up to 4 MB. Only KAZI reviewers can see it.">
              {({ id, describedBy }) => (
                <input id={id} type="file" name="verificationDoc" accept=".pdf,image/png,image/jpeg" aria-describedby={describedBy} className="block w-full text-sm file:mr-3 file:rounded-[8px] file:border-0 file:bg-surface file:px-3 file:py-2 file:font-semibold" />
              )}
            </Field>
            <Field label="Anything else reviewers should know" optional>
              {({ id }) => <Textarea id={id} name="verificationNotes" rows={3} maxLength={1000} />}
            </Field>
          </fieldset>
        </>
      )}
      <div>
        <SubmitButton size="lg" pendingText="Saving…">
          {mode === "create" ? "Create company profile" : "Save company profile"}
        </SubmitButton>
      </div>
    </form>
  );
}
