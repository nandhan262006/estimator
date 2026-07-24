"use client";

import { CircleCheck } from "lucide-react";
import { useEstimator } from "@/lib/estimator/state-provider";

export function DeliverablesStep() {
  const { deliverableTexts } = useEstimator();

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Deliverables</h1>
        <p className="text-sm text-muted-foreground">
          Deliverables are generated automatically based on the services you
          have selected. You do not need to manually choose them.
        </p>
      </header>

      {deliverableTexts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <CircleCheck className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No deliverables have been generated yet. Select coverage, add-on
            services, reels, or an album to see what you&apos;ll receive.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/20 p-5">
          <ul className="flex flex-col gap-3">
            {deliverableTexts.map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
