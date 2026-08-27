"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { markEstimateComplete } from "@/lib/estimator/lead-actions";

export function MarkCompleteButton({ id, currentStatus }: { id: number; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  if (status === "completed") return null;

  async function handleClick() {
    try {
      const result = await markEstimateComplete(id);
      if (result?.success === false) throw new Error("Server action failed");
      setStatus("completed");
      router.refresh();
    } catch {
      toast.error("Failed to mark as complete. Please try again.");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      <Check className="size-3" />
      Mark Complete
    </button>
  );
}
