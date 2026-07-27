"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Tone = "ink" | "steel" | "mist" | "slate" | "fog";

type BentoCell = {
  id: string;
  className: string;
  tone: Tone;
  label: string;
  detail: string;
};

type BentoLayout = {
  id: string;
  cells: BentoCell[];
};

/** Layouts mirror Product Details sections — sizes reshuffle every rotation. */
const LAYOUTS: BentoLayout[] = [
  {
    id: "ux-core",
    cells: [
      {
        id: "design-system",
        className: "col-span-2 row-span-2",
        tone: "ink",
        label: "Design Systems",
        detail: "Tokens & components",
      },
      {
        id: "interaction",
        className: "col-span-1 row-span-1",
        tone: "steel",
        label: "Interaction",
        detail: "Model",
      },
      {
        id: "a11y",
        className: "col-span-1 row-span-1",
        tone: "mist",
        label: "Accessibility",
        detail: "WCAG notes",
      },
      {
        id: "nav",
        className: "col-span-1 row-span-1",
        tone: "slate",
        label: "Navigation",
        detail: "IA shell",
      },
      {
        id: "features",
        className: "col-span-2 row-span-1",
        tone: "fog",
        label: "Features",
        detail: "Capability surface",
      },
    ],
  },
  {
    id: "screens-flows",
    cells: [
      {
        id: "key-screens",
        className: "col-span-2 row-span-2",
        tone: "slate",
        label: "Key Screens",
        detail: "Primary surfaces",
      },
      {
        id: "use-case",
        className: "col-span-1 row-span-2",
        tone: "ink",
        label: "Use Case",
        detail: "Workflows",
      },
      {
        id: "interaction-2",
        className: "col-span-1 row-span-1",
        tone: "mist",
        label: "Interaction",
        detail: "Patterns",
      },
      {
        id: "nav-2",
        className: "col-span-2 row-span-1",
        tone: "steel",
        label: "Navigation",
        detail: "Wayfinding",
      },
    ],
  },
  {
    id: "quality",
    cells: [
      {
        id: "a11y-2",
        className: "col-span-1 row-span-2",
        tone: "fog",
        label: "Accessibility",
        detail: "Inclusive UX",
      },
      {
        id: "features-2",
        className: "col-span-2 row-span-1",
        tone: "ink",
        label: "Features",
        detail: "Inventory",
      },
      {
        id: "design-2",
        className: "col-span-2 row-span-1",
        tone: "steel",
        label: "Design Systems",
        detail: "Language",
      },
      {
        id: "screens-2",
        className: "col-span-2 row-span-1",
        tone: "mist",
        label: "Key Screens",
        detail: "Architecture",
      },
      {
        id: "use-2",
        className: "col-span-1 row-span-1",
        tone: "slate",
        label: "Use Case",
        detail: "By role",
      },
    ],
  },
  {
    id: "journey",
    cells: [
      {
        id: "use-3",
        className: "col-span-3 row-span-1",
        tone: "ink",
        label: "Use Case",
        detail: "End-to-end workflows",
      },
      {
        id: "nav-3",
        className: "col-span-1 row-span-2",
        tone: "steel",
        label: "Navigation",
        detail: "Shell & search",
      },
      {
        id: "interaction-3",
        className: "col-span-1 row-span-1",
        tone: "mist",
        label: "Interaction",
        detail: "Density",
      },
      {
        id: "a11y-3",
        className: "col-span-1 row-span-1",
        tone: "fog",
        label: "Accessibility",
        detail: "Support",
      },
      {
        id: "design-3",
        className: "col-span-2 row-span-1",
        tone: "slate",
        label: "Design Systems",
        detail: "Patterns",
      },
    ],
  },
  {
    id: "architecture",
    cells: [
      {
        id: "features-3",
        className: "col-span-1 row-span-2",
        tone: "ink",
        label: "Features",
        detail: "Depth",
      },
      {
        id: "screens-3",
        className: "col-span-2 row-span-1",
        tone: "steel",
        label: "Key Screens",
        detail: "IA map",
      },
      {
        id: "design-4",
        className: "col-span-1 row-span-1",
        tone: "mist",
        label: "Design Systems",
        detail: "Foundations",
      },
      {
        id: "interaction-4",
        className: "col-span-1 row-span-1",
        tone: "slate",
        label: "Interaction",
        detail: "Behaviors",
      },
      {
        id: "nav-4",
        className: "col-span-2 row-span-1",
        tone: "fog",
        label: "Navigation",
        detail: "Hierarchy",
      },
      {
        id: "a11y-4",
        className: "col-span-1 row-span-1",
        tone: "steel",
        label: "Accessibility",
        detail: "Keyboard",
      },
    ],
  },
  {
    id: "research",
    cells: [
      {
        id: "use-4",
        className: "col-span-2 row-span-1",
        tone: "mist",
        label: "Use Case",
        detail: "Jobs to be done",
      },
      {
        id: "a11y-5",
        className: "col-span-1 row-span-1",
        tone: "ink",
        label: "Accessibility",
        detail: "Coverage",
      },
      {
        id: "design-5",
        className: "col-span-1 row-span-2",
        tone: "slate",
        label: "Design Systems",
        detail: "UI language",
      },
      {
        id: "screens-4",
        className: "col-span-2 row-span-2",
        tone: "fog",
        label: "Key Screens",
        detail: "Critical path",
      },
    ],
  },
];

const toneStyles: Record<Tone, string> = {
  ink: "bg-[oklch(0.26_0.035_240)] text-white",
  steel: "bg-[oklch(0.7_0.045_220)] text-[oklch(0.2_0.03_240)]",
  mist: "bg-[oklch(0.88_0.025_195)] text-[oklch(0.28_0.03_220)]",
  slate: "bg-[oklch(0.48_0.035_250)] text-white",
  fog: "bg-background/85 text-[oklch(0.32_0.025_240)] ring-1 ring-foreground/10",
};

const ROTATE_MS = 10_000;
const FADE_MS = 350;

export function HeroBento() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let fadeTimeout: number | undefined;
    const id = window.setInterval(() => {
      setVisible(false);
      fadeTimeout = window.setTimeout(() => {
        setIndex((current) => (current + 1) % LAYOUTS.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);

    return () => {
      window.clearInterval(id);
      if (fadeTimeout) window.clearTimeout(fadeTimeout);
    };
  }, []);

  const layout = LAYOUTS[index];

  return (
    <div
      className="hero-bento w-full shrink-0 lg:w-[34%] lg:max-w-[380px]"
      aria-hidden
    >
      <div
        key={layout.id}
        className={cn(
          "grid aspect-square w-full grid-cols-3 grid-rows-3 gap-2 transition-opacity duration-300 ease-out",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {layout.cells.map((cell, cellIndex) => (
          <div
            key={`${layout.id}-${cell.id}`}
            className={cn(
              "hero-bento-cell relative overflow-hidden rounded-xl p-3 sm:rounded-2xl sm:p-3.5",
              toneStyles[cell.tone],
              cell.className,
            )}
            style={{ animationDelay: `${cellIndex * 0.05}s` }}
          >
            <div className="relative flex h-full flex-col justify-between gap-1">
              <span className="font-heading text-sm leading-tight tracking-tight sm:text-base">
                {cell.label}
              </span>
              <span className="text-[10px] tracking-[0.12em] uppercase opacity-65">
                {cell.detail}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {LAYOUTS.map((item, i) => (
          <span
            key={item.id}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              i === index ? "w-4 bg-foreground/50" : "w-1 bg-foreground/20",
            )}
          />
        ))}
      </div>
    </div>
  );
}
