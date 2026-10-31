"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;

export function DropdownMenuContent({ className, align = "end", ...props }: DM.DropdownMenuContentProps) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={8}
        className={cn(
          "animate-dialog z-[70] min-w-52 rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow-overlay)]",
          className,
        )}
        {...props}
      />
    </DM.Portal>
  );
}

export function DropdownMenuItem({ className, destructive, ...props }: DM.DropdownMenuItemProps & { destructive?: boolean }) {
  return (
    <DM.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm font-medium outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-2 data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted",
        destructive && "text-danger [&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: DM.DropdownMenuLabelProps) {
  return <DM.Label className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted", className)} {...props} />;
}

export function DropdownMenuSeparator() {
  return <DM.Separator className="my-1 h-px bg-line" />;
}
