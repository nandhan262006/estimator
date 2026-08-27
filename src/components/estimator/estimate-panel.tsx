"use client";

import { ReceiptIndianRupee, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/estimator/format";
import { useEstimator } from "@/lib/estimator/state-provider";

export function EstimatePanel({ compact = false }: { compact?: boolean }) {
  const { estimate, recommendations, deliverables, dispatch } = useEstimator();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <ReceiptIndianRupee className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Live estimate</h2>
            {estimate.subEventCount > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {estimate.subEventCount} sub-event{estimate.subEventCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {!estimate.isEmpty && recommendations.length > 0 && (
        <button
          type="button"
          onClick={() => dispatch({ type: "SET_STEP", step: 7 })}
          className="flex items-center gap-2 self-start rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-all duration-200 hover:bg-amber-500/15"
        >
          <Sparkles className="size-3.5" />
          {recommendations.length} smart suggestion{recommendations.length > 1 ? "s" : ""}
        </button>
      )}

      <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-5">
        {estimate.isEmpty ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select an event and add coverage to see your estimated price range.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estimated total
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {formatINR(estimate.total)}
            </span>
            <span className="text-[11px] text-muted-foreground">approximate</span>
          </div>
        )}
      </div>

      {!compact && deliverables.length > 0 && (
        <>
          <Separator />
          <div className="flex max-h-[44vh] flex-col gap-4 overflow-y-auto pr-1">
            {deliverables.map((group) => (
              <div key={group.group} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
                  {group.group}
                </span>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <span key={item.id} className="block text-xs text-muted-foreground pl-3 border-l-2 border-primary/20">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
