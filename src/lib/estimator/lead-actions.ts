"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, getDb } from "@/lib/db-utils";
import { estimateLead } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function saveEstimateLead(data: {
  clientName: string;
  clientPhone: string;
  eventType: string;
  eventName: string;
  estimatedDate: string;
  estimateData: string;
}) {
  const db = getDb();
  try {
    await db.insert(estimateLead).values({
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      eventType: data.eventType,
      eventName: data.eventName,
      estimatedDate: data.estimatedDate,
      estimateData: data.estimateData,
    });
    return { success: true };
  } catch (e) {
    console.error("Failed to save estimate lead:", e);
    return { success: false };
  }
}

export async function getEstimateLeads() {
  await requireAdmin();
  const db = getDb();
  try {
    return await db.select().from(estimateLead).orderBy(desc(estimateLead.createdAt));
  } catch (e) {
    console.error("Failed to fetch estimate leads:", e);
    return [];
  }
}

export async function markEstimateComplete(id: number) {
  await requireAdmin();
  const db = getDb();
  try {
    await db.update(estimateLead).set({ status: "completed" }).where(eq(estimateLead.id, id));
    revalidatePath("/admin/estimates");
    return { success: true };
  } catch (e) {
    console.error("Failed to mark estimate complete:", e);
    return { success: false };
  }
}

export async function deleteEstimateLead(id: number) {
  await requireAdmin();
  const db = getDb();
  try {
    await db.delete(estimateLead).where(eq(estimateLead.id, id));
    revalidatePath("/admin/estimates");
    return { success: true };
  } catch (e) {
    console.error("Failed to delete estimate lead:", e);
    return { success: false };
  }
}
