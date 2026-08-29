import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/schema";

const url = process.env.DATABASE_URL || "file:./dev.db";
const client = url.startsWith("libsql://")
  ? createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  : createClient({ url });
const db = drizzle(client, { schema });

const COVERAGE_IDS = [
  "traditional_photography",
  "traditional_videography",
  "candid_photography",
  "cinematic_videography",
  "drone",
];

const ADDON_IDS = [
  "led_screen",
  "live_streaming",
  "ai_gallery",
  "instant_teaser",
];

const DEFAULT_ADDONS = [
  { addOnId: "led_screen", name: "LED Screen", icon: "monitor", description: "Large LED wall for live playback and visuals at the venue.", defaultPrice: 25000, sortOrder: 1 },
  { addOnId: "live_streaming", name: "Live Streaming", icon: "radio", description: "Broadcast the event live for remote family and friends.", defaultPrice: 15000, sortOrder: 2 },
  { addOnId: "ai_gallery", name: "AI Gallery", icon: "wand", description: "AI-powered event gallery with smart photo curation.", defaultPrice: 25000, sortOrder: 3 },
  { addOnId: "instant_teaser", name: "Instant Teaser or Same-Day Teaser", icon: "film", description: "A quick highlight teaser or same-day edit screened at the event.", defaultPrice: 20000, sortOrder: 4 },
];

const defaultPrices = JSON.stringify({
  coverage: {
    traditional_photography: 12000,
    traditional_videography: 16000,
    candid_photography: 35000,
    cinematic_videography: 45000,
    drone: 20000,
  },
  addOns: {
    led_screen: 25000,
    live_streaming: 15000,
    ai_gallery: 25000,
    instant_teaser: 20000,
  },
});

