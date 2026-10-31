"use client";

import { useActionState, useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { SubmitButton } from "@/components/forms";
import { sendMessageAction } from "@/server/account-actions";

export function Composer({ conversationId }: { conversationId: string }) {
  const [state, action] = useActionState(sendMessageAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const last = useRef<unknown>(null);
  useEffect(() => {
    if (state !== last.current && state.ok) formRef.current?.reset();
    last.current = state;
  }, [state]);
  const err = state.error ?? state.fieldErrors?.body?.[0];
  return (
    <form ref={formRef} action={action} className="border-t border-line p-3">
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex items-end gap-2">
        <label htmlFor="composer" className="sr-only">
          Write a message
        </label>
        <textarea
          id="composer"
          name="body"
          rows={2}
          maxLength={4000}
          placeholder="Write a message"
          aria-invalid={Boolean(err)}
          aria-describedby={err ? "composer-err" : undefined}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) formRef.current?.requestSubmit();
          }}
          className="min-h-11 flex-1 resize-none rounded-[12px] border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
        <SubmitButton size="icon" aria-label="Send message" className="size-11">
          <SendHorizontal />
        </SubmitButton>
      </div>
      {err && (
        <p id="composer-err" className="mt-1.5 text-sm text-danger" role="alert">
          {err}
        </p>
      )}
      <p className="mt-1 hidden text-xs text-muted sm:block">Press Ctrl + Enter to send.</p>
    </form>
  );
}
