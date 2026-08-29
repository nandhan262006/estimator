"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAddOnOption } from "@/lib/estimator/catalog";
import { formatINR } from "@/lib/estimator/format";
import { indexSubEvents } from "@/lib/estimator/pricing";
import { useEstimator } from "@/lib/estimator/state-provider";
import type { EventTemplate, ID, PriceRange, SubEventDef } from "@/lib/estimator/types";
import { ToggleChip } from "../primitives";

function addOnPrice(
  template: EventTemplate,
  subEventId: ID,
  addOnId: ID,
  subMap: Map<ID, SubEventDef>,
): PriceRange | undefined {
  return subMap.get(subEventId)?.addOns?.[addOnId] ?? template.defaultAddOnPrices[addOnId];
}

export function AddOnStep() {
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

  if (template.addOnOptions.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">
            Additional services
          </h1>
          <p className="text-sm text-muted-foreground">
            No add-on services are available for this event type. You can skip
            this step.
          </p>
        </header>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">
          Additional services
        </h1>
        <p className="text-sm text-muted-foreground">
          For each selected sub-event, optionally add extra services such as
          LED screens, live streaming, and more.
        </p>
      </header>

      <div className="flex flex-col gap-2.5">
        {state.selectedSubEvents.map((subId) => {
          const sub = subMap.get(subId);
          const cfg = state.subEventConfig[subId];
          if (!sub || !cfg) return null;

          const summary =
            cfg.addOns.length > 0
              ? `${cfg.addOns.length} add-on service${cfg.addOns.length > 1 ? "s" : ""}`
              : "None selected";

          return (
            <div key={subId} className="rounded-xl border">
              <button
                type="button"
                onClick={() => toggle(subId)}
                aria-expanded={isOpen(subId)}
                className="flex w-full items-center justify-between gap-2 p-3 text-left"
              >
                <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                  <span className="truncate font-medium">{sub.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {summary}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen(subId) && "rotate-180",
                  )}
                />
              </button>

              {isOpen(subId) && (
                <div className="flex flex-col gap-3 border-t p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {template.addOnOptions.map((id) => {
                      const opt = template.addOnCatalog?.[id] ?? getAddOnOption(id);
                      if (!opt) return null;
                      const price = addOnPrice(template, subId, id, subMap);
                      return (
                        <ToggleChip
                          key={id}
                          iconKey={opt.icon}
                          label={opt.label}
                          description={opt.description}
                          selected={cfg.addOns.includes(id)}
                          priceLabel={
                            price ? formatINR(price.value) : undefined
                          }
                          onClick={() =>
                            dispatch({
                              type: "TOGGLE_ADDON",
                              subEventId: subId,
                              addOnId: id,
                            })
                          }
                        />
                      );
                    })}
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
