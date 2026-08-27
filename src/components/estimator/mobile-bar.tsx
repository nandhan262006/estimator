"use client";

import { useState, useCallback } from "react";
import { X, ReceiptIndianRupee } from "lucide-react";
import { formatINR } from "@/lib/estimator/format";
import { useEstimator } from "@/lib/estimator/state-provider";
import { EstimatePanel } from "./estimate-panel";

export function MobileEstimateBar() {
  const { estimate, template } = useEstimator();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const total = estimate.isEmpty ? null : estimate.total;
  const eventName = template?.name ?? "";

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 250);
  }, []);

  return (
    <div className="lg:hidden">
      {/* Floating trigger */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed top-20 right-4 z-50 flex flex-col gap-1 rounded-2xl border border-border bg-card/90 backdrop-blur-xl px-4 py-3 shadow-lg shadow-black/5 transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
        >
          <div className="flex items-center gap-1.5">
            <ReceiptIndianRupee className="size-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Estimate</span>
          </div>
          {total ? (
            <span className="text-sm font-semibold tabular-nums leading-tight">
              {formatINR(total)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground leading-tight">—</span>
          )}
          {eventName && (
            <span className="text-[10px] text-muted-foreground max-w-[120px] truncate leading-tight">
              {eventName}
            </span>
          )}
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-250 ${closing ? "opacity-0" : "opacity-100"}`}
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      {open && (
        <div
          className={`fixed inset-y-0 right-0 z-50 flex w-[min(85vw,400px)] flex-col bg-background shadow-2xl transition-transform duration-300 ease-out ${closing ? "translate-x-full" : "translate-x-0"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <ReceiptIndianRupee className="size-4 text-primary" />
              </div>
              <span className="text-sm font-semibold">Your Estimate</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex size-8 items-center justify-center rounded-full transition-colors duration-200 hover:bg-muted"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <EstimatePanel />
          </div>

          {/* Footer */}
          {total && (
            <div className="border-t border-border px-5 py-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Total</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatINR(total)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
