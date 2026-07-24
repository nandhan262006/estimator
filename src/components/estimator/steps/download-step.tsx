"use client";

import { useState } from "react";
import { Download, Loader2, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/estimator/format";
import { downloadEstimatePdf } from "@/lib/estimator/pdf-client";
import { useEstimator } from "@/lib/estimator/state-provider";

export function DownloadStep() {
  const { state, estimate, deliverableTexts, dispatch } = useEstimator();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (estimate.isEmpty) return;
    setDownloading(true);
    try {
      await downloadEstimatePdf(state);
      toast.success("Your estimate PDF is downloading.");
    } catch {
      toast.error("Could not generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const subEventItems = new Map<string, Map<string, typeof estimate.items>>();
  const subEventOrder: string[] = [];

  for (const item of estimate.items) {
    const subName = item.detail ?? "General";
    if (!subEventItems.has(subName)) {
      subEventItems.set(subName, new Map());
      subEventOrder.push(subName);
    }
    const groups = subEventItems.get(subName)!;
    if (!groups.has(item.group)) {
      groups.set(item.group, []);
    }
    groups.get(item.group)!.push(item);
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">
          Download your estimate
        </h1>
        <p className="text-sm text-muted-foreground">
          Review the summary below and download a branded PDF with your
          selections, deliverables, and estimated price.
        </p>
      </header>

      {estimate.isEmpty ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No estimate to download. Go back and select services first.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-primary/5 p-5">
            <span className="text-xs text-muted-foreground">
              Estimated total
            </span>
            <div className="mt-1 font-heading text-2xl font-semibold tabular-nums sm:text-3xl">
              {formatINR(estimate.total)}
            </div>
            {estimate.subEventCount > 0 && (
              <span className="mt-2 inline-block text-sm text-muted-foreground">
                Across {estimate.subEventCount} sub-event
                {estimate.subEventCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {subEventOrder.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-heading text-base font-medium">Summary</h2>
              <div className="flex flex-col gap-5">
                {subEventOrder.map((subName) => {
                  const groups = subEventItems.get(subName)!;
                  return (
                    <div key={subName} className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {subName}
                      </span>
                      <div className="rounded-lg border bg-muted/20 p-3">
                        {[...groups.entries()].map(([group, items]) => (
                          <div key={group} className="mb-3 last:mb-0">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {group}
                            </span>
                            <div className="mt-1.5 flex flex-col gap-1">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start justify-between gap-3 rounded-md bg-background p-2 text-sm"
                                >
                                  <span className="font-medium">{item.label}</span>
                                  <span className="shrink-0 tabular-nums text-muted-foreground">
                                    {formatINR(item.value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {deliverableTexts.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col gap-3">
                <h2 className="font-heading text-base font-medium">
                  Included deliverables
                </h2>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <ul className="flex flex-col gap-2.5">
                    {deliverableTexts.map((text, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <Separator />

      <div className="flex flex-col gap-3 rounded-xl border border-dashed p-5">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Disclaimer: This is only an approximate estimate. The final quotation
          may vary depending on event duration, location, travel, venue
          restrictions and custom requirements. Please contact us for a
          detailed, finalised quote.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleDownload}
          disabled={estimate.isEmpty || downloading}
          size="lg"
        >
          {downloading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
          Download PDF
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => dispatch({ type: "RESET" })}
        >
          <RotateCcw />
          Start over
        </Button>
      </div>
    </section>
  );
}
