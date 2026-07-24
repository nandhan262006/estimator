/**
 * Pure deliverables generator.
 *
 * Deliverables are never chosen by the user — they are derived from the
 * current selection using the template's declarative deliverable rules. This
 * keeps the output consistent with what the team will actually deliver.
 *
 * Three output formats:
 * - `generateDeliverableTexts` — flat sentence-style list for the UI and PDF.
 * - `generateDeliverables` — flat groups (Coverage, Add-ons, etc.) for the
 *   estimate panel sidebar.
 * - `generateSubEventDeliverables` — structured by sub-event with services
 *   listed under each, for backward-compatible PDF and admin views.
 */
import type {
  Deliverable,
  DeliverableGroup,
  EstimatorState,
  EventTemplate,
  SubEventDeliverable,
} from "./types";

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function numberWord(n: number): string {
  const words = [
    "Zero", "One", "Two", "Three", "Four", "Five",
    "Six", "Seven", "Eight", "Nine", "Ten",
  ];
  return words[n] ?? `${n}`;
}

function subMatchesRule(
  subId: string,
  rule: { when: { subEvents?: string[] } },
): boolean {
  if (!rule.when.subEvents) return true;
  return rule.when.subEvents.includes(subId);
}

/**
 * Generate a clean, flat list of deliverable sentences.
 * This is the primary format used by the deliverables step UI and the PDF.
 */
export function generateDeliverableTexts(
  state: EstimatorState,
  template: EventTemplate,
): string[] {
  const texts: string[] = [];
  if (state.selectedSubEvents.length === 0) return texts;

  const globalIds = new Set(
    template.deliverableRules
      .filter((r) => r.when.global)
      .map((r) => r.id),
  );

  // 1. Global/overview photography & videography deliverables
  for (const rule of template.deliverableRules) {
    if (!rule.when.global) continue;
    if (!rule.when.coverage) continue;

    const anySubHasCoverage = state.selectedSubEvents.some((subId) => {
      if (!subMatchesRule(subId, rule)) return false;
      const cfg = state.subEventConfig[subId];
      if (!cfg) return false;
      return rule.when.coverage!.some((covId) => cfg.coverage.includes(covId));
    });
    if (anySubHasCoverage) {
      texts.push(rule.produce.label);
    }
  }

  // 2. Event-specific deliverables (cinematic trailers/films, couple shoot, etc.)
  // Also handles per-event coverage rules (drone etc.) with deduplication.
  const emittedRules = new Set<string>();
  for (const subId of state.selectedSubEvents) {
    const cfg = state.subEventConfig[subId];
    if (!cfg) continue;

    for (const rule of template.deliverableRules) {
      if (globalIds.has(rule.id)) continue;
      if (rule.when.reels) continue;
      if (rule.when.album) continue;
      if (rule.when.addOns) continue;
      if (!subMatchesRule(subId, rule)) continue;
      if (!rule.when.coverage) continue;

      for (const covId of rule.when.coverage) {
        if (cfg.coverage.includes(covId)) {
          if (!rule.when.subEvents && emittedRules.has(rule.id)) break;
          texts.push(rule.produce.label);
          emittedRules.add(rule.id);
          break;
        }
      }
    }
  }

  // 3. Add-on services
  for (const rule of template.deliverableRules) {
    if (!rule.when.addOns) continue;
    const subsWith = state.selectedSubEvents.filter((subId) => {
      if (!subMatchesRule(subId, rule)) return false;
      const cfg = state.subEventConfig[subId];
      if (!cfg) return false;
      return rule.when.addOns!.some((addonId) => cfg.addOns.includes(addonId));
    });
    if (subsWith.length > 0) {
      texts.push(rule.produce.label);
    }
  }

  // 4. Reels
  for (const rule of template.deliverableRules) {
    if (!rule.when.reels) continue;
    const subEventsWithReels: string[] = [];
    for (const subId of state.selectedSubEvents) {
      if (!subMatchesRule(subId, rule)) continue;
      const reels = state.subEventConfig[subId]?.reels ?? 0;
      if (reels > 0) {
        const sub = template.subEvents.find((s) => s.id === subId);
        subEventsWithReels.push(sub?.name ?? subId);
      }
    }
    if (subEventsWithReels.length > 0) {
      texts.push(
        `Instagram Reels for the ${subEventsWithReels.join(", ")}.`,
      );
    }
  }

  // 5. Album
  const a = state.album;
  if (a.required && a.typeId && a.sizeId && a.count > 0) {
    const type = template.album.types.find((t) => t.id === a.typeId);
    if (type) {
      const countWord = numberWord(a.count);
      const albumName = type.name.replace(/ Album$/, "");
      texts.push(
        `${countWord} ${albumName} Wedding Album${a.count > 1 ? "s" : ""} (${a.pages} sheets each).`,
      );
    }
  }

  // 6. Always-included footer
  if (state.selectedSubEvents.length > 0) {
    texts.push(
      "Complete Raw Footage from all selected events (the client is required to provide a hard drive for data transfer).",
    );
    texts.push(
      "All events will be captured using premium, high-end professional equipment to ensure exceptional image and video quality.",
    );
  }

  return texts;
}

/**
 * Group deliverables by sub-event. Each sub-event heading lists the
 * services selected for it. Albums are listed separately since they
 * are not scoped to a sub-event.
 */
