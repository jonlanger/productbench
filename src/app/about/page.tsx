import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  DraftingCompass,
  Lightbulb,
  MessageSquareQuote,
  Route,
  SearchCheck,
  Shapes,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why ProductBench belongs in the product development and design journey — from discovery through critique and handoff.",
};

const JOURNEY = [
  {
    phase: "Discovery",
    icon: SearchCheck,
    body: "Map the competitive and inspirational landscape quickly. Filter by category, industry, and UX pattern instead of hunting through bookmarks.",
  },
  {
    phase: "Problem framing",
    icon: Lightbulb,
    body: "Reference how other products model roles, workflows, and constraints when writing briefs and opportunity assessments.",
  },
  {
    phase: "Design exploration",
    icon: DraftingCompass,
    body: "Study navigation models, density choices, and interaction patterns before committing to a direction — with concrete screen inventories.",
  },
  {
    phase: "Critique & alignment",
    icon: MessageSquareQuote,
    body: "Ground design reviews in shared examples. Compare IA depth, feature surface, and platform coverage side by side.",
  },
  {
    phase: "Build & handoff",
    icon: Shapes,
    body: "Tech stack and integration notes help engineering conversations stay concrete when evaluating feasibility and architecture.",
  },
  {
    phase: "Iteration",
    icon: Route,
    body: "Revisit benchmarks as your product matures — what felt aspirational at MVP may become the next workflow to study.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          About
        </p>
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
          Built for the product development journey
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          ProductBench is a research database of real software products —
          enterprise, consumer, industrial, and everything between. It exists so
          teams stop reinventing patterns in isolation and start learning from
          systems that already ship at scale.
        </p>
      </div>

      <Separator className="my-10" />

      <section className="space-y-6">
        <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
          Where it fits
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Great product work mixes primary research with secondary inspiration.
          ProductBench is the secondary layer: structured, searchable, and deep
          enough to inform decisions — not just moodboards.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {JOURNEY.map((item) => (
            <article
              key={item.phase}
              className="space-y-3 border-t border-border/80 pt-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80">
                  <item.icon className="size-4" />
                </span>
                <h3 className="font-heading text-lg tracking-tight">
                  {item.phase}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
          What we document
        </h2>
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 sm:text-base">
          {[
            "UX patterns, navigation, and density",
            "Key screens and information architecture",
            "End-to-end workflows by role",
            "Feature inventory and integrations",
            "Tech stacks and platform coverage",
            "Page / screen counts and competitive set",
          ].map((item) => (
            <li
              key={item}
              className="border-l-2 border-foreground/20 pl-3 leading-relaxed"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button render={<Link href="/catalog" />} size="lg">
          Browse the catalog
          <ArrowRight className="size-4" />
        </Button>
        <Button render={<Link href="/contribute" />} variant="outline" size="lg">
          Contribute a product
        </Button>
      </div>
    </div>
  );
}
