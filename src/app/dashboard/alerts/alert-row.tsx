"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { Tooltip } from "@/components/ui/tooltip";
import { timeAgo } from "@/lib/format";
import { deleteAlertAction, toggleAlertAction, updateAlertAction } from "@/server/alert-actions";

const FREQ = { INSTANT: "Instant", DAILY: "Daily", WEEKLY: "Weekly" } as const;

export function AlertRow({
  alert,
  description,
  searchUrl,
  query,
}: {
  alert: { id: string; name: string; frequency: keyof typeof FREQ; isActive: boolean; lastSentAt: string | null };
  description: string;
  searchUrl: string;
  query: string;
}) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [state, action] = useActionState(updateAlertAction, {});

  return (
    <li className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-5 sm:flex-row sm:items-center" aria-busy={pending}>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{alert.name}</p>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
        <p className="mt-2 text-xs text-muted">
          {FREQ[alert.frequency]}, {alert.lastSentAt ? `last sent ${timeAgo(alert.lastSentAt)}` : "nothing sent yet"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <Switch
            label={`Alert ${alert.name} ${alert.isActive ? "on" : "off"}`}
            defaultChecked={alert.isActive}
            onCheckedChange={(v) =>
              start(async () => {
                await toggleAlertAction(alert.id, v);
                toast.success(v ? "Alert turned on" : "Alert paused");
              })
            }
          />
          <span className="w-7">{alert.isActive ? "On" : "Off"}</span>
        </label>
        <Button asChild variant="ghost" size="sm">
          <Link href={searchUrl}>See jobs</Link>
        </Button>
        <Tooltip content="Edit alert">
          <Button variant="ghost" size="icon" aria-label="Edit alert" onClick={() => setEditing(true)}>
            <Pencil />
          </Button>
        </Tooltip>
        <Tooltip content="Delete alert">
          <Button variant="ghost" size="icon" aria-label="Delete alert" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
          </Button>
        </Tooltip>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent title="Edit alert" description={description}>
          <form action={action} className="grid gap-4">
            <input type="hidden" name="id" value={alert.id} />
            <input type="hidden" name="query" value={query} />
            <FormMessage state={state} />
            <Field label="Alert name" error={state.fieldErrors?.name}>
              {({ id, describedBy, invalid }) => <Input id={id} name="name" defaultValue={alert.name} maxLength={60} aria-describedby={describedBy} aria-invalid={invalid} />}
            </Field>
            <Field label="How often">
              {({ id }) => (
                <Select id={id} name="frequency" defaultValue={alert.frequency}>
                  <option value="INSTANT">As soon as jobs are posted</option>
                  <option value="DAILY">Daily summary</option>
                  <option value="WEEKLY">Weekly summary</option>
                </Select>
              )}
            </Field>
            <p className="text-sm text-muted">
              To change the search itself,{" "}
              <Link href={searchUrl} className="font-semibold underline">
                open the search
              </Link>{" "}
              and create a new alert.
            </p>
            <SubmitButton pendingText="Saving…">Save alert</SubmitButton>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title={`Delete “${alert.name}”?`} description="You'll stop getting notifications for this search.">
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Keep alert</Button>
            </DialogClose>
            <Button
              variant="danger"
              loading={pending}
              onClick={() =>
                start(async () => {
                  await deleteAlertAction(alert.id);
                  toast.success("Alert deleted");
                  setConfirmDelete(false);
                })
              }
            >
              Delete alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}
