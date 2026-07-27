/**
 * Capture taxonomy for ProductBench visual research.
 * Used by the /process page and by capture scripts.
 */

export type CaptureLayer =
  | "surface"
  | "component"
  | "state"
  | "structure"
  | "source";

export type CaptureTarget = {
  id: string;
  layer: CaptureLayer;
  title: string;
  why: string;
  examples: string[];
  how: string;
  loginRequired?: boolean;
};

export const CAPTURE_TARGETS: CaptureTarget[] = [
  {
    id: "homepage",
    layer: "surface",
    title: "Homepage / marketing entry",
    why: "Establishes brand, IA entry points, and first-impression hierarchy.",
    examples: ["Hero + search", "Category nav", "Featured carousels"],
    how: "Full viewport screenshot of the logged-out homepage.",
  },
  {
    id: "primary-flows",
    layer: "surface",
    title: "Primary product surfaces",
    why: "Shows how people actually complete the core job.",
    examples: [
      "Search / results + map",
      "Detail / record pages",
      "Dashboard / inbox",
      "Settings / admin",
    ],
    how: "Navigate each key screen; capture clean viewport (dismiss one-time modals).",
  },
  {
    id: "cards",
    layer: "component",
    title: "Cards & list items",
    why: "Reusable content units encode density, metadata priority, and affordances.",
    examples: [
      "Listing / product cards",
      "Feed rows",
      "Kanban cards",
      "Table row hover states",
    ],
    how: "Crop a single card or capture a dense card grid at component scale.",
  },
  {
    id: "modals",
    layer: "component",
    title: "Modals, sheets & dialogs",
    why: "Auth, confirmations, and multi-step flows often live here — not in page URLs.",
    examples: [
      "Sign in / sign up",
      "Filters panel",
      "Share / invite",
      "Checkout / pay walls",
    ],
    how: "Trigger the dialog, wait for animation, capture viewport or dialog element.",
  },
  {
    id: "menus",
    layer: "component",
    title: "Menus & chrome",
    why: "Navigation model, account structure, and secondary actions.",
    examples: [
      "Profile / account menu",
      "Command palette",
      "Overflow / ⋯ menus",
      "Tab bars",
    ],
    how: "Open menus without leaving the page; capture expanded state.",
  },
  {
    id: "forms",
    layer: "component",
    title: "Forms & inputs",
    why: "Search, filters, and create flows reveal validation and composition patterns.",
    examples: [
      "Search composers",
      "Date / guest pickers",
      "Multi-step wizards",
      "Inline editors",
    ],
    how: "Open composers and pickers; capture focused and filled states when useful.",
  },
  {
    id: "empty-error",
    layer: "state",
    title: "Empty, loading & error states",
    why: "Often the most intentional (or neglected) design work.",
    examples: [
      "Empty wishlist / inbox",
      "Skeleton loaders",
      "404 / permission denied",
      "Network error toasts",
    ],
    how: "Reach via empty account, throttling, or public error URLs when available.",
    loginRequired: true,
  },
  {
    id: "responsive",
    layer: "state",
    title: "Responsive / platform variants",
    why: "Same product, different density and nav models across breakpoints.",
    examples: ["Mobile bottom tabs", "Tablet split view", "Desktop dual pane"],
    how: "Capture at 390×844 and 1440×900 (or product-native breakpoints).",
  },
  {
    id: "dom-structure",
    layer: "structure",
    title: "Live DOM / a11y structure",
    why: "Reveals landmarks, heading order, roles, and component boundaries without source access.",
    examples: [
      "Landmark roles",
      "Heading outline",
      "Dialog focus traps",
      "Named interactive controls",
    ],
    how: "Inspect via browser DevTools / CDP / Playwright accessibility tree — not private source.",
  },
  {
    id: "open-source",
    layer: "source",
    title: "Open-source code (when available)",
    why: "Component APIs, design tokens, and IA naming become explicit.",
    examples: [
      "GitHub component folders",
      "Design token JSON",
      "Route / screen maps",
      "Storybook stories",
    ],
    how: "Only for products with public repos or Storybooks — never reverse-engineer private apps beyond public UI.",
  },
];

export const CAPTURE_LIMITS = [
  {
    title: "Public UI only",
    body: "We capture what any visitor can see without an account, plus documented help/docs imagery. Logged-in host/admin tools require credentials we do not automate.",
  },
  {
    title: "No credential stuffing",
    body: "Sign-in modals are captured as UI patterns. We do not submit credentials, bypass paywalls, or scrape private data.",
  },
  {
    title: "Fair-use research framing",
    body: "Screenshots are for product design research inside ProductBench — not for cloning brand assets or redistributing marketing creatives.",
  },
  {
    title: "Prefer real UI over OG cards",
    body: "Open Graph / social previews are fallbacks. Live viewport and component crops are the goal.",
  },
] as const;

export const CAPTURE_PIPELINE = [
  {
    step: "1",
    title: "Map the jobs",
    body: "Start from each product’s key screens and workflows — the jobs users hire the product for.",
  },
  {
    step: "2",
    title: "Capture surfaces",
    body: "Visit public entry points and primary flows. Prefer live interface over marketing artwork.",
  },
  {
    step: "3",
    title: "Capture components",
    body: "Open cards, menus, modals, and composers so galleries include the reusable UI units — not only full pages.",
  },
  {
    step: "4",
    title: "Capture depth",
    body: "Scroll long pages, follow same-origin nav, and gather help/docs surfaces so each product has a thick visual record.",
  },
  {
    step: "5",
    title: "Publish to the catalog",
    body: "Attach captures to the product record so detail pages and galleries stay in sync.",
  },
] as const;
