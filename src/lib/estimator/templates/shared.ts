import type {
  AlbumDefaults,
  DeliverableRule,
  ID,
  PriceRange,
  RecommendationRule,
  SubEventDef,
} from "../types";

export const DEFAULT_MAX_REELS = 3;

export const DEFAULT_COVERAGE_PRICES: Record<ID, PriceRange> = {
  traditional_photography: { value: 12000 },
  traditional_videography: { value: 16000 },
  candid_photography: { value: 35000 },
  cinematic_videography: { value: 45000 },
  drone: { value: 20000 },
};

export const DEFAULT_ADDON_PRICES: Record<ID, PriceRange> = {
  led_screen: { value: 25000 },
  live_streaming: { value: 15000 },
  ai_gallery: { value: 25000 },
  instant_teaser: { value: 20000 },
};

export const DEFAULT_REEL_PRICE: PriceRange = { value: 6000 };

export const ALBUM_DEFAULTS: AlbumDefaults = {
  types: [
    {
      id: "magazine",
      name: "Magazine Album",
      basePrice: { value: 18000 },
      perPagePrice: { value: 150 },
    },
    {
      id: "premium",
      name: "Premium Photographic",
      basePrice: { value: 22000 },
      perPagePrice: { value: 200 },
    },
    {
      id: "layflat",
      name: "Layflat Album",
      basePrice: { value: 32000 },
      perPagePrice: { value: 400 },
    },
    {
      id: "coffee_table",
      name: "Coffee Table Album",
      basePrice: { value: 45000 },
      perPagePrice: { value: 550 },
    },
  ],
  sizes: [
    { id: "12x36", name: '12" × 36"', multiplier: 1.0 },
    { id: "15x45", name: '15" × 45"', multiplier: 1.3 },
    { id: "20x60", name: '20" × 60"', multiplier: 1.8 },
    { id: "24x72", name: '24" × 72"', multiplier: 2.4 },
  ],
  basePages: 30,
  maxPages: 120,
  maxAlbums: 10,
};

const COVERAGE_DELIVERABLE_LABELS: Record<ID, string> = {
  traditional_photography: "Traditional Photography coverage (digitally edited soft copies)",
  traditional_videography: "Traditional Videography with documentary-style edited footage",
  candid_photography: "Curated & edited candid photographs (digital soft copies)",
  cinematic_videography: "Cinematic highlight film",
  drone: "Aerial Drone coverage (compiled reel)",
};

const ADDON_DELIVERABLE_LABELS: Record<ID, string> = {
  led_screen: "Live LED screen playback at the venue",
  live_streaming: "Live stream link for remote guests",
  ai_gallery: "AI-curated event gallery",
  instant_teaser: "Instant teaser highlight or same-day edit",
};

function addonDeliverableLabel(
  id: ID,
  catalog?: Record<ID, { label: string }>,
): string | undefined {
  if (catalog?.[id]) return catalog[id].label;
  return ADDON_DELIVERABLE_LABELS[id];
}

const DELIVERABLE_GROUP_COVERAGE = "Photography & Videography";
const DELIVERABLE_GROUP_ADDONS = "Add-on Services";
const DELIVERABLE_GROUP_EXTRAS = "Reels & Albums";

const CINEMATIC_EVENT_LABELS: Record<ID, string> = {
  engagement: "A Cinematic Engagement Trailer",
  wedding: "A Cinematic Wedding Film",
  reception: "A Cinematic Reception Film",
};

export function deliverableRulesFor(
  coverageIds: ID[],
  addonIds: ID[],
  addonCatalog?: Record<ID, { label: string }>,
): DeliverableRule[] {
  const rules: DeliverableRule[] = [];

  const hasAnyPhotography = coverageIds.some(
    (id) => id === "traditional_photography" || id === "candid_photography",
  );
  const hasAnyVideography = coverageIds.some(
    (id) => id === "traditional_videography" || id === "cinematic_videography",
  );

  if (hasAnyPhotography) {
    rules.push({
      id: "deliv-photos-global",
      when: { coverage: ["traditional_photography", "candid_photography"], global: true },
      produce: {
        group: DELIVERABLE_GROUP_COVERAGE,
        label: "Highlighted photographs from all selected events.",
      },
    });
  }

  if (hasAnyVideography) {
    rules.push({
      id: "deliv-videos-global",
      when: { coverage: ["traditional_videography", "cinematic_videography"], global: true },
      produce: {
        group: DELIVERABLE_GROUP_COVERAGE,
        label: "Edited documentary-style videos of all selected events.",
      },
    });
  }

  for (const id of coverageIds) {
    const label = COVERAGE_DELIVERABLE_LABELS[id];
    if (!label) continue;
    if (id === "traditional_photography" || id === "candid_photography") continue;
    if (id === "traditional_videography") continue;
    if (id === "cinematic_videography") continue;
    rules.push({
      id: `deliv-coverage-${id}`,
      when: { coverage: [id] },
      produce: {
        group: DELIVERABLE_GROUP_COVERAGE,
        label,
        countPerSubEvent: true,
      },
    });
  }

  for (const id of addonIds) {
    const label = addonDeliverableLabel(id, addonCatalog);
    if (!label) continue;
    rules.push({
      id: `deliv-addon-${id}`,
      when: { addOns: [id] },
      produce: {
        group: DELIVERABLE_GROUP_ADDONS,
        label,
        countPerSubEvent: true,
      },
    });
  }

  rules.push({
    id: "deliv-reels",
    when: { reels: true },
    produce: {
      group: DELIVERABLE_GROUP_EXTRAS,
      label: "Instagram reels",
    },
  });

  rules.push({
    id: "deliv-album",
    when: { album: true },
    produce: {
      group: DELIVERABLE_GROUP_EXTRAS,
      label: "Premium printed album(s)",
    },
  });

  return rules;
}

