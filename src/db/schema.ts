import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type {
  BentoSize,
  Platform,
  PricingModel,
  ProductCaptureInsights,
  ProductCategory,
  ProductMetrics,
  ProductScreenshot,
  ProductUx,
  Workflow,
} from "@/data/types";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type ScreenshotSubmissionItem = {
  title: string;
  caption?: string;
  kind: "product" | "component";
  sourceUrl?: string;
  storagePath: string;
  publicUrl: string;
};

export type ScreenshotSubmissionPayload = {
  type: "screenshots";
  items: ScreenshotSubmissionItem[];
  note?: string;
};

export type SubmissionPayload = ScreenshotSubmissionPayload;

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description").notNull(),
  category: text("category").$type<ProductCategory>().notNull(),
  segments: jsonb("segments")
    .$type<("B2B" | "B2C" | "B2B2C" | "internal")[]>()
    .notNull(),
  industries: jsonb("industries").$type<string[]>().notNull(),
  website: text("website").notNull(),
  founded: integer("founded").notNull(),
  company: text("company").notNull(),
  headquarters: text("headquarters").notNull(),
  pricing: text("pricing").$type<PricingModel>().notNull(),
  platforms: jsonb("platforms").$type<Platform[]>().notNull(),
  techStack: jsonb("tech_stack").$type<string[]>().notNull(),
  features: jsonb("features").$type<string[]>().notNull(),
  workflows: jsonb("workflows").$type<Workflow[]>().notNull(),
  ux: jsonb("ux").$type<ProductUx>().notNull(),
  metrics: jsonb("metrics").$type<ProductMetrics>().notNull(),
  integrations: jsonb("integrations").$type<string[]>().notNull(),
  competitors: jsonb("competitors").$type<string[]>().notNull(),
  accent: text("accent").notNull(),
  bentoSize: text("bento_size").$type<BentoSize>().notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  /** Public catalog entries are visible without an admin account. */
  isPublic: boolean("is_public").notNull().default(true),
  screenshots: jsonb("screenshots")
    .$type<ProductScreenshot[]>()
    .notNull()
    .default([]),
  captureInsights: jsonb("capture_insights").$type<ProductCaptureInsights | null>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const productSubmissions = pgTable("product_submissions", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  productSlug: text("product_slug").notNull(),
  productName: text("product_name").notNull(),
  submitterUserId: text("submitter_user_id").notNull(),
  submitterEmail: text("submitter_email"),
  status: text("status").$type<SubmissionStatus>().notNull().default("pending"),
  payload: jsonb("payload").$type<SubmissionPayload>().notNull(),
  reviewNote: text("review_note"),
  reviewedByEmail: text("reviewed_by_email"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductSubmissionRow = typeof productSubmissions.$inferSelect;
export type NewProductSubmissionRow = typeof productSubmissions.$inferInsert;
