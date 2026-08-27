"use client";

import { useMemo, useState } from "react";
import { Receipt, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EstimateBreakdown, DeliverableGroup, EstimatorState } from "@/lib/estimator/types";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

const GROUP_ORDER = ["Coverage", "Add-on Services", "Reels", "Albums"];

interface SavedEstimate {
  state?: EstimatorState;
  estimate?: EstimateBreakdown;
  deliverables?: DeliverableGroup[];
}

function parseEstimateData(raw: string): SavedEstimate | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "estimate" in parsed) {
      return parsed as SavedEstimate;
    }
    return null;
  } catch {
    return null;
  }
}

interface LeadRow {
  id: number;
  clientName: string;
  clientPhone: string;
  eventName: string;
  eventType: string;
  estimateData: string;
}

export function GetInvoiceButton({ lead }: { lead: LeadRow }) {
  const [open, setOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [downloading, setDownloading] = useState(false);

  const data = useMemo(() => parseEstimateData(lead.estimateData), [lead.estimateData]);
  const estimate = data?.estimate;
  const deliverables = data?.deliverables;
  const state = data?.state;

  const subtotal = estimate?.total ?? 0;

  const discountAmount = useMemo(() => {
    const raw = Number(discountValue);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    const amount = discountType === "percent" ? (subtotal * raw) / 100 : raw;
    return Math.min(subtotal, Math.max(0, Math.round(amount)));
  }, [discountValue, discountType, subtotal]);

  const total = subtotal - discountAmount;

  const eventDate = state?.estimatedDate
    ? new Date(state.estimatedDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, discount: discountAmount }),
      });

      if (!res.ok) {
        const message = res.status === 401 ? "Not authorised." : `Request failed: ${res.status}`;
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MRP-${new Date().getFullYear()}-${String(lead.id).padStart(4, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Invoice downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate invoice.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Receipt className="size-3" />
        Get Invoice
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice for {lead.clientName}</DialogTitle>
            <DialogDescription>
              Review the client&apos;s estimate, add a discount if needed, then
              download the final invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 text-sm">
            <div className="rounded-md border bg-muted/30 p-3">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Client details
              </span>
              <div className="mt-2 grid grid-cols-[6rem_1fr] gap-y-1 text-xs">
                <span className="text-muted-foreground">Name</span>
                <span>{lead.clientName}</span>
                <span className="text-muted-foreground">Phone</span>
                <span>{lead.clientPhone}</span>
                <span className="text-muted-foreground">Event</span>
                <span>{lead.eventName || lead.eventType}</span>
                <span className="text-muted-foreground">Event date</span>
                <span>{eventDate ?? "\u2014"}</span>
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Estimate breakdown
              </span>
              {estimate && !estimate.isEmpty ? (
                <div className="mt-2 flex flex-col gap-2">
                  {GROUP_ORDER.map((group) => {
                    const items = estimate.items.filter((i) => i.group === group);
                    if (items.length === 0) return null;
                    return (
                      <div key={group} className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase text-muted-foreground">
                          {group}
                        </span>
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 text-xs"
                          >
                            <span>
                              {item.label}
                              {item.detail ? ` (${item.detail})` : ""}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatINR(item.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between border-t pt-2 text-xs">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold tabular-nums">{formatINR(subtotal)}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Estimate breakdown not available for this entry.
                </p>
              )}

              {deliverables && deliverables.length > 0 && (
                <div className="mt-3 flex flex-col gap-1 border-t pt-2">
                  <span className="text-[11px] font-medium uppercase text-muted-foreground">
                    Deliverables
                  </span>
                  {deliverables.map((group) => (
                    <span key={group.group} className="text-xs">
                      <span className="font-medium">{group.group}: </span>
                      {group.items.map((it) => it.label).join(", ")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border p-3">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Discount
              </span>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex overflow-hidden rounded-md border">
                  <button
                    type="button"
                    onClick={() => setDiscountType("amount")}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      discountType === "amount"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {"\u20b9"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("percent")}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      discountType === "percent"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    %
                  </button>
                </div>
                <Input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  placeholder={discountType === "percent" ? "0" : "0"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="h-8"
                />
              </div>

              <div className="mt-3 flex flex-col gap-1 border-t pt-3">
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="tabular-nums text-muted-foreground">
                      - {formatINR(discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total amount due</span>
                  <span className="text-base font-bold tabular-nums text-primary">
                    {formatINR(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={downloading}
            >
              Cancel
            </Button>
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 size-4" />
              )}
              Download Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
