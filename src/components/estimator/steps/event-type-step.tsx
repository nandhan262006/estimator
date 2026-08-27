"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { defaultSubEventsFor } from "@/lib/estimator/state";
import { useEstimator } from "@/lib/estimator/state-provider";
import { Icon } from "../icons";

export function EventTypeStep() {
  const { templates, state, dispatch } = useEstimator();
  const [expanded, setExpanded] = useState<string | null>(null);
  const selectedId = state.eventTypeId;

  const select = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    dispatch({
      type: "SET_EVENT_TYPE",
      eventTypeId: id,
      defaultSubEvents: defaultSubEventsFor(template),
      albumBasePages: template.album.basePages,
    });
    setExpanded(id);
  };

  return (
    <section className="animate-fade-in-up flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          What are you celebrating?
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          Pick an event type to load the relevant package template.
        </p>
      </header>

      <div className="flex flex-wrap gap-2.5">
        {templates.map((t) => {
          const isExpanded = expanded === t.id;
          const isSelected = selectedId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              aria-expanded={isExpanded}
              className={cn(
                "group relative inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300",
                isExpanded
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                  : isSelected
                    ? "border-primary/40 bg-primary/5"
                    : "border-border hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm",
              )}
            >
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-all duration-300",
                  isExpanded
                    ? "bg-primary text-primary-foreground"
                    : isSelected
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                )}
              >
                <Icon name={t.icon} className="size-3.5" />
              </div>
              <span>{t.name}</span>
              {isSelected && !isExpanded && (
                <span className="ml-0.5 size-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {(() => {
        const t = expanded ? templates.find((tpl) => tpl.id === expanded) : null;
        if (!t || !(t.description || t.tagline)) return null;
        return (
          <div className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.description || t.tagline}
            </p>
          </div>
        );
      })()}
    </section>
  );
}