async function main() {
  const existingAddOns = await db.select().from(schema.addOn).limit(1);
  if (existingAddOns.length === 0) {
    await db.insert(schema.addOn).values(DEFAULT_ADDONS);
    console.log("Add-ons seeded.");
  }

  const existing = await db.select().from(schema.eventTemplate).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  await db.insert(schema.service).values([
    { name: "Wedding Photography", description: "Full-day wedding coverage with 2 photographers", duration: 480, price: "75000" },
    { name: "Event Photography", description: "Birthday, anniversary, or special event coverage", duration: 240, price: "35000" },
    { name: "Pre-Wedding Shoot", description: "Creative pre-wedding photoshoot at location of choice", duration: 180, price: "25000" },
    { name: "Corporate Event", description: "Professional coverage for corporate functions", duration: 360, price: "50000" },
    { name: "Portrait Session", description: "Individual or family portrait photography", duration: 120, price: "15000" },
  ]);

  await db.insert(schema.photographer).values({
    name: "Venky",
    email: "venky@photriya.com",
    phone: "+91 98765 43210",
    bio: "Lead photographer with 10+ years of experience",
  });

  const templates = [
    {
      typeId: "wedding", name: "Wedding", icon: "heart",
      tagline: "Full wedding coverage, from ceremonies to the reception.",
      description: "Build a complete photography & videography package across all your wedding functions.",
      subEvents: [
        { subEventId: "engagement", name: "Engagement", sortOrder: 1 },
        { subEventId: "bonalu", name: "Bonalu", sortOrder: 2 },
        { subEventId: "pre_wedding_rituals", name: "Pre Wedding Rituals", sortOrder: 3 },
        { subEventId: "bridal_ceremony", name: "Bridal Ceremony", sortOrder: 4 },
        { subEventId: "groom_ceremony", name: "Groom Ceremony", sortOrder: 5 },
        { subEventId: "pasupu_bride", name: "Pasupu Ceremony (Bride)", sortOrder: 6 },
        { subEventId: "pasupu_groom", name: "Pasupu Ceremony (Groom)", sortOrder: 7 },
        { subEventId: "lagnapatrika", name: "Lagnapatrika", sortOrder: 8 },
        { subEventId: "sangeet", name: "Sangeet", sortOrder: 9 },
        { subEventId: "haldi_bride", name: "Haldi (Bride)", sortOrder: 10 },
        { subEventId: "haldi_groom", name: "Haldi (Groom)", sortOrder: 11 },
        { subEventId: "haldi_together", name: "Haldi Together", sortOrder: 12 },
        { subEventId: "baraath", name: "Baraath", sortOrder: 13 },
        { subEventId: "wedding", name: "Wedding", defaultSelected: 1, sortOrder: 14 },
        { subEventId: "pre_reception", name: "Pre Reception", sortOrder: 15 },
        { subEventId: "reception", name: "Reception", defaultSelected: 1, sortOrder: 16 },
        { subEventId: "vratham", name: "Vratham", sortOrder: 17 },
        { subEventId: "cocktail_party", name: "Cocktail Party", sortOrder: 18 },
        { subEventId: "other", name: "Other", sortOrder: 19 },
      ],
    },
    {
      typeId: "birthday", name: "Birthday", icon: "cake",
      tagline: "Birthdays, milestone parties and surprise celebrations.",
      description: "Capture every smile, cake cut and dance-floor moment.",
      subEvents: [
        { subEventId: "family_party", name: "Family Party / Cocktail Party", defaultSelected: 1, sortOrder: 1 },
        { subEventId: "pre_shoot", name: "Pre Shoot / Cake Smash", sortOrder: 2 },
        { subEventId: "main_birthday", name: "Main Birthday Event", sortOrder: 3 },
        { subEventId: "other", name: "Other", sortOrder: 4 },
      ],
    },
    {
      typeId: "half_saree", name: "Saree or Dhothi Ceremony", icon: "flower",
      tagline: "Traditional ceremonies, rituals and celebrations.",
      description: "Document the traditions, rituals and the celebration around them.",
      subEvents: [
        { subEventId: "haldi", name: "Haldi", defaultSelected: 1, sortOrder: 1 },
        { subEventId: "mehendi", name: "Mehendi", sortOrder: 2 },
        { subEventId: "sangeet", name: "Sangeeth", sortOrder: 3 },
        { subEventId: "cocktail_party", name: "Cocktail Party", sortOrder: 4 },
        { subEventId: "main_event", name: "Main Event", sortOrder: 5 },
        { subEventId: "other", name: "Other", sortOrder: 6 },
      ],
    },
    {
      typeId: "baby_shower", name: "Baby Shower", icon: "baby",
      tagline: "Blessings, games and tender moments with family.",
      description: "A warm, intimate celebration captured end to end.",
      subEvents: [
        { subEventId: "welcome", name: "Welcome", sortOrder: 1 },
        { subEventId: "pooja", name: "Pooja", defaultSelected: 1, sortOrder: 2 },
        { subEventId: "blessings", name: "Blessings", sortOrder: 3 },
        { subEventId: "games", name: "Games", sortOrder: 4 },
        { subEventId: "photoshoot", name: "Photoshoot", defaultSelected: 1, sortOrder: 5 },
        { subEventId: "other", name: "Other", sortOrder: 6 },
      ],
    },
    {
      typeId: "housewarming", name: "Housewarming", icon: "home",
      tagline: "Pooja, homam and family portraits for your new home.",
      description: "Preserve the rituals and the joy of a new beginning.",
      subEvents: [
        { subEventId: "house_warming", name: "House Warming", defaultSelected: 1, sortOrder: 1 },
        { subEventId: "sathyanarayana_vratham", name: "Sathyanarayana Vratham", sortOrder: 2 },
        { subEventId: "other", name: "Other", sortOrder: 3 },
      ],
    },
    {
      typeId: "anniversary", name: "Anniversary", icon: "gift",
      tagline: "Renewal of vows, cake cutting and a celebratory party.",
      description: "Celebrate milestones with coverage tailored to the occasion.",
      subEvents: [
        { subEventId: "welcome", name: "Welcome", sortOrder: 1 },
        { subEventId: "cake_cutting", name: "Cake Cutting", defaultSelected: 1, sortOrder: 2 },
        { subEventId: "renewal_vows", name: "Renewal of Vows", sortOrder: 3 },
        { subEventId: "party", name: "Party", defaultSelected: 1, sortOrder: 4 },
        { subEventId: "photoshoot", name: "Couple Photoshoot", sortOrder: 5 },
        { subEventId: "other", name: "Other", sortOrder: 6 },
      ],
    },
    {
      typeId: "corporate", name: "Corporate Event", icon: "building",
      tagline: "Conferences, launches, awards and gala dinners.",
      description: "Polished coverage for brand events and corporate functions.",
      subEvents: [
        { subEventId: "inauguration", name: "Inauguration", defaultSelected: 1, sortOrder: 1 },
        { subEventId: "speeches", name: "Speeches / Keynote", sortOrder: 2 },
        { subEventId: "panel", name: "Panel / Session", sortOrder: 3 },
        { subEventId: "awards", name: "Awards", defaultSelected: 1, sortOrder: 4 },
        { subEventId: "networking", name: "Networking", sortOrder: 5 },
        { subEventId: "gala_dinner", name: "Gala Dinner", sortOrder: 6 },
        { subEventId: "other", name: "Other", sortOrder: 7 },
      ],
    },
  ];

  for (const tmpl of templates) {
    const [inserted] = await db.insert(schema.eventTemplate).values({
      typeId: tmpl.typeId,
      name: tmpl.name,
      tagline: tmpl.tagline,
      description: tmpl.description,
      icon: tmpl.icon,
      coverageOptions: JSON.stringify(COVERAGE_IDS),
      addOnOptions: JSON.stringify(ADDON_IDS),
      defaultPrices,
    }).returning({ id: schema.eventTemplate.id });

    if (!inserted) continue;

    for (const se of tmpl.subEvents) {
      await db.insert(schema.subEvent).values({
        subEventId: se.subEventId,
        name: se.name,
        defaultSelected: se.defaultSelected ?? 0,
        sortOrder: se.sortOrder,
        templateId: inserted.id,
      });
    }
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.close());
