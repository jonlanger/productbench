import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AddDetailsForm } from "@/components/product/add-details-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getVisibleProductBySlug } from "@/data/queries";
import { getViewer } from "@/lib/auth";
import { hasDatabaseUrl } from "@/db";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getVisibleProductBySlug(slug);
  return {
    title: product ? `Add details to ${product.name}` : "Add details",
    description: product
      ? `Share screenshots and UI notes for ${product.name}.`
      : "Submit screenshots and UI details for review.",
  };
}

export default async function AddDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getVisibleProductBySlug(slug);
  if (!product) {
    redirect("/catalog");
  }

  const { user } = await getViewer();
  if (!user) {
    redirect(
      `/sign-in?next=${encodeURIComponent(`/products/${slug}/add-details`)}`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Contribute
        </p>
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
          Add details to {product.name}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Upload screenshots of key surfaces, components, or flows. Submissions
          are reviewed before they appear in the gallery.
        </p>
      </div>

      <Separator className="my-8" />

      {!hasDatabaseUrl() ? (
        <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/30 px-6 py-8 text-sm text-muted-foreground">
          <p>Submissions require a connected database.</p>
          <Button render={<Link href={`/products/${slug}`} />} variant="outline">
            Back to product
          </Button>
        </div>
      ) : (
        <AddDetailsForm
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
          userId={user.id}
        />
      )}
    </div>
  );
}
