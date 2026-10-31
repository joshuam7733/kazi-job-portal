"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/field";
import { setCompanyFlagsAction } from "@/server/admin-actions";

export function CompanyToggles({ id, name, featured, suspended }: { id: string; name: string; featured: boolean; suspended: boolean }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const run = (flags: { isSuspended?: boolean; isFeatured?: boolean }) =>
    start(async () => {
      const res = await setCompanyFlagsAction(id, flags);
      if (res.error) toast.error(res.error);
      else toast.success(res.message ?? "Saved");
      setConfirm(false);
    });
  return (
    <div className="flex items-center gap-4" aria-busy={pending}>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <Switch label={`Feature ${name}`} defaultChecked={featured} onCheckedChange={(v) => run({ isFeatured: v })} /> Featured
      </label>
      {suspended ? (
        <Button size="sm" variant="secondary" loading={pending} onClick={() => run({ isSuspended: false })}>
          Reinstate
        </Button>
      ) : (
        <Button size="sm" variant="secondary" className="text-danger" onClick={() => setConfirm(true)}>
          Suspend
        </Button>
      )}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title={`Suspend ${name}?`} description="All of their jobs disappear from search and they can't post until reinstated. Members are notified.">
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button variant="danger" loading={pending} onClick={() => run({ isSuspended: true })}>
              Suspend company
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
