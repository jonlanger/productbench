import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetails } from "@/components/product/product-details";
import { getVisibleProductBySlug } from "@/data/queries";
import { getViewer } from "@/lib/auth";
import { GUEST_PREVIEW_COUNT } from "@/lib/gallery";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getVisibleProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: `${product.name} · ProductBench`,
    description: product.tagline,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, { user }] = await Promise.all([
    getVisibleProductBySlug(slug),
    getViewer(),
  ]);
  if (!product) notFound();

  const signedIn = Boolean(user);
  const allShots = product.screenshots ?? [];
  const screenshotTotal = allShots.length;
  const productForView =
    signedIn || screenshotTotal <= GUEST_PREVIEW_COUNT
      ? product
      : {
          ...product,
          screenshots: allShots.slice(0, GUEST_PREVIEW_COUNT),
        };

  return (
    <ProductDetails
      product={productForView}
      signedIn={signedIn}
      screenshotTotal={screenshotTotal}
    />
  );
}
