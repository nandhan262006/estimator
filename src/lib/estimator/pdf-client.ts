import type { EstimatorState } from "./types";

/**
 * Request a server-rendered, branded PDF for the given state and trigger a
 * browser download. The server re-validates the state via the pricing engine,
 * so a tampered payload can never produce an inconsistent document.
 */
export async function downloadEstimatePdf(state: EstimatorState): Promise<void> {
  const res = await fetch("/api/estimator/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });

  if (!res.ok) {
    throw new Error(`PDF request failed: ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mamatha-raj-estimate.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
