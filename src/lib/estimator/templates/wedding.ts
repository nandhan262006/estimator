import type { EventTemplate } from "../types";
import {
  ALBUM_DEFAULTS,
  DEFAULT_ADDON_PRICES,
  DEFAULT_COVERAGE_PRICES,
  DEFAULT_MAX_REELS,
  DEFAULT_REEL_PRICE,
  commonRecommendations,
  weddingDeliverableRules,
} from "./shared";

const ALL_COVERAGE = [
  "traditional_photography",
  "traditional_videography",
  "candid_photography",
  "cinematic_videography",
  "drone",
];

const ALL_ADDONS = [
  "led_screen",
  "live_streaming",
  "ai_gallery",
  "instant_teaser",
];

const MAIN_DAY_COVERAGE = {
  candid_photography: { value: 60000 },
  cinematic_videography: { value: 80000 },
  drone: { value: 28000 },
  traditional_photography: { value: 16000 },
  traditional_videography: { value: 24000 },
};

const subEvents = [
  { id: "engagement", name: "Engagement" },
  { id: "bonalu", name: "Bonalu" },
  { id: "pre_wedding_rituals", name: "Pre Wedding Rituals" },
  { id: "bridal_ceremony", name: "Bridal Ceremony" },
  { id: "groom_ceremony", name: "Groom Ceremony" },
  { id: "pasupu_bride", name: "Pasupu Ceremony (Bride)" },
  { id: "pasupu_groom", name: "Pasupu Ceremony (Groom)" },
  { id: "lagnapatrika", name: "Lagnapatrika" },
  { id: "sangeet", name: "Sangeet" },
  { id: "haldi_bride", name: "Haldi (Bride)" },
  { id: "haldi_groom", name: "Haldi (Groom)" },
  { id: "haldi_together", name: "Haldi Together" },
  { id: "baraath", name: "Baraath" },
  {
    id: "wedding",
    name: "Wedding",
    defaultSelected: true,
    coverage: MAIN_DAY_COVERAGE,
  },
  { id: "pre_reception", name: "Pre Reception" },
  {
    id: "reception",
    name: "Reception",
    defaultSelected: true,
    coverage: MAIN_DAY_COVERAGE,
  },
  { id: "vratham", name: "Vratham" },
  { id: "cocktail_party", name: "Cocktail Party" },
  { id: "couple_shoot", name: "Couple Shoot" },
  { id: "other", name: "Other" },
];

export const weddingTemplate: EventTemplate = {
  id: "wedding",
  name: "Wedding",
  tagline: "Full wedding coverage, from ceremonies to the reception.",
  description:
    "Build a complete photography & videography package across all your wedding functions.",
  icon: "heart",
  coverageOptions: ALL_COVERAGE,
  addOnOptions: ALL_ADDONS,
  defaultCoveragePrices: DEFAULT_COVERAGE_PRICES,
  defaultAddOnPrices: DEFAULT_ADDON_PRICES,
  defaultReelPrice: DEFAULT_REEL_PRICE,
  defaultMaxReels: DEFAULT_MAX_REELS,
  subEvents,
  album: ALBUM_DEFAULTS,
  deliverableRules: [
    ...weddingDeliverableRules(subEvents, ALL_COVERAGE, ALL_ADDONS),
    {
      id: "deliv-couple-photos",
      when: {
        coverage: ["traditional_photography", "candid_photography"],
        subEvents: ["couple_shoot"],
      },
      produce: {
        group: "Photography",
        label:
          "50\u201360 Professionally Edited Digital Photographs from the Couple Shoot.",
      },
    },
    {
      id: "deliv-couple-teaser",
      when: {
        coverage: ["cinematic_videography"],
        subEvents: ["couple_shoot"],
      },
      produce: {
        group: "Videography",
        label: "A beautifully edited Couple Shoot Teaser.",
      },
    },
  ],
  recommendationRules: [
    ...commonRecommendations(),
    {
      id: "rec-wedding-cinematic",
      suggest: { type: "coverage", id: "cinematic_videography" },
      message: "Add Cinematic Videography to your Wedding day for a film-grade highlight.",
      whenSubEvents: ["wedding"],
    },
    {
      id: "rec-reception-gallery",
      suggest: { type: "addon", id: "ai_gallery" },
      message: "An AI Gallery lets guests view and download photos from the Reception instantly.",
      whenSubEvents: ["reception"],
    },
  ],
};
