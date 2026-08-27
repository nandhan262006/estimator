"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCoverageOption } from "@/lib/estimator/catalog";
import { formatINR } from "@/lib/estimator/format";
import { maxReelsFor } from "@/lib/estimator/state";
import { indexSubEvents } from "@/lib/estimator/pricing";
import { useEstimator } from "@/lib/estimator/state-provider";
import type { EventTemplate, ID, PriceRange, SubEventDef } from "@/lib/estimator/types";
import { ToggleChip } from "../primitives";

function coveragePrice(
  template: EventTemplate,
  subEventId: ID,
  coverageId: ID,
  subMap: Map<ID, SubEventDef>,
): PriceRange | undefined {
  return subMap.get(subEventId)?.coverage?.[coverageId] ?? template.defaultCoveragePrices[coverageId];
}

function reelPrice(template: EventTemplate, subEventId: ID, subMap: Map<ID, SubEventDef>): PriceRange {
  return subMap.get(subEventId)?.reel ?? template.defaultReelPrice;
}

export function CoverageOnlyStep() {
  const { state, template, dispatch } = useEstimator();
  const [open, setOpen] = useState<Record<ID, boolean>>({});
  const subMap = useMemo(() => (template ? indexSubEvents(template.subEvents) : new Map<ID, SubEventDef>()), [template]);

  if (!template) return null;

  const firstId = state.selectedSubEvents[0];
  const isOpen = (id: ID) => open[id] ?? id === firstId;
  const toggle = (id: ID) => setOpen((o) => ({ ...o, [id]: !isOpen(id) }));

  if (state.selectedSubEvents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Select at least one sub-event first.
      </p>
    );
  }

  return (
    <section className="animate-fade-in-up flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Coverage selection
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          For every selected sub-event, choose the photography, videography
          coverage and reels you need. Prices update instantly.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {state.selectedSubEvents.map((subId) => {
          const sub = subMap.get(subId);
          const cfg = state.subEventConfig[subId];
          if (!sub || !cfg) return null;

          const parts: string[] = [];
          if (cfg.coverage.length) parts.push(`${cfg.coverage.length} coverage`);
          if (cfg.reels > 0) parts.push(`${cfg.reels} reel${cfg.reels > 1 ? "s" : ""}`);
          const summary = parts.length ? parts.join(" \u00b7 ") : "No coverage selected";

          const maxReels = maxReelsFor(template, subId);

          return (
            <div key={subId} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md">
              <button
                type="button"
                onClick={() => toggle(subId)}
                aria-expanded={isOpen(subId)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors duration-200 hover:bg-muted/30"
              >
                <span className="flex min-w-0 items-center gap-3 overflow-hidden">
                  <span className="truncate font-medium">{sub.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {summary}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
                    isOpen(subId) && "rotate-180",
                  )}
                />
              </button>

              {isOpen(subId) && (
                <div className="flex flex-col gap-5 border-t border-border p-4 bg-muted/10">
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Coverage
                    </span>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {template.coverageOptions.map((id) => {
                        const opt = getCoverageOption(id);
                        if (!opt) return null;
                        const price = coveragePrice(template, subId, id, subMap);
                        return (
                          <ToggleChip
                            key={id}
                            iconKey={opt.icon}
                            label={opt.label}
                            description={opt.description}
                            selected={cfg.coverage.includes(id)}
                            priceLabel={
                              price ? formatINR(price.value) : undefined
                            }
                            onClick={() =>
                              dispatch({
                                type: "TOGGLE_COVERAGE",
                                subEventId: subId,
                                coverageId: id,
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Instagram reels
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatINR(reelPrice(template, subId, subMap).value)} / reel
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {Array.from({ length: maxReels + 1 }).map((_, n) => {
                        const selected = cfg.reels === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() =>
                              dispatch({
                                type: "SET_REELS",
                                subEventId: subId,
                                reels: n,
                              })
                            }
                            aria-pressed={selected}
                            className={cn(
                              "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all duration-200",
                              selected
                                ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                                : "border-border hover:bg-muted/50 hover:border-foreground/20",
                            )}
                          >
                            {n === 0 ? "None" : n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
