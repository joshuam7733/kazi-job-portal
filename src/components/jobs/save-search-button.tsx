"use client";

import { useActionState, useState } from "react";
import { BellPlus } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { createAlertAction } from "@/server/alert-actions";

export function SaveSearchButton({ query }: { query: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createAlertAction, {});
  const q = new URLSearchParams(query).get("q");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <BellPlus /> Create job alert
        </Button>
      </DialogTrigger>
      <DialogContent title="Create a job alert" description="We'll notify you when new jobs match this search.">
        {state.ok ? (
          <div className="grid gap-4">
            <FormMessage state={state} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" asChild>
                <Link href="/dashboard/alerts">Manage alerts</Link>
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form action={action} className="grid gap-4">
            <input type="hidden" name="query" value={query} />
            <FormMessage state={state} />
            <Field label="Alert name" error={state.fieldErrors?.name}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} name="name" defaultValue={q ? `${q} jobs` : "My job search"} maxLength={60} aria-describedby={describedBy} aria-invalid={invalid} />
              )}
            </Field>
            <Field label="How often">
              {({ id }) => (
                <Select id={id} name="frequency" defaultValue="DAILY">
                  <option value="INSTANT">As soon as jobs are posted</option>
                  <option value="DAILY">Daily summary</option>
                  <option value="WEEKLY">Weekly summary</option>
                </Select>
              )}
            </Field>
            <SubmitButton pendingText="Creating…">Create alert</SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
