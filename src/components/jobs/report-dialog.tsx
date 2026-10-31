"use client";

import { useActionState } from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { reportJobAction } from "@/server/job-actions";

const REASONS = [
  ["SCAM_OR_FRAUD", "Looks like a scam or fraud"],
  ["ASKS_FOR_PAYMENT", "Asks applicants to pay a fee"],
  ["MISLEADING", "Misleading or inaccurate details"],
  ["DISCRIMINATORY", "Discriminatory requirements"],
  ["DUPLICATE", "Duplicate listing"],
  ["OFFENSIVE", "Offensive content"],
  ["OTHER", "Something else"],
] as const;

export function ReportDialog({ jobId }: { jobId: string }) {
  const [state, action] = useActionState(reportJobAction, {});
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger">
        <Flag className="size-4" aria-hidden /> Report this job
      </DialogTrigger>
      <DialogContent title="Report this job" description="Reports are confidential. Our trust & safety team reviews every one.">
        {state.ok ? (
          <FormMessage state={state} />
        ) : (
          <form action={action} className="grid gap-4">
            <input type="hidden" name="jobId" value={jobId} />
            <FormMessage state={state} />
            <Field label="What's wrong with this listing?" error={state.fieldErrors?.reason}>
              {({ id, describedBy, invalid }) => (
                <Select id={id} name="reason" defaultValue="" aria-describedby={describedBy} aria-invalid={invalid}>
                  <option value="" disabled>
                    Choose a reason
                  </option>
                  {REASONS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Details" optional hint="What did you notice? Don't include passwords or payment details.">
              {({ id, describedBy }) => <Textarea id={id} name="details" maxLength={1000} aria-describedby={describedBy} />}
            </Field>
            <SubmitButton variant="danger" pendingText="Sending report…">
              Send report
            </SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
