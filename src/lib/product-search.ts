import type { Product } from "@/data/types";
import { formatLabel } from "@/lib/filters";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "what",
  "which",
  "who",
  "why",
]);

/**
 * Research-oriented concept expansion — maps intent phrases to related catalog vocabulary.
 * Synonym hits score lower than direct text matches.
 */
const SEARCH_CONCEPTS: Record<string, string[]> = {
  ai: [
    "artificial intelligence",
    "machine learning",
    "copilot",
    "assistant",
    "llm",
    "generative",
    "automation",
  ],
  analytics: [
    "dashboard",
    "reporting",
    "metrics",
    "insights",
    "charts",
    "bi",
    "observability",
  ],
  auth: [
    "authentication",
    "authorization",
    "identity",
    "login",
    "sso",
    "oauth",
    "security",
    "access",
  ],
  billing: ["payments", "invoicing", "subscription", "checkout", "pricing", "fintech"],
  checkout: ["payments", "cart", "commerce", "ecommerce", "billing"],
  collaboration: [
    "sharing",
    "teams",
    "workspace",
    "comments",
    "real-time",
    "multiplayer",
  ],
  crm: ["sales", "pipeline", "contacts", "leads", "customer"],
  dashboard: ["analytics", "reporting", "metrics", "overview", "monitoring"],
  design: ["figma", "prototype", "ui", "ux", "components", "design system"],
  devtools: ["developer", "api", "sdk", "cli", "deployment", "ci", "cd"],
  docs: ["documentation", "knowledge base", "wiki", "help center", "guides"],
  ecommerce: ["commerce", "storefront", "catalog", "checkout", "retail", "shop"],
  email: ["newsletter", "campaigns", "messaging", "inbox", "marketing"],
  enterprise: ["b2b", "admin", "permissions", "governance", "compliance"],
  fintech: ["payments", "banking", "finance", "billing", "wallet"],
  forms: ["survey", "intake", "submission", "questionnaire", "fields"],
  healthcare: ["hipaa", "clinical", "patient", "medical", "health"],
  login: ["sign in", "authentication", "auth", "sso", "identity"],
  mobile: ["ios", "android", "app", "native"],
  monitoring: ["alerts", "incidents", "observability", "logs", "apm", "uptime"],
  onboarding: ["signup", "sign up", "registration", "activation", "welcome"],
  payments: ["billing", "checkout", "fintech", "invoicing", "stripe"],
  productivity: ["workflow", "tasks", "notes", "docs", "project management"],
  search: ["discovery", "filter", "query", "index", "find"],
  security: ["auth", "compliance", "encryption", "permissions", "sso"],
  signup: ["sign up", "registration", "onboarding", "create account"],
  support: ["help desk", "ticketing", "customer service", "chat"],
  workflow: ["automation", "process", "pipeline", "orchestration", "tasks"],
};

type WeightedField = {
  text: string;
  weight: number;
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[-_]/g, " ");
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[\s,./|+:]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function expandQueryTerms(terms: string[]): string[] {
  const expanded = new Set(terms);

  for (const term of terms) {
    const concept = SEARCH_CONCEPTS[term];
    if (concept) {
      for (const related of concept) {
        for (const token of tokenize(related)) {
          expanded.add(token);
        }
      }
    }

    for (const [key, related] of Object.entries(SEARCH_CONCEPTS)) {
      const relatedTokens = related.flatMap((value) => tokenize(value));
      if (
        key === term ||
        relatedTokens.includes(term) ||
        related.some((value) => normalizeText(value).includes(term))
      ) {
        expanded.add(key);
        for (const token of relatedTokens) {
          expanded.add(token);
        }
      }
    }
  }

  return [...expanded];
}

