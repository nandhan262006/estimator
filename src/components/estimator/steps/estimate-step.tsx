"use client";

import {
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/estimator/format";
import { useEstimator } from "@/lib/estimator/state-provider";

export function EstimateStep() {
  const { estimate, deliverables, recommendations, dispatch } =
    useEstimator();

  const subEventGroups = new Map<string, string>();
  const subEventItems = new Map<string, Map<string, typeof estimate.items>>();
  const subEventOrder: string[] = [];

  for (const item of estimate.items) {
    const subName = item.detail ?? "General";
    if (!subEventItems.has(subName)) {
      subEventItems.set(subName, new Map());
      subEventOrder.push(subName);
    }
    const groups = subEventItems.get(subName)!;
    if (!groups.has(item.group)) {
      groups.set(item.group, []);
    }
    groups.get(item.group)!.push(item);
    subEventGroups.set(subName, item.detail ?? "");
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Your estimate</h1>
        <p className="text-sm text-muted-foreground">
          Here is the approximate price breakdown based on your selections.
        </p>
      </header>

      {estimate.isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Select services in the previous steps to see your estimate.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-primary/5 p-5">
            <span className="text-xs text-muted-foreground">
              Estimated total (approximate)
            </span>
            <div className="mt-1 font-heading text-2xl font-semibold tabular-nums sm:text-3xl">
              {formatINR(estimate.total)}
            </div>
            {estimate.subEventCount > 0 && (
              <span className="mt-2 inline-block text-sm text-muted-foreground">
                Across {estimate.subEventCount} sub-event
                {estimate.subEventCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {subEventOrder.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-lg font-medium">
                Price breakdown
              </h2>
              <div className="flex flex-col gap-5">
                {subEventOrder.map((subName) => {
                  const groups = subEventItems.get(subName)!;
                  return (
                    <div key={subName} className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {subName}
                      </span>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        {[...groups.entries()].map(([group, items]) => (
                          <div key={group} className="mb-3 last:mb-0">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {group}
                            </span>
                            <div className="mt-1.5 flex flex-col gap-1">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start justify-between gap-3 rounded-md bg-background p-2 text-sm"
                                >
                                  <span className="font-medium">{item.label}</span>
                                  <span className="shrink-0 tabular-nums">
                                    {formatINR(item.value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {deliverables.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-3">
                <h2 className="font-heading text-lg font-medium">
                  What you&apos;ll receive
                </h2>
                <div className="flex flex-col gap-5">
                  {deliverables.map((group) => (
                    <div key={group.group} className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {group.group}
                      </span>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex flex-col gap-1">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-2 rounded-md bg-background p-2 text-sm"
                            >
                              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                              <span className="flex flex-wrap items-baseline gap-x-1.5">
                                <span>{item.label}</span>
                                {item.detail && (
                                  <span className="text-xs text-muted-foreground">
                                    ({item.detail})
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {recommendations.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-medium">
                Smart suggestions
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.ruleId}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <span className="min-w-0 text-sm text-muted-foreground">
                    {rec.message}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() =>
                      dispatch({
                        type: "APPLY_RECOMMENDATION",
                        suggest: rec.suggest,
                        targetSubEvents: rec.targetSubEvents,
                      })
                    }
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      <p className="text-xs text-muted-foreground">
        Disclaimer: This is only an approximate estimate. The final quotation
        may vary depending on event duration, location, travel, venue
        restrictions and custom requirements. Please contact us for a detailed,
        finalised quote.
      </p>
    </section>
  );
}
