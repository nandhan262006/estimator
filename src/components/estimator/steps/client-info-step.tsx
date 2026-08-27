"use client";

import { User, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEstimator } from "@/lib/estimator/state-provider";

export function ClientInfoStep() {
  const { state, dispatch } = useEstimator();

  return (
    <section className="animate-fade-in-up flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Let&apos;s get started
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          Tell us a bit about yourself so we can follow up with your estimate.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <label htmlFor="clientName" className="flex items-center gap-2 text-sm font-medium">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <User className="size-3.5 text-primary" />
            </div>
            Your Name
            <span className="text-destructive">*</span>
          </label>
          <Input
            id="clientName"
            required
            placeholder="Enter your full name"
            className="h-11 rounded-xl"
            value={state.clientName}
            onChange={(e) =>
              dispatch({
                type: "SET_CLIENT_INFO",
                field: "clientName",
                value: e.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="clientPhone" className="flex items-center gap-2 text-sm font-medium">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Phone className="size-3.5 text-primary" />
            </div>
            Phone Number
            <span className="text-destructive">*</span>
          </label>
          <Input
            id="clientPhone"
            type="tel"
            inputMode="numeric"
            required
            maxLength={10}
            placeholder="10-digit phone number"
            className="h-11 rounded-xl"
            value={state.clientPhone}
            onChange={(e) =>
              dispatch({
                type: "SET_CLIENT_INFO",
                field: "clientPhone",
                value: e.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
          />
        </div>
      </div>
    </section>
  );
}
