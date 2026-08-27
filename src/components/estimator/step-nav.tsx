"use client";

import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS } from "@/lib/estimator/state";
import { useEstimator } from "@/lib/estimator/state-provider";

export function StepNav() {
  const { state } = useEstimator();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide" role="navigation" aria-label="Steps">
      {STEPS.map((label, i) => {
        const isCurrent = state.step === i;
        const isDone = i < state.step;
        return (
          <div key={label} className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (isDone) {
                  // Allow clicking completed steps
                }
              }}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300",
                isCurrent
                  ? "bg-primary/10 text-primary"
                  : isDone
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : isDone
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground/60",
                )}
              >
                {isDone ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="size-3 shrink-0 text-muted-foreground/30" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
