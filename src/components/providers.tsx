"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "!rounded-[14px] !border !border-line !bg-surface !text-ink !shadow-[var(--shadow-overlay)] !font-sans",
                description: "!text-muted",
              },
            }}
          />
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