function getProductFields(product: Product): WeightedField[] {
  const workflowText = product.workflows.flatMap((workflow) => [
    workflow.name,
    workflow.description,
    ...workflow.steps,
    ...workflow.roles,
  ]);

  const capture = product.captureInsights;

  return [
    { text: product.name, weight: 12 },
    { text: product.company, weight: 9 },
    { text: product.tagline, weight: 8 },
    { text: product.description, weight: 6 },
    { text: product.longDescription, weight: 5 },
    { text: formatLabel(product.category), weight: 4 },
    { text: product.category, weight: 4 },
    { text: product.ux.designSystem, weight: 3 },
    { text: product.ux.navigation, weight: 3 },
    { text: product.ux.interactionModel, weight: 3 },
    { text: product.ux.accessibility, weight: 2 },
    ...product.tags.map((tag) => ({ text: tag, weight: 5 })),
    ...product.features.map((feature) => ({ text: feature, weight: 5 })),
    ...product.techStack.map((tech) => ({ text: tech, weight: 4 })),
    ...product.industries.map((industry) => ({ text: industry, weight: 3 })),
    ...product.segments.map((segment) => ({ text: segment, weight: 2 })),
    ...product.platforms.map((platform) => ({ text: platform, weight: 2 })),
    ...product.ux.patterns.map((pattern) => ({ text: pattern, weight: 4 })),
    ...product.ux.keyScreens.map((screen) => ({ text: screen, weight: 3 })),
    ...product.integrations.map((integration) => ({
      text: integration,
      weight: 3,
    })),
    ...product.competitors.map((competitor) => ({
      text: competitor,
      weight: 2,
    })),
    ...workflowText.map((text) => ({ text, weight: 3 })),
    ...(capture?.summary ? [{ text: capture.summary, weight: 4 }] : []),
    ...(capture?.headings ?? []).map((heading) => ({
      text: heading,
      weight: 2,
    })),
    ...(capture?.featureCandidates ?? []).map((feature) => ({
      text: feature,
      weight: 3,
    })),
    ...(capture?.patternCandidates ?? []).map((pattern) => ({
      text: pattern,
      weight: 3,
    })),
  ];
}

function termScore(term: string, field: WeightedField, direct: boolean): number {
  const text = normalizeText(field.text);
  if (!text) return 0;

  const multiplier = direct ? 1 : 0.55;

  if (text === term) return field.weight * 3 * multiplier;
  if (text.startsWith(term)) return field.weight * 2.25 * multiplier;
  if (text.split(/\s+/).some((word) => word.startsWith(term))) {
    return field.weight * 1.75 * multiplier;
  }
  if (text.includes(term)) return field.weight * multiplier;
  return 0;
}

/** Score how well a product matches a free-text catalog query. */
export function scoreProductSearch(product: Product, query: string): number {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 0;

  const queryTerms = tokenize(normalizedQuery);
  if (queryTerms.length === 0) return 0;

  const expandedTerms = expandQueryTerms(queryTerms);
  const directTerms = new Set(queryTerms);
  const fields = getProductFields(product);
  const corpus = fields.map((field) => normalizeText(field.text)).join(" ");

  let score = 0;

  if (corpus.includes(normalizedQuery)) {
    score += 24;
    if (normalizeText(product.name).includes(normalizedQuery)) {
      score += 40;
    }
  }

  let matchedDirectTerms = 0;

  for (const term of expandedTerms) {
    const direct = directTerms.has(term);
    let bestForTerm = 0;

    for (const field of fields) {
      bestForTerm = Math.max(bestForTerm, termScore(term, field, direct));
    }

    if (bestForTerm > 0) {
      score += bestForTerm;
      if (direct) matchedDirectTerms += 1;
    }
  }

  if (queryTerms.length > 1) {
    const directCoverage = matchedDirectTerms / queryTerms.length;
    if (directCoverage >= 1) score += 18;
    else if (directCoverage >= 0.5) score += 8;
    else if (matchedDirectTerms === 0) score *= 0.35;
  }

  return score;
}

export function matchesProductSearch(product: Product, query: string): boolean {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return true;

  const queryTerms = tokenize(normalizedQuery);
  if (queryTerms.length === 0) return true;

  return scoreProductSearch(product, normalizedQuery) >= 4;
}

export function getCatalogHeading(query: string): {
  title: string;
  description: string;
} {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      title: "Product catalog",
      description:
        "Explore enterprise, consumer, and industrial software through UX patterns, workflows, tech stacks, and product architecture.",
    };
  }

  return {
    title: `Results for “${trimmed}”`,
    description: `Semantic matches for “${trimmed}” across product names, UX patterns, workflows, tech stacks, and research notes.`,
  };
}
