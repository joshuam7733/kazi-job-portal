"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Input, Switch } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import type { ActionState } from "@/server/action-utils";
import { addIndustryAction, addLocationAction, saveCategoryAction, toggleTaxonomyAction } from "@/server/admin-actions";

function useResetOnSuccess(state: ActionState) {
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef<unknown>(null);
  useEffect(() => {
    if (state !== last.current && state.ok) {
      if (state.message) toast.success(state.message);
      ref.current?.reset();
    }
    last.current = state;
  }, [state]);
  return ref;
}

export function CategoryEditor({ category, icons }: { category?: { id: string; name: string; icon: string; sortOrder: number }; icons: string[] }) {
  const [state, action] = useActionState(saveCategoryAction, {});
  const ref = useResetOnSuccess(state);
  const err = state.fieldErrors?.name?.[0];
  return (
    <form ref={ref} action={action} className="flex flex-1 flex-wrap items-center gap-2">
      {category && <input type="hidden" name="id" value={category.id} />}
      <label className="sr-only" htmlFor={`cat-name-${category?.id ?? "new"}`}>
        Category name
      </label>
      <Input id={`cat-name-${category?.id ?? "new"}`} name="name" defaultValue={category?.name} placeholder="Category name" className="h-9 w-56" aria-invalid={Boolean(err)} />
      <label className="sr-only" htmlFor={`cat-icon-${category?.id ?? "new"}`}>
        Icon
      </label>
      <select id={`cat-icon-${category?.id ?? "new"}`} name="icon" defaultValue={category?.icon ?? ""} className="h-9 rounded-[10px] border border-line-strong bg-surface px-2 text-sm">
        <option value="">Default icon</option>
        {icons.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`cat-order-${category?.id ?? "new"}`}>
        Sort order
      </label>
      <Input id={`cat-order-${category?.id ?? "new"}`} name="sortOrder" type="number" min={0} max={999} defaultValue={category?.sortOrder ?? 0} className="h-9 w-20" />
      <SubmitButton size="sm" variant="secondary" pendingText="Saving…">
        {category ? "Save" : "Add category"}
      </SubmitButton>
      {(err || state.error) && <p className="w-full text-sm text-danger">{err ?? state.error}</p>}
    </form>
  );
}

export function TaxonomyToggle({ kind, id, field, value, label }: { kind: "category" | "industry" | "location"; id: string; field: "isActive" | "isFeatured"; value: boolean; label: string }) {
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold" aria-busy={pending}>
      <Switch
        label={label}
        defaultChecked={value}
        onCheckedChange={(v) =>
          start(async () => {
            const res = await toggleTaxonomyAction(kind, id, field, v);
            if (res.error) toast.error(res.error);
          })
        }
      />
      {label}
    </label>
  );
}

export function AddIndustryForm() {
  const [state, action] = useActionState(addIndustryAction, {});
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="mt-4 flex gap-2">
      <label htmlFor="new-industry" className="sr-only">
        Industry name
      </label>
      <Input id="new-industry" name="name" placeholder="New industry" className="h-9" aria-invalid={Boolean(state.fieldErrors?.name)} />
      <SubmitButton size="sm" variant="secondary">
        Add
      </SubmitButton>
      <FormMessage state={{ error: state.fieldErrors?.name?.[0] ?? state.error }} />
    </form>
  );
}

export function AddLocationForm() {
  const [state, action] = useActionState(addLocationAction, {});
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <label htmlFor="loc-city" className="sr-only">
        City
      </label>
      <Input id="loc-city" name="city" placeholder="City" className="h-9" aria-invalid={Boolean(state.fieldErrors?.city)} />
      <label htmlFor="loc-region" className="sr-only">
        Region
      </label>
      <Input id="loc-region" name="region" placeholder="Region (optional)" className="h-9" />
      <label htmlFor="loc-country" className="sr-only">
        Country
      </label>
      <Input id="loc-country" name="country" defaultValue="Uganda" className="h-9" />
      <SubmitButton size="sm" variant="secondary">
        Add
      </SubmitButton>
      <FormMessage state={{ error: state.fieldErrors?.city?.[0] ?? state.fieldErrors?.country?.[0] ?? state.error }} className="sm:col-span-4" />
    </form>
  );
}
