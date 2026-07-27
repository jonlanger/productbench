import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetails } from "@/components/product/product-details";
import {
  getPublicProductSlugs,
  getVisibleProductBySlug,
} from "@/data/queries";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPublicProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

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
  const product = await getVisibleProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetails product={product} />;
}
