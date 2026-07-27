import type {
  BentoSize,
  Platform,
  PricingModel,
  Product,
  ProductCategory,
  ProductUx,
  Workflow,
} from "../types";

export type ProductManifestEntry = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription?: string;
  category: ProductCategory;
  segments: Product["segments"];
  industries: string[];
  website: string;
  founded: number;
  company: string;
  headquarters: string;
  pricing: PricingModel;
  platforms: Platform[];
  techStack: string[];
  features: string[];
  workflows?: Workflow[];
  ux?: Partial<ProductUx>;
  metrics?: Partial<Product["metrics"]>;
  integrations?: string[];
  competitors?: string[];
  accent?: string;
  bentoSize?: BentoSize;
  tags?: string[];
  isPublic?: boolean;
};

const CATEGORY_DEFAULTS: Record<
  ProductCategory,
  Pick<ProductUx, "density" | "interactionModel"> & {
    pageCount: number;
    screenCount: number;
    featureCount: number;
    iaDepth: number;
  }
> = {
  devtools: {
    density: "compact",
    interactionModel: "IDE / console workflow",
    pageCount: 90,
    screenCount: 140,
    featureCount: 200,
    iaDepth: 4,
  },
  productivity: {
    density: "comfortable",
    interactionModel: "Document and task workspace",
    pageCount: 55,
    screenCount: 85,
    featureCount: 120,
    iaDepth: 3,
  },
  enterprise: {
    density: "compact",
    interactionModel: "Record-centric enterprise console",
    pageCount: 200,
    screenCount: 350,
    featureCount: 500,
    iaDepth: 5,
  },
  saas: {
    density: "comfortable",
    interactionModel: "Multi-tenant SaaS dashboard",
    pageCount: 70,
    screenCount: 110,
    featureCount: 160,
    iaDepth: 4,
  },
  fintech: {
    density: "comfortable",
    interactionModel: "Financial operations console",
    pageCount: 80,
    screenCount: 120,
    featureCount: 180,
    iaDepth: 4,
  },
  healthcare: {
    density: "compact",
    interactionModel: "Clinical and admin workflow",
    pageCount: 150,
    screenCount: 280,
    featureCount: 400,
    iaDepth: 6,
  },
  security: {
    density: "compact",
    interactionModel: "Security operations console",
    pageCount: 100,
    screenCount: 160,
    featureCount: 220,
    iaDepth: 4,
  },
  ecommerce: {
    density: "comfortable",
    interactionModel: "Merchant and storefront admin",
    pageCount: 75,
    screenCount: 115,
    featureCount: 170,
    iaDepth: 4,
  },
  consumer: {
    density: "spacious",
    interactionModel: "Feed and discovery experience",
    pageCount: 40,
    screenCount: 65,
    featureCount: 90,
    iaDepth: 3,
  },
  industrial: {
    density: "compact",
    interactionModel: "Engineering and operations console",
    pageCount: 250,
    screenCount: 450,
    featureCount: 600,
    iaDepth: 6,
  },
};

const ACCENT_PALETTE = [
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#059669",
  "#0891B2",
  "#4F46E5",
  "#BE123C",
  "#0D9488",
  "#CA8A04",
];

function defaultWorkflows(entry: ProductManifestEntry): Workflow[] {
  return [
    {
      name: "Day-to-day operator workflow",
      description: `Primary recurring task flow for ${entry.name} users.`,
      steps: [
        "Sign in and open the home dashboard",
        "Navigate to the core workspace",
        "Create or update the primary record",
        "Collaborate or share with teammates",
        "Review status and close out the session",
      ],
      roles: ["Operator", "Admin"],
    },
    {
      name: "Admin configuration",
      description: `Set up permissions, integrations, and defaults in ${entry.name}.`,
      steps: [
        "Open admin or settings",
        "Configure roles and access",
        "Connect integrations",
        "Set notification defaults",
        "Validate with a test user",
      ],
      roles: ["Admin", "IT"],
    },
  ];
}

function defaultUx(entry: ProductManifestEntry): ProductUx {
  const defaults = CATEGORY_DEFAULTS[entry.category];
  return {
    designSystem: `${entry.name} design system`,
    navigation: "Primary sidebar + contextual top bar",
    patterns: [
      "Dashboard home",
      "Search",
      "Settings",
      "Notifications",
      "Empty states",
    ],
    accessibility: "Keyboard navigation and screen reader support vary by surface",
    density: defaults.density,
    interactionModel: defaults.interactionModel,
    keyScreens: ["Home", "Dashboard", "Settings", "Search", "Profile"],
    ...entry.ux,
  };
}

export function expandProductManifest(
  entry: ProductManifestEntry,
  id: string,
): Product {
  const defaults = CATEGORY_DEFAULTS[entry.category];
  const accent =
    entry.accent ??
    ACCENT_PALETTE[Number(id) % ACCENT_PALETTE.length] ??
    "#2563EB";

  return {
    id,
    slug: entry.slug,
    name: entry.name,
    tagline: entry.tagline,
    description: entry.description,
    longDescription:
      entry.longDescription ??
      `${entry.description} A representative ${entry.category} product for UX pattern research — navigation density, onboarding, and core operator flows.`,
    category: entry.category,
    segments: entry.segments,
    industries: entry.industries,
    website: entry.website,
    founded: entry.founded,
    company: entry.company,
    headquarters: entry.headquarters,
    pricing: entry.pricing,
    platforms: entry.platforms,
    techStack: entry.techStack,
    features: entry.features,
    workflows: entry.workflows ?? defaultWorkflows(entry),
    ux: defaultUx(entry),
    metrics: {
      pageCount: entry.metrics?.pageCount ?? defaults.pageCount,
      screenCount: entry.metrics?.screenCount ?? defaults.screenCount,
      featureCount: entry.metrics?.featureCount ?? defaults.featureCount,
      userRoles: entry.metrics?.userRoles ?? ["User", "Admin"],
      estimatedIaDepth:
        entry.metrics?.estimatedIaDepth ?? defaults.iaDepth,
    },
    integrations: entry.integrations ?? [],
    competitors: entry.competitors ?? [],
    accent,
    bentoSize: entry.bentoSize ?? "sm",
    tags: entry.tags ?? [entry.category],
    isPublic: entry.isPublic ?? true,
  };
}
