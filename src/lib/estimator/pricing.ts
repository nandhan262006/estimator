import type {
  EstimateBreakdown,
  EventTemplate,
  ID,
  LineItem,
  SubEventDef,
} from "./types";
import { getCoverageOption, getAddOnOption } from "./catalog";

export function calculateEstimate(
  state: { selectedSubEvents: ID[]; subEventConfig: Record<ID, { coverage: ID[]; addOns: ID[]; reels: number }>; album: { required: boolean; typeId: ID | null; sizeId: ID | null; pages: number; count: number } },
  template: EventTemplate,
): EstimateBreakdown {
  const items: LineItem[] = [];
  let total = 0;
  let subEventCount = 0;

  const validCoverage = new Set(template.coverageOptions);
  const validAddOns = new Set(template.addOnOptions);
  const subMap = indexSubEvents(template.subEvents);

  for (const subEventId of state.selectedSubEvents) {
    const cfg = state.subEventConfig[subEventId];
    if (!cfg) continue;
    const hasAnything =
      cfg.coverage.length > 0 || cfg.addOns.length > 0 || cfg.reels > 0;
    if (!hasAnything) continue;
    subEventCount += 1;
    const sub = subMap.get(subEventId);
    const name = sub?.name ?? subEventId;

    for (const coverageId of template.coverageOptions) {
      if (!cfg.coverage.includes(coverageId)) continue;
      if (!validCoverage.has(coverageId)) continue;
      const override = sub?.coverage?.[coverageId];
      const price = override ?? template.defaultCoveragePrices[coverageId];
      if (!price) continue;
      items.push({
        id: `coverage-${subEventId}-${coverageId}`,
        group: "Coverage",
        label: labelForCoverage(coverageId),
        detail: name,
        value: price.value,
      });
      total += price.value;
    }

    for (const addOnId of template.addOnOptions) {
      if (!cfg.addOns.includes(addOnId)) continue;
      if (!validAddOns.has(addOnId)) continue;
      const override = sub?.addOns?.[addOnId];
      const price = override ?? template.defaultAddOnPrices[addOnId];
      if (!price) continue;
      items.push({
        id: `addon-${subEventId}-${addOnId}`,
        group: "Add-on Services",
        label: labelForAddOn(addOnId),
        detail: name,
        value: price.value,
      });
      total += price.value;
    }

    if (cfg.reels > 0) {
      const price = sub?.reel ?? template.defaultReelPrice;
      items.push({
        id: `reels-${subEventId}`,
        group: "Reels",
        label: `${cfg.reels} Instagram reel${cfg.reels > 1 ? "s" : ""}`,
        detail: name,
        value: price.value * cfg.reels,
      });
      total += price.value * cfg.reels;
    }
  }

  // Album
  const albumState = state.album;
  if (albumState.required && albumState.sizeId) {
    const size = template.album.sizes.find((s) => s.id === albumState.sizeId);
    if (size) {
      const perAlbum = albumState.pages * size.multiplier * 600;
      const albumTotal = perAlbum * albumState.count;
      items.push({
        id: "album",
        group: "Albums",
        label: `${albumState.count} album${albumState.count > 1 ? "s" : ""}`,
        detail: `${size.name}, ${albumState.pages} pages each`,
        value: albumTotal,
      });
      total += albumTotal;
    }
  }

  const isEmpty = items.length === 0;

  return {
    items,
    total,
    subEventCount,
    isEmpty,
  };
}

export function indexSubEvents(subs: SubEventDef[]): Map<ID, SubEventDef> {
  const map = new Map<ID, SubEventDef>();
  for (const s of subs) map.set(s.id, s);
  return map;
}

function labelForCoverage(id: ID): string {
  return getCoverageOption(id)?.label ?? id;
}

function labelForAddOn(id: ID): string {
  return getAddOnOption(id)?.label ?? id;
}