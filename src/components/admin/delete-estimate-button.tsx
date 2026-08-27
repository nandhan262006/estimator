"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEstimateLead } from "@/lib/estimator/lead-actions";

export function DeleteEstimateButton({ id }: { id: number }) {
  const [deleted, setDeleted] = useState(false);
  const router = useRouter();

  if (deleted) return null;

  async function handleClick() {
    if (!confirm("Delete this estimate? This cannot be undone.")) return;
    try {
      const result = await deleteEstimateLead(id);
      if (result?.success === false) throw new Error("Server action failed");
      setDeleted(true);
      router.refresh();
    } catch {
      toast.error("Failed to delete estimate. Please try again.");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
    >
      <Trash2 className="size-3" />
      Delete
    </button>
  );
}
