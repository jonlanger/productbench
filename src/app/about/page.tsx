import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookmarkX,
  DraftingCompass,
  GitBranch,
  Layers3,
  Lightbulb,
  MessageSquareQuote,
  Route,
  ScanSearch,
  SearchCheck,
  Shapes,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why ProductBench belongs in the product development and design journey — from discovery through critique and handoff.",
};

const WHY_PILLARS = [
  {
    icon: ScanSearch,
    title: "Research before you invent",
    body: "Study how mature products structure navigation, workflows, and role models before sketching another blank canvas. Learn from systems that already ship at scale.",
  },
  {
    icon: Layers3,
    title: "Compare architecture, not just screenshots",
    body: "Page counts, IA depth, tech stacks, and integration surfaces sit beside UX patterns — so trade-offs stay visible, not buried under hero images.",
  },
  {
    icon: GitBranch,
    title: "Structured for the whole journey",
    body: "The same catalog supports competitive scans, design critiques, and engineering handoff. One reference layer from discovery through iteration.",
  },
  {
    icon: UsersRound,
    title: "Built for cross-functional teams",
    body: "PMs, designers, researchers, and engineers share one searchable source of truth instead of scattered Notion dumps and one-off decks.",
  },
] as const;

const DIFFERENTIATORS = [
  {
    instead: "Visual inspiration galleries",
    productbench:
      "Workflows, feature inventories, and IA depth alongside the UI — enough context to inform decisions, not just moodboards.",
  },
  {
    instead: "Bookmark folders and screenshot dumps",
    productbench:
      "Filterable by category, industry, UX pattern, and tech stack — with semantic search across the full catalog.",
  },
  {
    instead: "Point-in-time competitive audits",
    productbench:
      "A living database you revisit as products evolve, with documented capture of screens, patterns, and stack signals.",
  },
] as const;

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

      <section className="space-y-10">
        <div className="space-y-4">
          <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
            Why ProductBench
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Teams burn cycles rediscovering patterns in isolation — hunting through
            bookmarks, stale decks, and pretty screenshots that hide how products
            actually work. ProductBench exists because product craft deserves
            reference material that is structured enough to search and cite, and
            deep enough to shape real decisions.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {WHY_PILLARS.map((item) => (
            <article
              key={item.title}
              className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-5 sm:p-6"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background">
                <item.icon className="size-4" />
              </span>
              <h3 className="font-heading text-lg tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-border/80 bg-background p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80">
              <BookmarkX className="size-4" />
            </span>
            <div className="space-y-1">
              <h3 className="font-heading text-lg tracking-tight sm:text-xl">
                Not another bookmark folder
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Most teams already collect inspiration. The gap is structure —
                making it comparable, searchable, and useful outside a single
                project folder.
              </p>
            </div>
          </div>

          <dl className="mt-6 divide-y divide-border/70">
            {DIFFERENTIATORS.map((item) => (
              <div
                key={item.instead}
                className="grid gap-2 py-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-6"
              >
                <dt className="text-sm font-medium text-muted-foreground/80">
                  {item.instead}
                </dt>
                <dd className="text-sm leading-relaxed text-foreground/90">
                  {item.productbench}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

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
