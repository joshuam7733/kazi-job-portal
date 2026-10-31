"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { withdrawApplicationAction } from "@/server/job-actions";

export function WithdrawButton({ applicationId, jobTitle }: { applicationId: string; jobTitle: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="text-danger">
          Withdraw application
        </Button>
      </DialogTrigger>
      <DialogContent title={`Withdraw from ${jobTitle}?`} description="The employer will be told you've withdrawn. You can't re-apply to this job afterwards.">
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost">Keep application</Button>
          </DialogClose>
          <Button
            variant="danger"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await withdrawApplicationAction(applicationId);
                if (res.error) toast.error(res.error);
                else {
                  toast.success("Application withdrawn");
                  setOpen(false);
                }
              })
            }
          >
            Withdraw application
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
