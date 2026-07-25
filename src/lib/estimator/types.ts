/**
 * Core domain types for the Photriya Studios Event Cost Estimator.
 *
 * Everything here is plain serializable data (no functions) so that templates
 * can later be hydrated from a database or Sanity CMS without changing the
 * rendering layer or the pricing engine. A future "Template Builder" admin UI
 * only has to produce objects that satisfy `EventTemplate`.
 */

export type ID = string;

export interface PriceRange {
  value: number;
}

/* -------------------------------------------------------------------------- */
/* Option catalog vocabulary (shared across templates)                        */
/* -------------------------------------------------------------------------- */

/** A selectable coverage type for a sub-event (Step 3). */
export interface CoverageOption {
  id: ID;
  label: string;
  /** Icon key resolved by the UI icon map. */
  icon: string;
  description: string;
}

/** An optional add-on service for a sub-event (Step 5). */
export interface AddOnOption {
  id: ID;
  label: string;
  icon: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/* Template definition                                                         */
/* -------------------------------------------------------------------------- */

export interface SubEventDef {
  id: ID;
  name: string;
  description?: string;
  /** Pre-selected when the event template is chosen. */
  defaultSelected?: boolean;
  /** Per-sub-event coverage price overrides (fall back to template defaults). */
  coverage?: Partial<Record<ID, PriceRange>>;
  /** Per-sub-event add-on price overrides (fall back to template defaults). */
  addOns?: Partial<Record<ID, PriceRange>>;
  /** Per-sub-event reel price override (falls back to template default). */
  reel?: PriceRange;
  /** Max reels for this sub-event (falls back to template default). */
  maxReels?: number;
}

export interface AlbumType {
  id: ID;
  name: string;
  /** Base cost for a single album at the smallest size and base page count. */
  basePrice: PriceRange;
  /** Additional cost per page beyond the base page count. */
  perPagePrice: PriceRange;
}

export interface AlbumSize {
  id: ID;
  name: string;
  /** Scalar multiplier applied to the album price (same for min and max). */
  multiplier: number;
}

export interface AlbumDefaults {
  types: AlbumType[];
  sizes: AlbumSize[];
  /** Pages included in the base price. */
  basePages: number;
  maxPages: number;
  maxAlbums: number;
}

/**
 * Declarative deliverable rule. When the `when` predicates match the current
 * selection, `produce` is emitted. Kept as data (not a function) so it is
 * serializable for a future CMS-backed template builder.
 */
export interface DeliverableRule {
  id: ID;
  when: {
    /** Emit if any selected sub-event has any of these coverage ids. */
    coverage?: ID[];
    /** Emit if any selected sub-event has any of these add-on ids. */
    addOns?: ID[];
    /** Emit if any sub-event has at least one reel. */
    reels?: boolean;
    /** Emit if an album is configured. */
    album?: boolean;
    /** Limit to only these sub-event ids (if omitted, applies across all). */
    subEvents?: ID[];
    /** Emit once across all sub-events when any sub-event matches. */
    global?: boolean;
  };
  produce: {
    group: string;
    label: string;
    /** Show a per-sub-event count next to the deliverable. */
    countPerSubEvent?: boolean;
  };
}

/**
 * Declarative smart recommendation. Suggests adding a coverage option or
 * add-on when the condition matches and the suggestion is not already active.
 */
export interface RecommendationRule {
  id: ID;
  /** What to add when accepted. */
  suggest: { type: "coverage" | "addon"; id: ID };
  message: string;
  /** Limit the rule to these sub-events (all selected if omitted). */
  whenSubEvents?: ID[];
  /** Require at least one selected sub-event to have all of these coverage. */
  requiresCoverage?: ID[];
  /** Require at least one of these sub-events to be selected. */
  requiresAnySubEvent?: ID[];
}

/**
 * A full event template. The frontend renders whatever template is selected
 * by reading only this structure — nothing about an event is hardcoded in UI.
 */
export interface EventTemplate {
  id: ID;
  name: string;
  tagline?: string;
  description?: string;
  icon: string;
  /** Coverage option ids offered by this event (usually the global five). */
  coverageOptions: ID[];
  /** Add-on option ids offered by this event. */
  addOnOptions: ID[];
  /** Default per-sub-event coverage prices. */
  defaultCoveragePrices: Record<ID, PriceRange>;
  /** Default per-sub-event add-on prices. */
  defaultAddOnPrices: Record<ID, PriceRange>;
  /** Default per-reel price. */
  defaultReelPrice: PriceRange;
  /** Default max reels per sub-event. */
  defaultMaxReels: number;
  subEvents: SubEventDef[];
  album: AlbumDefaults;
  deliverableRules: DeliverableRule[];
  recommendationRules: RecommendationRule[];
}

/* -------------------------------------------------------------------------- */
/* Runtime state (serializable -> enables Save & Resume + shareable links)    */
/* -------------------------------------------------------------------------- */

export interface SubEventState {
  id: ID;
  coverage: ID[];
  addOns: ID[];
  /** 0..maxReels for this sub-event. */
  reels: number;
}

export interface AlbumState {
  required: boolean;
  typeId: ID | null;
  sizeId: ID | null;
  pages: number;
  count: number;
}

export interface EstimatorState {
  clientName: string;
  clientPhone: string;
  estimatedDate: string;
  eventTypeId: ID | null;
  /** Selected sub-event ids, order preserved. */
  selectedSubEvents: ID[];
  /** Per-sub-event configuration, keyed by sub-event id. */
  subEventConfig: Record<ID, SubEventState>;
  album: AlbumState;
  /** Current wizard step index. */
  step: number;
}

/* -------------------------------------------------------------------------- */
/* Derived estimate (output of the pure pricing engine)                       */
/* -------------------------------------------------------------------------- */

export interface LineItem {
  id: string;
  label: string;
  detail?: string;
  group: string;
  value: number;
}

export interface EstimateBreakdown {
  items: LineItem[];
  total: number;
  subEventCount: number;
  isEmpty: boolean;
}

/* -------------------------------------------------------------------------- */
/* Deliverables (output of the pure deliverables generator)                   */
/* -------------------------------------------------------------------------- */

export interface Deliverable {
  id: string;
  group: string;
  label: string;
  /** e.g. "5 sub-events" or "3 reels" — optional supporting detail. */
  detail?: string;
  /** The sub-event this deliverable belongs to. */
  subEvent?: string;
  subEventId?: ID;
}

export interface DeliverableGroup {
  group: string;
  items: Deliverable[];
}

/* -------------------------------------------------------------------------- */
/* Recommendations (output of the pure recommendation engine)                */
/* -------------------------------------------------------------------------- */

export interface ActiveRecommendation {
  ruleId: ID;
  message: string;
  suggest: { type: "coverage" | "addon"; id: ID };
  /** Sub-event ids the suggestion should be applied to. */
  targetSubEvents: ID[];
}
