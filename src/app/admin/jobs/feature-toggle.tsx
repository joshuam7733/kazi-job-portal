"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/field";
import { toggleJobFeaturedAction } from "@/server/admin-actions";

export function FeatureToggle({ id, featured }: { id: string; featured: boolean }) {
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold" aria-busy={pending}>
      <Switch
        label="Feature on homepage"
        defaultChecked={featured}
        onCheckedChange={(v) =>
          start(async () => {
            const res = await toggleJobFeaturedAction(id, v);
            if (res.error) toast.error(res.error);
            else toast.success(res.message ?? "Saved");
          })
        }
      />
      Featured on homepage
    </label>
  );
}
