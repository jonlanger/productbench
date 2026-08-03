export type ProductCategory =
  | "enterprise"
  | "consumer"
  | "industrial"
  | "saas"
  | "fintech"
  | "healthcare"
  | "devtools"
  | "ecommerce"
  | "productivity"
  | "security";

export type PricingModel =
  | "free"
  | "freemium"
  | "subscription"
  | "enterprise"
  | "usage-based"
  | "one-time";

export type Platform = "web" | "ios" | "android" | "desktop" | "api" | "cli";

export type UxDensity = "compact" | "comfortable" | "spacious";

export type BentoSize = "sm" | "md" | "lg" | "wide" | "tall" | "hero";

export type Workflow = {
  name: string;
  description: string;
  steps: string[];
  roles: string[];
};

export type ProductUx = {
  designSystem: string;
  navigation: string;
  patterns: string[];
  accessibility: string;
  density: UxDensity;
  interactionModel: string;
  keyScreens: string[];
};

export type ProductMetrics = {
  pageCount: number;
  screenCount: number;
  featureCount: number;
  userRoles: string[];
  estimatedIaDepth: number;
};

export type ProductScreenshotKind =
  | "homepage"
  | "product"
  | "component"
  | "docs"
  | "marketing"
  | "technical"
  | "supporting";

/** Atomic-design level inferred from tag/role/nesting depth. */
export type AtomicDesignLevel =
  | "atom"
  | "molecule"
  | "organism"
  | "template"
  | "page";

export type ElementInteractionState =
  | "default"
  | "hover"
  | "active"
  | "disabled"
  | "focused";

/** Per-element structured capture keyed to a screenshot (locator clips). */
export type ElementCapture = {
  capturedAt: string;
  /** Taxonomy layer this element primarily documents */
  taxonomyLayer?:
    | "surface"
    | "component"
    | "state"
    | "structure"
    | "source";
  /** Interaction state at capture time (default / hover / …) */
  interactionState?: ElementInteractionState;
  dom: {
    tagName: string;
    role: string | null;
    /** Semantic HTML / ARIA hint: button, nav, dialog, etc. */
    semanticHint: string | null;
    nestingDepth: number;
    atomicLevel: AtomicDesignLevel;
    accessibleName?: string | null;
    id?: string | null;
    classList?: string[];
    attributes?: Record<string, string>;
  };
  styles: {
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: string;
    margin?: string;
    padding?: string;
    borderRadius?: string;
    boxShadow?: string;
    border?: string;
    borderColor?: string;
    display?: string;
    gap?: string;
    opacity?: string;
  };
  /** CSS custom properties resolved on the element + :root (design tokens). */
  cssVariables: Record<string, string>;
  text: {
    visibleText?: string;
    placeholder?: string | null;
    ariaLabel?: string | null;
    nearbyLabels?: string[];
    linkHref?: string | null;
  };
  layout: {
    boundingBox: { x: number; y: number; width: number; height: number };
    display?: string;
    position?: string;
    flexOrGrid?: "flex" | "inline-flex" | "grid" | "inline-grid" | "none";
    parentDisplay?: string | null;
    breakpoint?: "mobile" | "tablet" | "desktop";
    viewport?: { width: number; height: number };
  };
  interaction: {
    /** Inferred / declared listeners: click, change, hover, focus, … */
    events: string[];
    disabled?: boolean;
    focused?: boolean;
    expanded?: boolean | null;
    pressed?: boolean | null;
    checked?: boolean | null;
    /** Related state-variant screenshot filenames from the same playbook step */
    stateShots?: Partial<Record<ElementInteractionState, string>>;
  };
};

export type ProductScreenshot = {
  title: string;
  src: string;
  caption?: string;
  kind?: ProductScreenshotKind;
  sourceUrl?: string;
  /** Capture metadata (Playwright agent) */
  capturedAt?: string;
  viewport?: { width: number; height: number };
  scrollY?: number;
  pageTitle?: string;
  width?: number;
  height?: number;
  phash?: string;
  playbookStep?: string;
  unique?: boolean;
  /**
   * Structured DOM / styles / tokens / layout for locator-clipped shots.
   * Absent on full-page viewport captures and downloaded fallback images.
   */
  element?: ElementCapture;
};

/** Structured observations gathered by the Playwright capture agent */
export type CapturePageInsight = {
  url: string;
  title: string;
  description?: string;
  headings: string[];
  navLabels: string[];
  ctas: string[];
  landmarks: string[];
};

export type ProductCaptureInsights = {
  capturedAt: string;
  screenshotCount: number;
  pageCount: number;
  pages: CapturePageInsight[];
  navLabels: string[];
  ctas: string[];
  headings: string[];
  techSignals: string[];
  featureCandidates: string[];
  patternCandidates: string[];
  platformsDetected: Platform[];
  summary: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  category: ProductCategory;
  segments: ("B2B" | "B2C" | "B2B2C" | "internal")[];
  industries: string[];
  website: string;
  founded: number;
  company: string;
  headquarters: string;
  pricing: PricingModel;
  platforms: Platform[];
  techStack: string[];
  features: string[];
  workflows: Workflow[];
  ux: ProductUx;
  metrics: ProductMetrics;
  integrations: string[];
  competitors: string[];
  accent: string;
  bentoSize: BentoSize;
  tags: string[];
  /**
   * When false, only admin accounts can see this product.
   * Defaults to true for the public guest catalog (~50 products).
   */
  isPublic?: boolean;
  screenshots?: ProductScreenshot[];
  captureInsights?: ProductCaptureInsights | null;
};

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "founded-desc"
  | "founded-asc"
  | "pages-desc"
  | "pages-asc"
  | "features-desc"
  | "screens-desc";

export type FilterState = {
  query: string;
  categories: ProductCategory[];
  segments: string[];
  platforms: Platform[];
  pricing: PricingModel[];
  techStack: string[];
  features: string[];
  industries: string[];
  density: UxDensity[];
  pageCountRange: [number, number];
  sort: SortOption;
};
