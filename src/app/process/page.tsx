import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Code2,
  Layers,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CAPTURE_LIMITS,
  CAPTURE_PIPELINE,
  CAPTURE_TARGETS,
  type CaptureLayer,
} from "@/data/capture-process";

export const metadata: Metadata = {
  title: "Process",
  description:
    "How ProductBench captures product UI — surfaces, components, states, and what we leave alone.",
};

const LAYER_LABEL: Record<CaptureLayer, string> = {
  surface: "Surfaces",
  component: "Components",
  state: "States",
  structure: "Structure",
  source: "Source",
};

const LAYERS: CaptureLayer[] = [
  "surface",
  "component",
  "state",
  "structure",
  "source",
];

export default function ProcessPage() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Process
        </p>
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
          What we look for in product UI
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          ProductBench is not a moodboard of hero images. We collect real
          interface surfaces — plus the smaller pieces designers actually reuse:
          cards, modals, menus, and empty states — and we document how that
          capture works.
        </p>
      </div>

      <Separator className="my-10" />

      <section className="space-y-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80">
            <Sparkles className="size-4" />
          </span>
          <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
            Capture pipeline
          </h2>
        </div>
        <ol className="grid gap-5">
          {CAPTURE_PIPELINE.map((item) => (
            <li
              key={item.step}
              className="grid gap-1 border-l-2 border-foreground/20 pl-4 sm:grid-cols-[3rem_1fr] sm:gap-4 sm:border-l-0 sm:pl-0"
            >
              <span className="font-heading text-2xl text-muted-foreground/70 tabular-nums">
                {item.step}
              </span>
              <div className="space-y-1">
                <h3 className="font-heading text-lg tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Separator className="my-10" />

      <section className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80">
              <Layers className="size-4" />
            </span>
            <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
              Capture taxonomy
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Full-page screenshots are necessary but not sufficient. We also want
            the atomic UI that makes a product feel like itself.
          </p>
        </div>

        {LAYERS.map((layer) => {
          const items = CAPTURE_TARGETS.filter((t) => t.layer === layer);
          return (
            <div key={layer} className="space-y-4">
              <h3 className="font-heading text-xl tracking-tight">
                {LAYER_LABEL[layer]}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                {items.map((target) => (
                  <article
                    key={target.id}
                    className="space-y-3 border-t border-border/80 pt-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-heading text-base tracking-tight">
                        {target.title}
                      </h4>
                      {target.loginRequired ? (
                        <span className="rounded-md border border-border/80 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                          Often login-walled
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {target.why}
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {target.examples.map((example) => (
                        <li key={example} className="flex gap-2">
                          <span className="text-foreground/40">·</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs leading-relaxed text-muted-foreground/90">
                      <span className="font-medium text-foreground/70">
                        How:{" "}
                      </span>
                      {target.how}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <Separator className="my-10" />

      <section className="space-y-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80">
            <Code2 className="size-4" />
          </span>
          <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
            Can we inspect the code?
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <article className="space-y-2 border-t border-border/80 pt-4">
            <h3 className="font-heading text-lg tracking-tight">
              Closed-source products
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We cannot open private application source — but we can inspect the
              live DOM: landmarks, heading outline, dialog roles, focus
              behavior, and CSS tokens exposed in the page. That is how we learn
              component boundaries without repo access.
            </p>
          </article>
          <article className="space-y-2 border-t border-border/80 pt-4">
            <h3 className="font-heading text-lg tracking-tight">
              Open-source products
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When a product ships a public repo, Storybook, or design-token
              package (e.g. many developer tools), we read those directly —
              routes, component APIs, and naming systems become first-class
              research inputs.
            </p>
          </article>
        </div>
      </section>

      <Separator className="my-10" />

      <section className="space-y-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80">
            <Boxes className="size-4" />
          </span>
          <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
            How we collect
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Collection is automated so every product gets a deep, consistent
          visual record — not a handful of hero shots. We visit public pages,
          scroll long surfaces, open menus and dialogs, crop cards and
          composers, and follow help or docs when they show real UI. Alongside
          screenshots we record navigation labels, calls to action, heading
          outlines, and other public UI signals so product pages stay research-
          rich. When a product needs richer coverage, we add product-specific
          capture steps on top of the shared playbook.
        </p>
        <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 sm:text-base">
          {[
            "As many public screens as we can reach without an account",
            "Component-level crops: cards, menus, modals, forms",
            "Scrolled sections of long marketing and docs pages",
            "Same-origin navigation into product / pricing / help",
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

      <Separator className="my-10" />

      <section className="space-y-6">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/80">
            <ShieldAlert className="size-4" />
          </span>
          <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
            Limits
          </h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {CAPTURE_LIMITS.map((limit) => (
            <li
              key={limit.title}
              className="space-y-2 border-t border-border/80 pt-4"
            >
              <h3 className="font-heading text-base tracking-tight">
                {limit.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {limit.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button render={<Link href="/catalog" />} size="lg">
          Browse the catalog
          <ArrowRight className="size-4" />
        </Button>
        <Button render={<Link href="/about" />} variant="outline" size="lg">
          About ProductBench
        </Button>
      </div>
    </div>
  );
}
