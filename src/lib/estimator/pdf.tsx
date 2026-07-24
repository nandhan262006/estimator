/**
 * Branded PDF renderer for the estimator (server-only).
 *
 * Uses @react-pdf/renderer to lay out a clean, branded estimate document.
 * The Route Handler re-runs the pricing engine on the server before calling
 * this, so the figures here are always trusted/validated.
 */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import { formatINRPlain } from "./format";
import type {
  EstimateBreakdown,
  EstimatorState,
  EventTemplate,
} from "./types";

// Load watermark image as base64
let watermarkBase64Cache: string | null | undefined;

function getWatermarkBase64(): string | null {
  if (watermarkBase64Cache !== undefined) return watermarkBase64Cache;
  try {
    const imagePath = path.join(process.cwd(), "public", "NAVIBAR.png");
    const imageBuffer = fs.readFileSync(imagePath);
    watermarkBase64Cache = `data:image/png;base64,${imageBuffer.toString("base64")}`;
    return watermarkBase64Cache;
  } catch {
    watermarkBase64Cache = null;
    return null;
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  brand: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#15181D",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  date: {
    fontSize: 9,
    color: "#9ca3af",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#d1d5db",
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#15181D",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    width: 110,
    color: "#6b7280",
  },
  metaValue: {
    flex: 1,
    color: "#1a1a1a",
  },
  groupLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 3,
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  lineLabel: { flex: 1, paddingRight: 12 },
  lineDetail: { fontSize: 8, color: "#9ca3af" },
  linePrice: { textAlign: "right", fontFamily: "Helvetica-Bold" },
  totalBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#15181D",
    borderRadius: 6,
  },
  totalLabel: { color: "#9ca3af", fontSize: 9 },
  totalValue: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  deliverable: {
    flexDirection: "row",
    marginBottom: 6,
  },
  deliverableBullet: { width: 12, color: "#15181D" },
  deliverableText: { flex: 1, fontSize: 9, lineHeight: 1.5 },
  disclaimer: {
    marginTop: 18,
    fontSize: 8,
    color: "#9ca3af",
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 14,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  watermark: {
    position: "absolute",
    top: "40%",
    left: "25%",
    width: "50%",
    opacity: 0.08,
  },
});

interface PdfProps {
  template: EventTemplate;
  state: EstimatorState;
  estimate: EstimateBreakdown;
  deliverableTexts: string[];
}

function Watermark() {
  const watermarkBase64 = getWatermarkBase64();

  if (!watermarkBase64) return null;
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image src={watermarkBase64} style={styles.watermark} />;
}

// A4 dimensions in points
const PAGE_HEIGHT = 842;
const PAGE_PADDING = 50; // 25 top + 25 bottom
const AVAILABLE_HEIGHT = PAGE_HEIGHT - PAGE_PADDING;

// Compact height estimates
const HEADER_HEIGHT = 24;
const DIVIDER_HEIGHT = 17;
const SECTION_TITLE_HEIGHT = 13;
const META_ROW_HEIGHT = 10;
const LINE_ITEM_HEIGHT = 18;
const TOTAL_BOX_HEIGHT = 44;
const DELIVERABLE_ITEM_HEIGHT = 26;
const DISCLAIMER_HEIGHT = 24;
const FOOTER_HEIGHT = 16;

const SUBHEADING_H = 16;
const CATHEADING_H = 12;

