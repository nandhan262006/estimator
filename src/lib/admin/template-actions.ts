"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, getDb } from "@/lib/db-utils";
import { eventTemplate, subEvent, addOn } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getTemplates() {
  await requireAdmin();
  const db = getDb();
  try {
    const templates = await db.select().from(eventTemplate).orderBy(asc(eventTemplate.name));
    const subEvents = await db.select().from(subEvent).orderBy(asc(subEvent.sortOrder));
    return JSON.parse(JSON.stringify(
      templates.map((t) => ({
        ...t,
        subEvents: subEvents.filter((se) => se.templateId === t.id),
      }))
    ));
  } catch {
    return [];
  }
}

export async function getTemplate(id: number) {
  await requireAdmin();
  const db = getDb();
  const t = await db.select().from(eventTemplate).where(eq(eventTemplate.id, id)).then((r) => r[0] ?? null);
  if (!t) return null;
  const subEvents = await db.select().from(subEvent).where(eq(subEvent.templateId, id)).orderBy(asc(subEvent.sortOrder));
  return { ...t, subEvents };
}

export async function upsertTemplate(data: {
  id?: number;
  typeId: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  isActive: number;
  defaultMaxReels: number;
  defaultReelPrice: number;
  coverageOptions: string[];
  addOnOptions: string[];
  defaultPrices?: string;
}) {
  await requireAdmin();
  const db = getDb();
  const payload = {
    typeId: data.typeId,
    name: data.name,
    tagline: data.tagline,
    description: data.description,
    icon: data.icon,
    isActive: data.isActive ? 1 : 0,
    defaultMaxReels: data.defaultMaxReels,
    defaultReelPrice: data.defaultReelPrice,
    coverageOptions: JSON.stringify(data.coverageOptions),
    addOnOptions: JSON.stringify(data.addOnOptions),
    defaultPrices: data.defaultPrices ?? "{}",
  };
  if (data.id) {
    await db.update(eventTemplate).set(payload).where(eq(eventTemplate.id, data.id));
  } else {
    await db.insert(eventTemplate).values(payload);
  }
  revalidatePath("/admin/templates");
  revalidatePath("/estimator");
  return { success: true };
}

export async function upsertSubEvent(data: {
  id?: number;
  subEventId: string;
  name: string;
  description: string;
  defaultSelected: boolean;
  maxReels: number | null;
  sortOrder: number;
  priceOverrides: Record<string, unknown>;
  templateId: number;
}) {
  await requireAdmin();
  const db = getDb();
  const payload = {
    subEventId: data.subEventId,
    name: data.name,
    description: data.description,
    defaultSelected: data.defaultSelected ? 1 : 0,
    maxReels: data.maxReels,
    sortOrder: data.sortOrder,
    priceOverrides: JSON.stringify(data.priceOverrides),
    templateId: data.templateId,
  };
  if (data.id) {
    await db.update(subEvent).set(payload).where(eq(subEvent.id, data.id));
  } else {
    await db.insert(subEvent).values(payload);
  }
  revalidatePath("/admin/templates");
  revalidatePath("/estimator");
  return { success: true };
}

export async function getAddOns() {
  await requireAdmin();
  const db = getDb();
  try {
    const rows = await db.select().from(addOn).orderBy(asc(addOn.sortOrder), asc(addOn.name));
    return JSON.parse(JSON.stringify(rows));
  } catch {
    return [];
  }
}

export async function upsertAddOn(data: {
  id?: number;
  addOnId: string;
  name: string;
  description: string;
  icon: string;
  defaultPrice: number;
  isActive: number;
  sortOrder: number;
}) {
  await requireAdmin();
  const db = getDb();
  const payload = {
    addOnId: data.addOnId,
    name: data.name,
    description: data.description,
    icon: data.icon,
    defaultPrice: data.defaultPrice,
    isActive: data.isActive ? 1 : 0,
    sortOrder: data.sortOrder,
  };

  let result: { id?: number } = {};
  if (data.id) {
    await db.update(addOn).set(payload).where(eq(addOn.id, data.id));
    result.id = data.id;
  } else {
    const rows = await db.insert(addOn).values(payload).returning({ id: addOn.id });
    result = rows[0] ?? {};

    // Wire the new add-on into every active event template so it shows up
    // in the estimator without extra manual steps.
    const templates = await db.select().from(eventTemplate);
    for (const t of templates) {
      const rawAddOns = safeJson<string[]>(t.addOnOptions) ?? [];
      if (!rawAddOns.includes(data.addOnId)) rawAddOns.push(data.addOnId);

      const prices = safeJson<{ addOns?: Record<string, number> }>(t.defaultPrices) ?? {};
      const addOns = { ...(prices.addOns ?? {}) };
      if (addOns[data.addOnId] === undefined) addOns[data.addOnId] = data.defaultPrice;

      await db
        .update(eventTemplate)
        .set({
          addOnOptions: JSON.stringify(rawAddOns),
          defaultPrices: JSON.stringify({ ...prices, addOns }),
        })
        .where(eq(eventTemplate.id, t.id));
    }
  }

  revalidatePath("/admin/templates");
  revalidatePath("/estimator");
  return { success: true, id: result.id };
}

export async function deleteAddOn(id: number) {
  await requireAdmin();
  const db = getDb();
  const row = await db.select().from(addOn).where(eq(addOn.id, id)).then((r) => r[0] ?? null);
  if (!row) return { success: true };

  // Remove the add-on from every event template's addOnOptions and default prices.
  const templates = await db.select().from(eventTemplate);
  for (const t of templates) {
    const rawAddOns = safeJson<string[]>(t.addOnOptions) ?? [];
    const prices = safeJson<{ addOns?: Record<string, number> }>(t.defaultPrices) ?? {};
    const addOns = { ...(prices.addOns ?? {}) };
    delete addOns[row.addOnId];

    await db
      .update(eventTemplate)
      .set({
        addOnOptions: JSON.stringify(rawAddOns.filter((a) => a !== row.addOnId)),
        defaultPrices: JSON.stringify({ ...prices, addOns }),
      })
      .where(eq(eventTemplate.id, t.id));
  }

  await db.delete(addOn).where(eq(addOn.id, id));
  revalidatePath("/admin/templates");
  revalidatePath("/estimator");
  return { success: true };
}

function safeJson<T>(val: string): T | null {
  try { return JSON.parse(val) as T; } catch { return null; }
}

export async function deleteSubEvent(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(subEvent).where(eq(subEvent.id, id));
  revalidatePath("/admin/templates");
  revalidatePath("/estimator");
  return { success: true };
}

export async function deleteTemplate(id: number) {
  await requireAdmin();
  const db = getDb();
  await db.delete(eventTemplate).where(eq(eventTemplate.id, id));
  revalidatePath("/admin/templates");
  revalidatePath("/estimator");
  return { success: true };
}
