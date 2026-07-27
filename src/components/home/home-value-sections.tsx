import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Layers3,
  ScanSearch,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const VALUES = [
  {
    icon: ScanSearch,
    title: "Research before you invent",
    body: "Study how mature products structure navigation, density, and workflow before sketching another blank canvas.",
  },
  {
    icon: Layers3,
    title: "Compare architecture, not just screenshots",
    body: "Page counts, role models, tech stacks, and IA depth sit beside UX patterns so trade-offs stay visible.",
  },
  {
    icon: GitBranch,
    title: "Fit the product journey",
    body: "Use ProductBench in discovery, competitive audits, design critiques, and handoff conversations with engineering.",
  },
  {
    icon: UsersRound,
    title: "Built for cross-functional teams",
    body: "PMs, designers, researchers, and engineers share one reference point instead of scattered Notion dumps.",
  },
] as const;

export function HomeValueSections() {
  return (
    <>
      <section className="border-b border-border/70 py-16 sm:py-24">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
              Why teams use it
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              ProductBench turns scattered product inspiration into structured
              research you can filter, compare, and cite.
            </p>
          </div>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
            {VALUES.map((item) => (
              <div key={item.title} className="space-y-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border/80 bg-background">
                  <item.icon className="size-4" />
                </span>
                <h3 className="font-heading text-xl tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
              From inspiration to decision
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Drop ProductBench into the moments where teams usually rely on
              memory: kickoffs, UX reviews, stack debates, and “how do they do
              X?” questions.
            </p>
          </div>
          <ol className="space-y-4">
            {[
              "Discover products by category, industry, or UX pattern",
              "Inspect workflows, screens, and feature inventory",
              "Compare density, IA depth, and platform coverage",
              "Carry findings into briefs, critiques, and roadmap talks",
            ].map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 border-t border-border/70 pt-4 text-sm sm:text-base"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-[11px] font-medium text-background tabular-nums">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-end">
          <div className="max-w-xl space-y-3">
            <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
              Help grow the database
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Know a product worth documenting? Contribute UX notes, workflows,
              and stack details so the catalog stays useful for everyone.
            </p>
          </div>
          <Button render={<Link href="/contribute" />} size="lg">
            Contribute a product
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
