"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CalendarPlus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { PIPELINE, PIPELINE_LABEL } from "@/lib/constants";
import { addNoteAction, messageCandidateAction, moveApplicationAction, scheduleInterviewAction } from "@/server/employer-actions";

export function ApplicantActions({
  applicationId,
  status,
  conversationId,
  canMessage,
  candidateName,
}: {
  applicationId: string;
  status: ApplicationStatus;
  conversationId: string | null;
  canMessage: boolean;
  candidateName: string;
}) {
  const [pending, start] = useTransition();
  const withdrawn = status === "WITHDRAWN";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="stage-select">
        Stage
      </label>
      <select
        id="stage-select"
        value={status}
        disabled={withdrawn || pending}
        onChange={(e) =>
          start(async () => {
            const res = await moveApplicationAction(applicationId, e.target.value as ApplicationStatus);
            if (res.error) toast.error(res.error);
            else toast.success(res.message ?? "Stage updated");
          })
        }
        className="h-11 rounded-[10px] border border-line-strong bg-surface px-3 font-semibold"
      >
        {withdrawn && <option value="WITHDRAWN">Withdrawn by candidate</option>}
        {PIPELINE.map((s) => (
          <option key={s} value={s}>
            {PIPELINE_LABEL[s]}
          </option>
        ))}
        <option value="REJECTED">Rejected</option>
      </select>
      {!withdrawn && <InterviewDialog applicationId={applicationId} candidateName={candidateName} />}
      {conversationId ? (
        <Button asChild variant="secondary">
          <Link href={`/messages/${conversationId}`}>
            <MessageSquare /> Open conversation
          </Link>
        </Button>
      ) : canMessage && !withdrawn ? (
        <MessageDialog applicationId={applicationId} candidateName={candidateName} />
      ) : null}
    </div>
  );
}

function InterviewDialog({ applicationId, candidateName }: { applicationId: string; candidateName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(scheduleInterviewAction, {});
  const last = useRef<unknown>(null);
  useEffect(() => {
    if (state !== last.current && state.ok) {
      toast.success(state.message ?? "Interview scheduled");
      setOpen(false);
    }
    last.current = state;
  }, [state]);
  const fe = state.fieldErrors ?? {};
  const [tomorrow] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus /> Schedule interview
        </Button>
      </DialogTrigger>
      <DialogContent title={`Interview ${candidateName}`} description="The candidate gets a notification and email with these details. Times are East Africa Time." className="max-w-xl">
        <form action={action} className="grid gap-4" noValidate>
          <input type="hidden" name="applicationId" value={applicationId} />
          <FormMessage state={{ error: state.error }} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date" error={fe.date}>
              {({ id, invalid }) => <Input id={id} name="date" type="date" min={tomorrow} defaultValue={tomorrow} aria-invalid={invalid} />}
            </Field>
            <Field label="Time" error={fe.time}>
              {({ id, invalid }) => <Input id={id} name="time" type="time" defaultValue="10:00" aria-invalid={invalid} />}
            </Field>
            <Field label="Length">
              {({ id }) => (
                <Select id={id} name="durationMins" defaultValue="45">
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">90 min</option>
                </Select>
              )}
            </Field>
          </div>
          <Field label="Format">
            {({ id }) => (
              <Select id={id} name="mode" defaultValue="VIDEO">
                <option value="VIDEO">Video call</option>
                <option value="PHONE">Phone call</option>
                <option value="IN_PERSON">In person</option>
              </Select>
            )}
          </Field>
          <Field label="Location or link" optional hint="An office address, or say the video link will follow by message.">
            {({ id, describedBy }) => <Input id={id} name="location" maxLength={300} aria-describedby={describedBy} />}
          </Field>
          <Field label="Details for the candidate" optional>
            {({ id }) => <Textarea id={id} name="details" rows={3} maxLength={2000} placeholder="Who they'll meet, what to bring, how long it takes." />}
          </Field>
          <SubmitButton pendingText="Scheduling…">Send interview invitation</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MessageDialog({ applicationId, candidateName }: { applicationId: string; candidateName: string }) {
  const [state, action] = useActionState(messageCandidateAction, {});
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <MessageSquare /> Message
        </Button>
      </DialogTrigger>
      <DialogContent title={`Message ${candidateName}`} description="Messages stay inside KAZI. Don't ask candidates for payment or sensitive documents.">
        <form action={action} className="grid gap-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <FormMessage state={{ error: state.error }} />
          <Field label="Message" error={state.fieldErrors?.body}>
            {({ id, invalid }) => <Textarea id={id} name="body" rows={5} maxLength={4000} aria-invalid={invalid} />}
          </Field>
          <SubmitButton pendingText="Sending…">Send message</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NoteForm({ applicationId }: { applicationId: string }) {
  const [state, action] = useActionState(addNoteAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const last = useRef<unknown>(null);
  useEffect(() => {
    if (state !== last.current && state.ok) formRef.current?.reset();
    last.current = state;
  }, [state]);
  return (
    <form ref={formRef} action={action} className="grid gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <label htmlFor="note-body" className="sr-only">
        Add a private note
      </label>
      <Textarea id="note-body" name="body" rows={3} maxLength={2000} placeholder="Add a note for your team" aria-invalid={Boolean(state.fieldErrors?.body)} />
      {state.fieldErrors?.body && <p className="text-sm text-danger">{state.fieldErrors.body[0]}</p>}
      <FormMessage state={{ error: state.error }} />
      <SubmitButton size="sm" variant="secondary" pendingText="Adding…" className="justify-self-start">
        Add note
      </SubmitButton>
    </form>
  );
}
