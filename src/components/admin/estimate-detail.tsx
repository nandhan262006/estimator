"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { EstimateBreakdown, DeliverableGroup, EstimatorState } from "@/lib/estimator/types";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

const GROUP_ORDER = ["Coverage", "Add-on Services", "Reels", "Albums"];

interface SavedEstimate {
  state?: { selectedSubEvents?: unknown[] };
  estimate?: EstimateBreakdown;
  deliverables?: DeliverableGroup[];
}

function parseEstimateData(raw: string): SavedEstimate | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if ("estimate" in parsed) return parsed as SavedEstimate;
      return { state: parsed as EstimatorState };
    }
    return null;
  } catch {
    return null;
  }
}

export function EstimateDetail({ estimateData }: { estimateData: string }) {
  const [open, setOpen] = useState(false);
  const data = parseEstimateData(estimateData);

  if (!data) {
    return <span className="text-xs text-muted-foreground">No details available</span>;
  }

  const estimate = data.estimate;
  const deliverables = data.deliverables;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        {estimate ? `Estimate: ${formatINR(estimate.total)}` : "View details"}
      </button>

      {open && (
        <div className="mt-2 rounded-md border bg-muted/30 p-3">
          {estimate && !estimate.isEmpty ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Estimated Total</span>
                <span className="text-sm font-bold tabular-nums text-primary">
                  {formatINR(estimate.total)}
                </span>
              </div>

              {GROUP_ORDER.map((group) => {
                const items = estimate.items.filter((i) => i.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {group}
                    </span>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 text-xs"
                      >
                        <span>{item.label}{item.detail ? ` (${item.detail})` : ""}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatINR(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Estimate breakdown not available for this entry.
            </p>
          )}

          {deliverables && deliverables.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 border-t pt-3">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Deliverables
              </span>
              {deliverables.map((group) => (
                <div key={group.group} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-foreground">
                    {group.group}
                  </span>
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-xs pl-2">
                      <span className="text-primary/70">&#10003;</span>
                      <span>{item.label}{item.detail ? ` (${item.detail})` : ""}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