function PdfDeliverablesSection({ deliverableTexts }: { deliverableTexts: string[] }) {
  if (deliverableTexts.length === 0) return null;
  return (
    <>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>What you&apos;ll receive</Text>
      <View style={{ marginBottom: 8 }}>
        {deliverableTexts.map((text, i) => (
          <View key={i} style={styles.deliverable} wrap={false}>
            <Text style={styles.deliverableBullet}>{"\u2022"}</Text>
            <Text style={styles.deliverableText}>{text}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

type PdfChunk =
  | { type: "subheading"; label: string }
  | { type: "catheading"; label: string }
  | { type: "item"; id: string; label: string; value: number; }

function chunkHeight(c: PdfChunk): number {
  if (c.type === "subheading") return SUBHEADING_H;
  if (c.type === "catheading") return CATHEADING_H;
  return LINE_ITEM_HEIGHT;
}

function withContinuationHeadings(chunks: PdfChunk[], prevChunks: PdfChunk[]): PdfChunk[] {
  if (chunks.length === 0) return chunks;
  if (chunks[0].type === "subheading") return chunks;

  let lastSub: PdfChunk | null = null;
  let lastCat: PdfChunk | null = null;

  for (let i = prevChunks.length - 1; i >= 0; i--) {
    if (prevChunks[i].type === "subheading") { lastSub = prevChunks[i]; break; }
  }
  if (chunks[0].type === "item") {
    for (let i = prevChunks.length - 1; i >= 0; i--) {
      if (prevChunks[i].type === "catheading") { lastCat = prevChunks[i]; break; }
      if (prevChunks[i].type === "subheading") break;
    }
  }

  const result: PdfChunk[] = [];
  if (lastSub) result.push(lastSub);
  if (lastCat) result.push(lastCat);
  result.push(...chunks);
  return result;
}

function PdfPriceSection({ chunks }: { chunks: PdfChunk[] }) {
  return (
    <>
      {chunks.map((c, i) => {
        if (c.type === "subheading") {
          return <Text key={i} style={styles.groupLabel}>{c.label}</Text>;
        }
        if (c.type === "catheading") {
          return (
            <Text key={i} style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#6b7280", marginTop: 4, marginBottom: 3, marginLeft: 8, textTransform: "uppercase" }}>
              {c.label}
            </Text>
          );
        }
        return (
          <View key={c.id} style={styles.lineItem}>
            <View style={styles.lineLabel}>
              <Text>{c.label}</Text>
            </View>
            <Text style={styles.linePrice}>
              {formatINRPlain(c.value)}
            </Text>
          </View>
        );
      })}
    </>
  );
}

function EstimatePdfDocument({ template, state, estimate, deliverableTexts }: PdfProps) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const estimatedDateDisplay = state.estimatedDate
    ? new Date(state.estimatedDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const subEventNames = state.selectedSubEvents.map(
    (id) => template.subEvents.find((s) => s.id === id)?.name ?? id,
  );

  // Group estimate items by sub-event → category
  const subMap = new Map<string, Map<string, typeof estimate.items>>();
  const subOrder: string[] = [];
  for (const item of estimate.items) {
    const subName = item.detail ?? "";
    if (!subMap.has(subName)) { subMap.set(subName, new Map()); subOrder.push(subName); }
    const cats = subMap.get(subName)!;
    if (!cats.has(item.group)) cats.set(item.group, []);
    cats.get(item.group)!.push(item);
  }

  const flatChunks: PdfChunk[] = [];
  for (const subName of subOrder) {
    flatChunks.push({ type: "subheading", label: subName });
    for (const [cat, items] of subMap.get(subName)!) {
      flatChunks.push({ type: "catheading", label: cat });
      for (const item of items) {
        flatChunks.push({ type: "item", id: item.id, label: item.label, value: item.value });
      }
    }
  }

  // Per-page top overhead (header, client details, event details, price breakdown title)
  const page1Top =
    HEADER_HEIGHT +
    DIVIDER_HEIGHT * 3 +
    SECTION_TITLE_HEIGHT * 3 +
    META_ROW_HEIGHT * 4 +
    (estimatedDateDisplay ? META_ROW_HEIGHT : 0);

  // Bottom content that only appears on the last page
  const lastPageBottom =
    TOTAL_BOX_HEIGHT +
    DISCLAIMER_HEIGHT +
    FOOTER_HEIGHT +
    (deliverableTexts.length > 0
      ? DIVIDER_HEIGHT + SECTION_TITLE_HEIGHT + deliverableTexts.length * DELIVERABLE_ITEM_HEIGHT
      : 0);

  const chunksTotalH = flatChunks.reduce((acc, c) => acc + chunkHeight(c), 0);

  const totalNeeded = page1Top + chunksTotalH + lastPageBottom;
  const fitsOnePage = totalNeeded <= AVAILABLE_HEIGHT;

  let page1Chunks: PdfChunk[];
  let page2Chunks: PdfChunk[];
  let needsSecondPage: boolean;
  let page2NeedsThirdPage = false;
  let page3Chunks: PdfChunk[] = [];

  if (fitsOnePage) {
    page1Chunks = [...flatChunks];
    page2Chunks = [];
    needsSecondPage = false;
  } else {
    // Not everything fits — split: fill page 1, remainder on page 2+
    const availableP1 = AVAILABLE_HEIGHT - page1Top;
    page1Chunks = [];
    const rest: PdfChunk[] = [];
    let used = 0;
    let onP1 = true;
    for (const c of flatChunks) {
      const h = chunkHeight(c);
      if (onP1 && used + h <= availableP1) {
        page1Chunks.push(c);
        used += h;
      } else {
        onP1 = false;
        rest.push(c);
      }
    }
    needsSecondPage = rest.length > 0;

    // Page 2: "Price breakdown (continued)" + remaining chunks + bottom content
    const page2Top = SECTION_TITLE_HEIGHT;
    const page2Bottom = lastPageBottom;
    const availableP2 = AVAILABLE_HEIGHT - page2Top - page2Bottom;

    const continued = withContinuationHeadings(rest, page1Chunks);
    const continuedH = continued.reduce((acc, c) => acc + chunkHeight(c), 0);
    page2NeedsThirdPage = continuedH > availableP2;

    if (page2NeedsThirdPage) {
      page2Chunks = [];
      page3Chunks = [];
      let p2Used = 0;
      let split = false;
      for (const c of continued) {
        const h = chunkHeight(c);
        if (!split && p2Used + h <= availableP2) {
          page2Chunks.push(c);
          p2Used += h;
        } else {
          split = true;
          page3Chunks.push(c);
        }
      }
    } else {
      page2Chunks = [...continued];
    }
  }

  return (
    <Document>
      {/* Page 1: Header + Event Details + Price Breakdown (part 1) */}
      <Page size="A4" style={styles.page}>
        <Watermark />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={styles.brand}>Photriya Studios</Text>
            <Text style={styles.subtitle}>Event Cost Estimate</Text>
          </View>
          <Text style={styles.date}>{today}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Client details</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Name</Text>
          <Text style={styles.metaValue}>{state.clientName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Phone</Text>
          <Text style={styles.metaValue}>{state.clientPhone}</Text>
        </View>
        {estimatedDateDisplay && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Estimated date</Text>
            <Text style={styles.metaValue}>{estimatedDateDisplay}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Event details</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Event type</Text>
          <Text style={styles.metaValue}>{template.name}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Sub-events</Text>
          <Text style={styles.metaValue}>
            {subEventNames.length > 0
              ? subEventNames.join(", ")
              : "None selected"}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Price breakdown</Text>
        <PdfPriceSection chunks={page1Chunks} />

        {/* If everything fits, show total + deliverables on page 1 */}
        {!needsSecondPage && (
          <>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>ESTIMATED TOTAL (APPROXIMATE)</Text>
              <Text style={styles.totalValue}>
                {estimate.isEmpty
                  ? formatINRPlain(0)
                  : formatINRPlain(estimate.total)}
              </Text>
            </View>

            {deliverableTexts.length > 0 && (
              <PdfDeliverablesSection deliverableTexts={deliverableTexts} />
            )}

            <Text style={styles.disclaimer}>
              Disclaimer: This is only an approximate estimate. The final quotation
              may vary depending on event duration, location, travel, venue
              restrictions and custom requirements. Please contact Photriya Studios
              for a detailed, finalised quote.
            </Text>

            <Text style={styles.footer}>
              Thank you for considering Photriya Studios.
            </Text>
          </>
        )}
      </Page>

      {/* Page 2: Remaining items + Total + Deliverables */}
      {needsSecondPage && (
        <Page size="A4" style={styles.page}>
          <Watermark />
          <Text style={styles.sectionTitle}>Price breakdown (continued)</Text>
          <PdfPriceSection chunks={page2Chunks} />

          {/* If no page 3 needed, show total + deliverables on page 2 */}
          {!page2NeedsThirdPage && (
            <>
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>ESTIMATED TOTAL (APPROXIMATE)</Text>
                <Text style={styles.totalValue}>
                  {estimate.isEmpty
                    ? formatINRPlain(0)
                    : formatINRPlain(estimate.total)}
                </Text>
              </View>

              {deliverableTexts.length > 0 && (
                <PdfDeliverablesSection deliverableTexts={deliverableTexts} />
              )}

              <Text style={styles.disclaimer}>
                Disclaimer: This is only an approximate estimate. The final quotation
                may vary depending on event duration, location, travel, venue
                restrictions and custom requirements. Please contact Photriya Studios
                for a detailed, finalised quote.
              </Text>

              <Text style={styles.footer}>
                Thank you for considering Photriya Studios.
              </Text>
            </>
          )}
        </Page>
      )}

      {/* Page 3: Final remaining items + Total + Deliverables */}
      {page2NeedsThirdPage && (
        <Page size="A4" style={styles.page}>
          <Watermark />
          <Text style={styles.sectionTitle}>Price breakdown (continued)</Text>
          <PdfPriceSection chunks={page3Chunks} />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>ESTIMATED TOTAL (APPROXIMATE)</Text>
            <Text style={styles.totalValue}>
              {estimate.isEmpty
                ? formatINRPlain(0)
                : formatINRPlain(estimate.total)}
            </Text>
          </View>

          {deliverableTexts.length > 0 && (
            <PdfDeliverablesSection deliverableTexts={deliverableTexts} />
          )}

          <Text style={styles.disclaimer}>
            Disclaimer: This is only an approximate estimate. The final quotation
            may vary depending on event duration, location, travel, venue
            restrictions and custom requirements. Please contact Photriya Studios
            for a detailed, finalised quote.
          </Text>

          <Text style={styles.footer}>
            Thank you for considering Photriya Studios.
          </Text>
        </Page>
      )}
    </Document>
  );
}

export async function renderEstimatePdf(props: PdfProps): Promise<Buffer> {
  return renderToBuffer(<EstimatePdfDocument {...props} />);
}
