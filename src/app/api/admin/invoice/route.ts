import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin, getDb } from "@/lib/db-utils";
import { estimateLead } from "@/lib/db/schema";
import { loadTemplates } from "@/lib/estimator/templates";
import { calculateEstimate } from "@/lib/estimator/pricing";
import { generateDeliverableTexts } from "@/lib/estimator/deliverables";
import { sanitizeState } from "@/lib/estimator/state";
import { renderInvoicePdf } from "@/lib/estimator/invoice-pdf";
import type { EstimatorState } from "@/lib/estimator/types";

// @react-pdf/renderer needs the Node.js runtime (Buffer, fs-backed fonts).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { leadId?: unknown; discount?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const leadId = Number(body.leadId);
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return new Response("Missing leadId", { status: 400 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(estimateLead)
    .where(eq(estimateLead.id, leadId))
    .limit(1);
  const lead = rows[0];
  if (!lead) {
    return new Response("Estimate not found", { status: 404 });
  }

  let parsed: { state?: EstimatorState } | null = null;
  try {
    parsed = JSON.parse(lead.estimateData);
  } catch {
    parsed = null;
  }
  const rawState = parsed?.state as Partial<EstimatorState> | undefined;
  if (!rawState || typeof rawState.eventTypeId !== "string") {
    return new Response("Estimate data is incomplete", { status: 400 });
  }

  const templates = await loadTemplates();
  const template = templates.find((t) => t.id === rawState.eventTypeId);
  if (!template) {
    return new Response("Unknown event type", { status: 400 });
  }

  const state = sanitizeState(rawState, template);
  const estimate = calculateEstimate(state, template);
  if (estimate.isEmpty) {
    return new Response("Nothing selected to invoice", { status: 400 });
  }

  // Discount is always an amount in INR, clamped to the subtotal.
  const rawDiscount = Number(body.discount);
  const discount = Number.isFinite(rawDiscount)
    ? Math.min(estimate.total, Math.max(0, Math.round(rawDiscount)))
    : 0;

  const deliverableTexts = generateDeliverableTexts(state, template);

  const year = new Date().getFullYear();
  const invoiceNumber = `MRP-${year}-${String(lead.id).padStart(4, "0")}`;

  const pdf = await renderInvoicePdf({
    template,
    state,
    estimate,
    deliverableTexts,
    discount,
    invoiceNumber,
  });

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumber}.pdf"`,
    },
  });
}
