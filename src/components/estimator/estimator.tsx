"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STEPS } from "@/lib/estimator/state";
import { EstimatorProvider, useEstimator } from "@/lib/estimator/state-provider";
import type { EventTemplate } from "@/lib/estimator/types";
import { saveEstimateLead } from "@/lib/estimator/lead-actions";
import { EstimatePanel } from "./estimate-panel";
import { MobileEstimateBar } from "./mobile-bar";
import { StepNav } from "./step-nav";
import { AlbumStep } from "./steps/album-step";
import { CoverageOnlyStep } from "./steps/coverage-only-step";
import { AddOnStep } from "./steps/add-on-step";
import { DeliverablesStep } from "./steps/deliverables-step";
import { EstimateStep } from "./steps/estimate-step";
import { DownloadStep } from "./steps/download-step";
import { ClientInfoStep } from "./steps/client-info-step";
import { EventTypeStep } from "./steps/event-type-step";
import { SubEventsStep } from "./steps/sub-events-step";

export function Estimator({ templates }: { templates: EventTemplate[] }) {
  return (
    <EstimatorProvider templates={templates}>
      <EstimatorShell />
    </EstimatorProvider>
  );
}

const SKIPPABLE_STEPS = new Set([3, 4, 5]);

function EstimatorShell() {
  const { state, dispatch, estimate, deliverables, template } = useEstimator();
  const lastStep = STEPS.length - 1;
  const savedRef = useRef(false);

  useEffect(() => {
    if (state.step >= 7 && state.clientName && state.clientPhone && state.eventTypeId) {
      if (savedRef.current) return;
      savedRef.current = true;
      const estimateJSON = JSON.stringify({ state, estimate, deliverables });
      saveEstimateLead({
        clientName: state.clientName,
        clientPhone: state.clientPhone,
        eventType: state.eventTypeId,
        eventName: template?.name ?? "",
        estimatedDate: state.estimatedDate,
        estimateData: estimateJSON,
      }).catch(() => {
        console.warn("Failed to auto-save estimate lead");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  const canProceed = (() => {
    switch (state.step) {
      case 0:
        return state.clientName.trim().length > 0 && state.clientPhone.trim().length > 0;
      case 1:
        return !!state.eventTypeId;
      case 2:
        return state.selectedSubEvents.length > 0;
      case 3: {
        return state.selectedSubEvents.some((id) => {
          const cfg = state.subEventConfig[id];
          return cfg && (cfg.coverage.length > 0 || cfg.reels > 0);
        });
      }
      default:
        return true;
    }
  })();

  const next = () =>
    dispatch({ type: "SET_STEP", step: Math.min(lastStep, state.step + 1) });
  const prev = () =>
    dispatch({ type: "SET_STEP", step: Math.max(0, state.step - 1) });
  const skip = () =>
    dispatch({ type: "SET_STEP", step: Math.min(lastStep, state.step + 1) });

  return (
    <div className="grain-overlay flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-medium text-foreground transition-opacity hover:opacity-70"
          >
            <Image src="/logo.png" alt="MamathaRaj Photography" width={40} height={40} priority />
          </Link>
          <div className="flex flex-col leading-none text-right">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Event Cost Estimator
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-4 overflow-y-auto">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 overflow-hidden">
            <StepNav />
            <div className="mt-8">
              {state.step === 0 && <ClientInfoStep />}
              {state.step === 1 && <EventTypeStep />}
              {state.step === 2 && <SubEventsStep />}
              {state.step === 3 && <CoverageOnlyStep />}
              {state.step === 4 && <AlbumStep />}
              {state.step === 5 && <AddOnStep />}
              {state.step === 6 && <DeliverablesStep />}
              {state.step === 7 && <EstimateStep />}
              {state.step === 8 && <DownloadStep />}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {state.step > 0 && (
                  <Button
                    variant="outline"
                    onClick={prev}
                    className="rounded-full"
                  >
                    <ArrowLeft className="mr-1.5 size-4" />
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {SKIPPABLE_STEPS.has(state.step) && state.step < lastStep && (
                  <Button
                    variant="ghost"
                    onClick={skip}
                    className="rounded-full text-muted-foreground"
                  >
                    Skip
                    <SkipForward className="ml-1.5 size-4" />
                  </Button>
                )}
                {state.step < lastStep && (
                  <Button
                    onClick={next}
                    disabled={!canProceed}
                    className="rounded-full"
                  >
                    Next
                    <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <EstimatePanel />
            </div>
          </aside>
        </div>
      </main>

      <MobileEstimateBar />
    </div>
  );
}
