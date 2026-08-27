import type { NextRequest } from "next/server";
import { loadTemplates } from "@/lib/estimator/templates";
import { calculateEstimate } from "@/lib/estimator/pricing";
import { generateDeliverableTexts } from "@/lib/estimator/deliverables";
import { sanitizeState } from "@/lib/estimator/state";
import { renderEstimatePdf } from "@/lib/estimator/pdf";
import type { EstimatorState } from "@/lib/estimator/types";

// @react-pdf/renderer needs the Node.js runtime (Buffer, fs-backed fonts).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body: { state: unknown };
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    if (!body?.state || typeof body.state !== "object") {
      return new Response("Missing state", { status: 400 });
    }

    const rawState = body.state as Partial<EstimatorState>;
    if (typeof rawState.eventTypeId !== "string") {
      return new Response("Missing eventTypeId", { status: 400 });
    }

    const templates = await loadTemplates();
    const template = templates.find((t) => t.id === rawState.eventTypeId);
    if (!template) {
      return new Response("Unknown event type", { status: 400 });
    }

    const state = sanitizeState(body.state, template);
    const estimate = calculateEstimate(state, template);
    if (estimate.isEmpty) {
      return new Response("Nothing selected to estimate", { status: 400 });
    }
    const deliverableTexts = generateDeliverableTexts(state, template);

    const pdf = await renderEstimatePdf({
      template,
      state,
      estimate,
      deliverableTexts,
    });

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="mamatharaj-estimate.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
