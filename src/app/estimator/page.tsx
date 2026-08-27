import type { Metadata } from "next";
import { Estimator } from "@/components/estimator/estimator";
import { loadTemplates } from "@/lib/estimator/templates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Event Cost Estimator | Mamatha Raj Photography",
  description:
    "Build your photography and videography package at Mamatha Raj Photography, Hyderabad and get an instant rough estimate.",
  openGraph: {
    title: "Event Cost Estimator | Mamatha Raj Photography",
    description:
      "Build your photography and videography package at Mamatha Raj Photography, Hyderabad and get an instant rough estimate.",
    siteName: "Mamatha Raj Photography",
    locale: "en_IN",
    type: "website",
  },
};

export default async function EstimatorPage() {
  const templates = await loadTemplates();
  return <Estimator templates={templates} />;
}