export function weddingDeliverableRules(
  subEvents: SubEventDef[],
  coverageIds: ID[],
  addonIds: ID[],
  addonCatalog?: Record<ID, { label: string }>,
): DeliverableRule[] {
  const rules: DeliverableRule[] = [];

  const hasAnyPhotography = coverageIds.some(
    (id) => id === "traditional_photography" || id === "candid_photography",
  );
  const hasAnyVideography = coverageIds.some(
    (id) => id === "traditional_videography" || id === "cinematic_videography",
  );
  const hasCinematic = coverageIds.includes("cinematic_videography");

  if (hasAnyPhotography) {
    rules.push({
      id: "deliv-photos-global",
      when: { coverage: ["traditional_photography", "candid_photography"], global: true },
      produce: { group: "Overview", label: "Highlighted photographs from all selected events." },
    });
  }

  if (hasAnyVideography) {
    rules.push({
      id: "deliv-videos-global",
      when: { coverage: ["traditional_videography", "cinematic_videography"], global: true },
      produce: { group: "Overview", label: "Edited documentary-style videos of all selected events." },
    });
  }

  if (hasCinematic) {
    for (const [id, label] of Object.entries(CINEMATIC_EVENT_LABELS)) {
      if (subEvents.some((s) => s.id === id)) {
        rules.push({
          id: `deliv-cinematic-${id}`,
          when: { coverage: ["cinematic_videography"], subEvents: [id] },
          produce: { group: "Videography", label },
        });
      }
    }
  }

  for (const id of coverageIds) {
    if (id === "traditional_photography" || id === "candid_photography") continue;
    if (id === "traditional_videography") continue;
    if (id === "cinematic_videography") continue;
    const label = COVERAGE_DELIVERABLE_LABELS[id];
    if (!label) continue;
    rules.push({
      id: `deliv-coverage-${id}`,
      when: { coverage: [id] },
      produce: {
        group: DELIVERABLE_GROUP_COVERAGE,
        label,
        countPerSubEvent: true,
      },
    });
  }

  for (const id of addonIds) {
    const label = addonDeliverableLabel(id, addonCatalog);
    if (!label) continue;
    rules.push({
      id: `deliv-addon-${id}`,
      when: { addOns: [id] },
      produce: {
        group: DELIVERABLE_GROUP_ADDONS,
        label,
        countPerSubEvent: true,
      },
    });
  }

  rules.push({
    id: "deliv-reels",
    when: { reels: true },
    produce: { group: "Digital", label: "Instagram reels" },
  });

  rules.push({
    id: "deliv-album",
    when: { album: true },
    produce: { group: "Albums", label: "Premium printed album(s)" },
  });

  return rules;
}

export function commonRecommendations(): RecommendationRule[] {
  return [
    {
      id: "rec-drone-for-reception",
      suggest: { type: "coverage", id: "drone" },
      message: "Add Drone coverage to your main events for stunning aerial shots.",
      requiresAnySubEvent: ["wedding", "reception", "wedding_day", "main"],
      requiresCoverage: ["cinematic_videography"],
    },
    {
      id: "rec-candid-for-main",
      suggest: { type: "coverage", id: "candid_photography" },
      message: "Add Candid Photography to capture authentic, unposed moments.",
      requiresAnySubEvent: ["wedding", "reception", "wedding_day", "main", "party"],
    },
    {
      id: "rec-instant-teaser",
      suggest: { type: "addon", id: "instant_teaser" },
      message: "An Instant Teaser or Same-Day Edit screened at the event is a guest favourite.",
      requiresAnySubEvent: ["wedding", "reception", "wedding_day", "main"],
    },
    {
      id: "rec-live-streaming",
      suggest: { type: "addon", id: "live_streaming" },
      message: "Live Streaming lets faraway family join the celebration.",
      requiresAnySubEvent: ["wedding", "reception", "wedding_day", "main"],
    },
  ];
}
