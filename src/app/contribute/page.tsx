import type { Metadata } from "next";

import { ContributeForm } from "@/components/contribute/contribute-form";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "Add a product to ProductBench — share UX patterns, workflows, tech stacks, and architecture notes.",
};

export default function ContributePage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-4">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Contribute
        </p>
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
          Add a product
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Help grow the research database. Submit a product with enough UX,
          workflow, and stack detail for other teams to learn from.
        </p>
      </div>

      <Separator className="my-10" />

      <ContributeForm />
    </div>
  );
}
