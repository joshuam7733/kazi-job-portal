"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/forms";
import { addResourceCategoryAction } from "@/server/admin-actions";

export function AddResourceCategory() {
  const [state, action] = useActionState(addResourceCategoryAction, {});
  return (
    <form action={action} className="mt-4 flex flex-wrap gap-2">
      <label htmlFor="res-cat" className="sr-only">
        New category name
      </label>
      <Input id="res-cat" name="name" placeholder="New category" className="h-9 max-w-xs" aria-invalid={Boolean(state.fieldErrors?.name)} />
      <SubmitButton size="sm" variant="secondary">
        Add category
      </SubmitButton>
      <FormMessage state={{ ok: state.ok, message: state.message, error: state.fieldErrors?.name?.[0] ?? state.error }} className="w-full" />
    </form>
  );
}