export function generateSubEventDeliverables(
  state: EstimatorState,
  template: EventTemplate,
): SubEventDeliverable[] {
  const result: SubEventDeliverable[] = [];
  const seen = new Set<string>();
  const globalIds = new Set(
    template.deliverableRules
      .filter((r) => r.when.global)
      .map((r) => r.id),
  );

  for (const subId of state.selectedSubEvents) {
    const cfg = state.subEventConfig[subId];
    if (!cfg) continue;
    const sub = template.subEvents.find((s) => s.id === subId);
    const subName = sub?.name ?? subId;
    const services: { label: string; detail?: string; group: string }[] = [];

    for (const rule of template.deliverableRules) {
      if (globalIds.has(rule.id)) continue;
      if (rule.when.reels) continue;
      if (rule.when.album) continue;
      if (!subMatchesRule(subId, rule)) continue;

      if (rule.when.coverage && !rule.when.addOns) {
        for (const coverageId of rule.when.coverage) {
          if (!cfg.coverage.includes(coverageId)) continue;
          const key = `coverage-${subId}-${coverageId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          services.push({
            label: rule.produce.label,
            detail: rule.produce.countPerSubEvent ? "1 sub-event" : undefined,
            group: rule.produce.group,
          });
        }
      }

      if (rule.when.addOns) {
        for (const addOnId of rule.when.addOns) {
          if (!cfg.addOns.includes(addOnId)) continue;
          const key = `addon-${subId}-${addOnId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          services.push({
            label: rule.produce.label,
            detail: rule.produce.countPerSubEvent ? "1 sub-event" : undefined,
            group: rule.produce.group,
          });
        }
      }
    }

    // Reels under this sub-event
    if (cfg.reels > 0) {
      for (const rule of template.deliverableRules) {
        if (!rule.when.reels) continue;
        if (!subMatchesRule(subId, rule)) continue;
        const key = `reels-${subId}-${rule.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          services.push({
            label: rule.produce.label,
            detail: plural(cfg.reels, "reel"),
            group: rule.produce.group,
          });
        }
      }
    }

    if (services.length > 0) {
      const groupMap = new Map<string, { label: string; detail?: string }[]>();
      const groupOrder: string[] = [];
      for (const svc of services) {
        if (!groupMap.has(svc.group)) {
          groupMap.set(svc.group, []);
          groupOrder.push(svc.group);
        }
        groupMap.get(svc.group)!.push({ label: svc.label, detail: svc.detail });
      }
      result.push({
        subEventId: subId,
        subEventName: subName,
        groups: groupOrder.map((g) => ({ group: g, services: groupMap.get(g)! })),
      });
    }
  }

  const album = state.album;
  if (album.required && album.typeId && album.sizeId) {
    const type = template.album.types.find((t) => t.id === album.typeId);
    const size = template.album.sizes.find((s) => s.id === album.sizeId);
    if (type && size) {
      result.push({
        subEventId: "__album__",
        subEventName: "Albums",
        groups: [
          {
            group: "Albums",
            services: [
              {
                label: `${album.count} \u00d7 ${type.name} (${size.name}, ${album.pages}p)`,
              },
            ],
          },
        ],
      });
    }
  }

  return result;
}

/**
 * Legacy flat-group deliverables (used by the estimate panel sidebar).
 */
export function generateDeliverables(
  state: EstimatorState,
  template: EventTemplate,
): DeliverableGroup[] {
  const groups = new Map<string, Deliverable[]>();
  const groupOrder: string[] = [];
  const globalIds = new Set(
    template.deliverableRules
      .filter((r) => r.when.global)
      .map((r) => r.id),
  );

  const ensure = (group: string) => {
    if (!groups.has(group)) {
      groups.set(group, []);
      groupOrder.push(group);
    }
  };

  for (const rule of template.deliverableRules) {
    const { when, produce } = rule;
    if (globalIds.has(rule.id)) continue;

    if (when.coverage) {
      for (const coverageId of when.coverage) {
        const subsWith = state.selectedSubEvents.filter((id) => {
          if (!subMatchesRule(id, rule)) return false;
          return state.subEventConfig[id]?.coverage.includes(coverageId);
        });
        if (subsWith.length === 0) continue;
        ensure(produce.group);
        groups.get(produce.group)!.push({
          id: rule.id,
          group: produce.group,
          label: produce.label,
          detail: produce.countPerSubEvent
            ? plural(subsWith.length, "sub-event")
            : undefined,
        });
      }
    }

    if (when.addOns) {
      for (const addOnId of when.addOns) {
        const subsWith = state.selectedSubEvents.filter((id) => {
          if (!subMatchesRule(id, rule)) return false;
          return state.subEventConfig[id]?.addOns.includes(addOnId);
        });
        if (subsWith.length === 0) continue;
        ensure(produce.group);
        groups.get(produce.group)!.push({
          id: rule.id,
          group: produce.group,
          label: produce.label,
          detail: produce.countPerSubEvent
            ? plural(subsWith.length, "sub-event")
            : undefined,
        });
      }
    }

    if (when.reels) {
      const totalReels = state.selectedSubEvents.reduce(
        (sum, id) => {
          if (!subMatchesRule(id, rule)) return sum;
          return sum + (state.subEventConfig[id]?.reels ?? 0);
        },
        0,
      );
      if (totalReels > 0) {
        ensure(produce.group);
        groups.get(produce.group)!.push({
          id: rule.id,
          group: produce.group,
          label: produce.label,
          detail: plural(totalReels, "reel"),
        });
      }
    }

    if (when.album) {
      const a = state.album;
      if (a.required && a.typeId && a.sizeId) {
        const type = template.album.types.find((t) => t.id === a.typeId);
        const size = template.album.sizes.find((s) => s.id === a.sizeId);
        if (type && size) {
          ensure(produce.group);
          groups.get(produce.group)!.push({
            id: rule.id,
            group: produce.group,
            label: produce.label,
            detail: `${a.count} \u00d7 ${type.name} (${size.name}, ${a.pages}p)`,
          });
        }
      }
    }
  }

  return groupOrder.map((group) => ({ group, items: groups.get(group)! }));
}
