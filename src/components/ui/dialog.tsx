"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

function Overlay() {
  return <DialogPrimitive.Overlay className="animate-overlay fixed inset-0 z-[60] bg-[#0b1220]/50 backdrop-blur-[2px]" />;
}

export function DialogContent({
  title,
  description,
  children,
  className,
  hideClose,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "animate-dialog fixed left-1/2 top-1/2 z-[61] max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] border border-line bg-surface p-6 shadow-[var(--shadow-overlay)]",
          className,
        )}
      >
        <div className="pr-8">
          <DialogPrimitive.Title className="font-display text-xl font-semibold">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-sm text-muted">{description}</DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
        </div>
        <div className="mt-5">{children}</div>
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Bottom sheet on mobile, right-hand drawer on desktop. */
export function SheetContent({
  title,
  description,
  children,
  className,
  side = "auto",
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  side?: "auto" | "right" | "left";
}) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-[61] flex flex-col bg-surface shadow-[var(--shadow-overlay)]",
          side === "auto" &&
            "animate-sheet inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[20px] md:animate-drawer md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-[20px]",
          side === "right" && "animate-drawer inset-y-0 right-0 w-[min(100vw,480px)] rounded-l-[20px]",
          side === "left" && "inset-y-0 left-0 w-[min(86vw,320px)] rounded-r-[20px]",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <DialogPrimitive.Title className="font-display text-lg font-semibold">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-0.5 text-sm text-muted">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
