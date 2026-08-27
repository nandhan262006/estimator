"use client";

import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";

interface ToggleChipProps {
  selected: boolean;
  onClick: () => void;
  iconKey?: string;
  label: string;
  description?: string;
  priceLabel?: string;
  className?: string;
}

export function ToggleChip({
  selected,
  onClick,
  iconKey,
  label,
  description,
  priceLabel,
  className,
}: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all duration-200",
        selected
          ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/5"
          : "border-border hover:border-foreground/20 hover:bg-muted/30 hover:shadow-sm",
        className,
      )}
    >
      {iconKey && (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
          )}
        >
          <Icon name={iconKey} className="size-4" />
        </div>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <span className="truncate font-medium">{label}</span>
        {description && (
          <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {description}
          </span>
        )}
      </span>
      <div className="shrink-0 pt-0.5">
        {selected ? (
          <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3.5" strokeWidth={3} />
          </div>
        ) : priceLabel ? (
          <span className="whitespace-nowrap text-right text-xs font-medium text-muted-foreground">
            {priceLabel}
          </span>
        ) : null}
      </div>
    </button>
  );
}

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
  ariaLabel?: string;
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
  ariaLabel,
}: StepperProps) {
  return (
    <div
      className="inline-flex items-center rounded-xl border border-border bg-card"
      role="group"
      aria-label={ariaLabel}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
        className="rounded-l-xl rounded-r-none"
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="w-12 text-center text-sm font-semibold tabular-nums border-x border-border">
        {value}
        {suffix}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
        className="rounded-r-xl rounded-l-none"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
