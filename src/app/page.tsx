import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="grain-overlay flex-1 flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-warm-50 via-background to-warm-100" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 mb-8 backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Khammam&apos;s trusted studio</span>
            </div>
          </div>

          <h1 className="animate-fade-in-up delay-1 text-5xl font-semibold tracking-tight sm:text-7xl lg:text-8xl leading-[0.95] mb-6">
            MamathaRaj
            <br />
            <span className="text-primary">Photography</span>
          </h1>

          <p className="animate-fade-in-up delay-2 mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed mb-10">
            Premium photography and cinematography for weddings, celebrations,
            and corporate events across Khammam.
          </p>

          <div className="animate-fade-in-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/estimator"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              Build your package
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
