import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import { HeroBento } from "@/components/home/hero-bento";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="relative isolate shrink-0 overflow-hidden border-b border-border/70">
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.975 0.008 240), oklch(0.945 0.02 220) 50%, oklch(0.93 0.028 200))",
        }}
      />
      <div className="hero-grid absolute inset-0 -z-10 opacity-20" aria-hidden />

      <div className="mx-auto flex min-h-[min(80vh,720px)] max-w-[1100px] flex-col items-stretch gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:gap-8 lg:py-16">
        <div className="hero-copy w-full min-w-0 flex-1 space-y-5 lg:max-w-none">
          <p className="font-heading text-5xl tracking-tight sm:text-6xl md:text-7xl">
            ProductBench
          </p>
          <h1 className="max-w-xl text-xl font-medium tracking-tight text-foreground/90 sm:text-2xl">
            A living research library of software UX, workflows, and tech stacks.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Benchmark enterprise, consumer, and industrial products so design and
            product teams can learn from what already ships in the wild.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button render={<Link href="/catalog" />} size="lg">
              Explore the catalog
              <ArrowRight className="size-4" />
            </Button>
            <Button
              render={<Link href="/about" />}
              variant="outline"
              size="lg"
            >
              <Compass className="size-4" />
              Why ProductBench
            </Button>
          </div>
        </div>

        <HeroBento />
      </div>
    </section>
  );
}
