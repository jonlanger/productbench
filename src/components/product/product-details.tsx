import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  ExternalLink,
  Layers3,
  MapPin,
  MonitorSmartphone,
  Plus,
  Shield,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

import { ProductVisualGalleries } from "@/components/product/screenshot-carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product } from "@/data/types";
import { formatLabel } from "@/lib/filters";

export function ProductDetails({
  product,
  signedIn = false,
  screenshotTotal,
}: {
  product: Product;
  signedIn?: boolean;
  /** Full gallery size when guests only receive a preview slice. */
  screenshotTotal?: number;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to catalog
        </Link>
        <Button
          size="sm"
          variant="outline"
          render={<Link href={`/products/${product.slug}/add-details`} />}
        >
          <Plus className="size-3.5" />
          Add Details
        </Button>
      </div>

      <section className="relative mb-10 overflow-hidden rounded-3xl border border-border/80 bg-card">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            background: `radial-gradient(ellipse at top left, ${product.accent}, transparent 50%), radial-gradient(ellipse at bottom right, ${product.accent}, transparent 45%)`,
          }}
        />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:p-10">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{formatLabel(product.category)}</Badge>
              {product.segments.map((segment) => (
                <Badge key={segment} variant="outline">
                  {segment}
                </Badge>
              ))}
              <Badge variant="outline">{formatLabel(product.pricing)}</Badge>
            </div>

            <div className="flex items-start gap-4">
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-md"
                style={{ backgroundColor: product.accent }}
              >
                {product.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
                  {product.name}
                </h1>
                <p className="mt-1 text-base text-muted-foreground sm:text-lg">
                  {product.tagline}
                </p>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {product.longDescription}
            </p>

            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="font-normal">
                  #{tag}
                </Badge>
              ))}
            </div>

            <a
              href={product.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              Visit website
              <ExternalLink className="size-3.5" />
            </a>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Stat
              icon={<Building2 className="size-4" />}
              label="Company"
              value={product.company}
            />
            <Stat
              icon={<Calendar className="size-4" />}
              label="Founded"
              value={String(product.founded)}
            />
            <Stat
              icon={<MapPin className="size-4" />}
              label="HQ"
              value={product.headquarters}
            />
            <Stat
              icon={<Layers3 className="size-4" />}
              label="Page count"
              value={String(product.metrics.pageCount)}
            />
            <Stat
              icon={<MonitorSmartphone className="size-4" />}
              label="Screens"
              value={String(product.metrics.screenCount)}
            />
            <Stat
              icon={<Sparkles className="size-4" />}
              label="Features"
              value={String(product.metrics.featureCount)}
            />
          </div>
        </div>
      </section>

      {product.screenshots && product.screenshots.length > 0 ? (
        <ProductVisualGalleries
          slug={product.slug}
          screenshots={product.screenshots}
          accent={product.accent}
          signedIn={signedIn}
          screenshotTotal={screenshotTotal}
        />
      ) : null}

      <Tabs defaultValue="ux" className="gap-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger value="ux" className="rounded-lg border px-3 py-1.5 data-active:bg-foreground data-active:text-background">
            UX analysis
          </TabsTrigger>
          <TabsTrigger value="screens" className="rounded-lg border px-3 py-1.5 data-active:bg-foreground data-active:text-background">
            Screens
          </TabsTrigger>
          <TabsTrigger value="workflows" className="rounded-lg border px-3 py-1.5 data-active:bg-foreground data-active:text-background">
            Workflows
          </TabsTrigger>
          <TabsTrigger value="features" className="rounded-lg border px-3 py-1.5 data-active:bg-foreground data-active:text-background">
            Features
          </TabsTrigger>
          <TabsTrigger value="capture" className="rounded-lg border px-3 py-1.5 data-active:bg-foreground data-active:text-background">
            Live capture
          </TabsTrigger>
          <TabsTrigger value="stack" className="rounded-lg border px-3 py-1.5 data-active:bg-foreground data-active:text-background">
            Tech stack
          </TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-lg border px-3 py-1.5 data-active:bg-foreground data-active:text-background">
            Architecture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ux" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Design system" body={product.ux.designSystem} />
            <InfoCard title="Navigation model" body={product.ux.navigation} />
            <InfoCard
              title="Interaction model"
              body={product.ux.interactionModel}
            />
            <InfoCard title="Accessibility" body={product.ux.accessibility} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>UX patterns</CardTitle>
              <CardDescription>
                Recurring interaction and layout patterns observed in the
                product.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {product.ux.patterns.map((pattern) => (
                <Badge key={pattern} variant="secondary">
                  {pattern}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key screens</CardTitle>
              <CardDescription>
                Primary surfaces that define the product&apos;s information
                architecture.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-2 sm:grid-cols-2">
                {product.ux.keyScreens.map((screen, index) => (
                  <li
                    key={screen}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm"
                  >
                    <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-[11px] font-medium text-background tabular-nums">
                      {index + 1}
                    </span>
                    {screen}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              Density: {formatLabel(product.ux.density)}
            </Badge>
            <Badge variant="outline">
              IA depth: {product.metrics.estimatedIaDepth} levels
            </Badge>
          </div>
        </TabsContent>

        <TabsContent value="screens" className="space-y-4">
          {product.screenshots && product.screenshots.length > 0 ? (
            <ProductVisualGalleries
              slug={product.slug}
              screenshots={product.screenshots}
              accent={product.accent}
              signedIn={signedIn}
              screenshotTotal={screenshotTotal}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Screens coming soon</CardTitle>
                <CardDescription>
                  No public visuals have been collected for this product yet.
                  Key screens are listed below as the IA map.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="grid gap-2 sm:grid-cols-2">
                  {product.ux.keyScreens.map((screen, index) => (
                    <li
                      key={screen}
                      className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm"
                    >
                      <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-[11px] font-medium text-background tabular-nums">
                        {index + 1}
                      </span>
                      {screen}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          {product.workflows.map((workflow) => (
            <Card key={workflow.name}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="size-4" />
                      {workflow.name}
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      {workflow.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {workflow.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      <Users className="size-3" />
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {workflow.steps.map((step, index) => (
                    <li
                      key={step}
                      className="flex items-start gap-3 rounded-lg border border-border/60 px-3 py-2.5 text-sm"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium tabular-nums">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature inventory</CardTitle>
              <CardDescription>
                {product.metrics.featureCount}+ capabilities across the product
                surface — highlighted set below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm"
                  >
                    <Sparkles className="size-3.5 shrink-0 text-muted-foreground" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {product.integrations.map((integration) => (
                <Badge key={integration} variant="secondary">
                  {integration}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capture" className="space-y-4">
          {product.captureInsights ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Live capture summary</CardTitle>
                  <CardDescription>
                    Observed during automated public-site capture
                    {product.captureInsights.capturedAt
                      ? ` · ${new Date(product.captureInsights.capturedAt).toLocaleString()}`
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {product.captureInsights.summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {product.captureInsights.screenshotCount} screenshots
                    </Badge>
                    <Badge variant="outline">
                      {product.captureInsights.pageCount} URLs
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {product.captureInsights.navLabels.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Navigation labels</CardTitle>
                    <CardDescription>
                      Primary nav / chrome labels seen on public pages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {product.captureInsights.navLabels.map((label) => (
                      <Badge key={label} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {product.captureInsights.ctas.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Calls to action</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {product.captureInsights.ctas.map((label) => (
                      <Badge key={label} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              ) : null}

              {product.captureInsights.patternCandidates.length > 0 ||
              product.captureInsights.techSignals.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {product.captureInsights.patternCandidates.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Detected UI patterns</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {product.captureInsights.patternCandidates.map((pattern) => (
                          <Badge key={pattern} variant="secondary">
                            {pattern}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}
                  {product.captureInsights.techSignals.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Tech signals</CardTitle>
                        <CardDescription>
                          Inferred from public scripts and page markers — not a
                          full stack audit.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {product.captureInsights.techSignals.map((tech) => (
                          <Badge key={tech} variant="outline">
                            {tech}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              ) : null}

              {product.captureInsights.pages.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Pages visited</CardTitle>
                    <CardDescription>
                      Public URLs sampled during capture, with heading outline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.captureInsights.pages.slice(0, 8).map((page) => (
                      <div
                        key={page.url}
                        className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3"
                      >
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
                        >
                          {page.title || page.url}
                          <ArrowUpRight className="size-3.5" />
                        </a>
                        {page.description ? (
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {page.description}
                          </p>
                        ) : null}
                        {page.headings.length > 0 ? (
                          <ul className="flex flex-wrap gap-1.5">
                            {page.headings.slice(0, 8).map((heading) => (
                              <li key={heading}>
                                <Badge variant="outline" className="font-normal">
                                  {heading}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No live capture yet</CardTitle>
                <CardDescription>
                  Run a capture pass for this product to collect screenshots plus
                  navigation, CTA, pattern, and tech signals from public pages.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stack" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technology stack</CardTitle>
              <CardDescription>
                Reported and commonly associated technologies powering the
                product.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {product.techStack.map((tech) => (
                <Badge key={tech} variant="outline" className="px-3 py-1 text-sm">
                  {tech}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {product.platforms.map((platform) => (
                <Badge key={platform} variant="secondary">
                  <MonitorSmartphone className="size-3" />
                  {formatLabel(platform)}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industries served</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {product.industries.map((industry) => (
                <Badge key={industry} variant="outline">
                  {industry}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Pages"
              value={product.metrics.pageCount}
              hint="Estimated distinct page types"
            />
            <MetricCard
              label="Screens"
              value={product.metrics.screenCount}
              hint="Including modal / overlay surfaces"
            />
            <MetricCard
              label="Features"
              value={product.metrics.featureCount}
              hint="Capability surface area"
            />
            <MetricCard
              label="IA depth"
              value={product.metrics.estimatedIaDepth}
              hint="Typical navigation depth"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-4" />
                User roles
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {product.metrics.userRoles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competitive set</CardTitle>
              <CardDescription>
                Adjacent products useful for comparative UX research.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {product.competitors.map((competitor) => (
                <Badge key={competitor} variant="outline">
                  {competitor}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-10" />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Part of the ProductBench research database · {product.slug}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
        >
          Explore more products
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 px-3.5 py-3 backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-3xl tabular-nums">
          {value.toLocaleString()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
