import { HomeFeaturedCatalog } from "@/components/home/home-featured-catalog";
import { HomeHero } from "@/components/home/home-hero";
import { HomeValueSections } from "@/components/home/home-value-sections";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeFeaturedCatalog />
      <HomeValueSections />
    </>
  );
}
