/**
 * Shared Playwright capture helpers — waiting, dismiss, viewports, scroll, hover, click sequences.
 * Locator clips also extract structured ElementCapture JSON (DOM / styles / tokens / layout).
 */

import { join } from "path";
import type { Locator, Page } from "playwright";

import type {
  ElementCapture,
  ElementInteractionState,
} from "../../src/data/types";
import { extractElementCapture } from "./extract-element-capture";

export const CAPTURE_DEVICE_SCALE = 3;

/** One captured file, optionally with per-element structured metadata. */
export type CaptureFileResult = {
  file: string;
  element?: ElementCapture;
};

export function captureFileName(
  result: string | CaptureFileResult,
): string {
  return typeof result === "string" ? result : result.file;
}

export function normalizeCaptureResults(
  result:
    | string
    | string[]
    | CaptureFileResult
    | CaptureFileResult[]
    | null
    | undefined,
): CaptureFileResult[] {
  if (result == null) return [];
  const list = Array.isArray(result) ? result : [result];
  return list.map((item) =>
    typeof item === "string" ? { file: item } : item,
  );
}

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

const COOKIE_BANNER_SELECTORS = [
  '#onetrust-accept-btn-handler',
  '#onetrust-reject-all-handler',
  '[id*="cookie" i] button',
  '[class*="cookie" i] button',
  '[class*="CookieBanner" i] button',
  '[class*="consent" i] button',
  '[aria-label*="cookie" i] button',
  '[data-testid*="cookie" i] button',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#CybotCookiebotDialogBodyButtonAccept',
  '.cc-btn.cc-dismiss',
  '.cc-allow',
  '#accept-cookies',
  'button[aria-label="Close"]',
];

const DISMISS_LABELS = [
  "Got it",
  "Accept",
  "Accept all",
  "Accept All",
  "Accept cookies",
  "Allow all",
  "Allow All",
  "Allow cookies",
  "I agree",
  "Agree",
  "Agree and continue",
  "OK",
  "Okay",
  "Close",
  "Dismiss",
  "No thanks",
  "Not now",
  "Continue",
  "Continue without accepting",
  "Reject all",
  "Reject All",
  "Only necessary",
  "Necessary only",
];

export type ScreenshotOptions = {
  /** Capture the full scrollable document (avoid on very long pages). */
  fullPage?: boolean;
  /** Clip to a CSS selector / locator instead of the viewport. */
  clip?: Locator;
  /** Extract structured ElementCapture for locator clips (default true when clip set). */
  extractElement?: boolean;
  interactionState?: ElementInteractionState;
  taxonomyLayer?: ElementCapture["taxonomyLayer"];
  /** Skip writing `{path}.element.json` sidecar (still returns element on the result). */
  skipSidecar?: boolean;
};

export async function dismissNoise(page: Page) {
  // Role/label buttons first (cookie + marketing modals)
  for (const label of DISMISS_LABELS) {
    const btn = page.getByRole("button", { name: label, exact: false });
    const count = await btn.count().catch(() => 0);
    if (!count) continue;
    const target = btn.first();
    if (!(await target.isVisible().catch(() => false))) continue;
    await target.click({ timeout: 1200 }).catch(() => undefined);
    await page.waitForTimeout(200);
  }

  for (const selector of COOKIE_BANNER_SELECTORS) {
    const loc = page.locator(selector).first();
    if (!(await loc.isVisible().catch(() => false))) continue;
    const text = ((await loc.innerText().catch(() => "")) || "").toLowerCase();
    // Prefer accept/allow/agree; skip "manage preferences" style
    if (/manage|settings|preferences|customize|customise/.test(text)) continue;
    await loc.click({ timeout: 1200 }).catch(() => undefined);
    await page.waitForTimeout(200);
  }

  // Close icon buttons in dialogs
  const dialogClose = page.locator(
    '[role="dialog"] button[aria-label*="close" i], [role="dialog"] button[aria-label*="dismiss" i]',
  );
  if (await dialogClose.first().isVisible().catch(() => false)) {
    await dialogClose.first().click({ timeout: 1000 }).catch(() => undefined);
  }

  await page.keyboard.press("Escape").catch(() => undefined);
}

/**
 * Navigate and wait until the page is settled enough for a clean screenshot.
 */
export async function gotoReady(
  page: Page,
  url: string,
  options: {
    settleMs?: number;
    networkIdleTimeoutMs?: number;
    readySelector?: string;
    onBlocked?: () => Promise<boolean> | boolean;
  } = {},
) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

  await page
    .waitForLoadState("networkidle", {
      timeout: options.networkIdleTimeoutMs ?? 12000,
    })
    .catch(() => undefined);

  await dismissNoise(page);

  const readySelector =
    options.readySelector ??
    'main, [role="main"], #__next, #root, [data-testid="page"], body';
  await page
    .locator(readySelector)
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .catch(() => undefined);

  // Images / fonts often paint after networkidle
  await page.waitForTimeout(options.settleMs ?? 900);
  await dismissNoise(page);

  if (options.onBlocked && (await options.onBlocked())) {
    throw new Error(`blocked:${url}`);
  }
}

export async function setViewport(page: Page, name: ViewportName) {
  await page.setViewportSize(VIEWPORTS[name]);
}

export async function saveScreenshot(
  page: Page,
  pathWithoutExt: string,
  options: ScreenshotOptions = {},
): Promise<CaptureFileResult> {
  const pngPath = `${pathWithoutExt}.png`;
  if (options.clip) {
    await options.clip.screenshot({
      path: pngPath,
      type: "png",
      animations: "disabled",
      caret: "hide",
      scale: "device",
    });
  } else {
    await page.screenshot({
      path: pngPath,
      fullPage: options.fullPage ?? false,
      type: "png",
      animations: "disabled",
      caret: "hide",
      scale: "device",
    });
  }

  const file = pngPath.split("/").pop()!;
  const shouldExtract =
    Boolean(options.clip) && options.extractElement !== false;

  let element: ElementCapture | undefined;
  if (shouldExtract && options.clip) {
    const extracted = await extractElementCapture(options.clip, {
      interactionState: options.interactionState ?? "default",
      taxonomyLayer: options.taxonomyLayer ?? "component",
      sidecarPathWithoutExt: options.skipSidecar
        ? undefined
        : pathWithoutExt,
    });
    if (extracted) element = extracted;
  }

  return element ? { file, element } : { file };
}

export async function saveLocatorScreenshot(
  locator: Locator,
  pathWithoutExt: string,
  options: Omit<ScreenshotOptions, "clip" | "fullPage"> = {},
): Promise<CaptureFileResult> {
  return saveScreenshot(locator.page(), pathWithoutExt, {
    ...options,
    clip: locator,
  });
}

/** Scroll in viewport-sized bands and capture each — preferred over fullPage on long pages. */
export async function captureScrollBands(
  page: Page,
  dir: string,
  prefix: string,
  maxBands = 6,
): Promise<CaptureFileResult[]> {
  const files: CaptureFileResult[] = [];
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const viewport = page.viewportSize()?.height ?? VIEWPORTS.desktop.height;
  const step = Math.max(Math.floor(viewport * 0.72), 360);
  const positions = [0];

  for (let y = step; y < height - viewport * 0.35; y += step) {
    positions.push(y);
    if (positions.length >= maxBands - 1) break;
  }

  if (height > viewport * 1.4) {
    positions.push(Math.max(0, height - viewport));
  }

  const unique = positions.filter((y, index, all) => {
    if (index === 0) return true;
    return Math.abs(y - all[index - 1]!) > viewport * 0.28;
  });

  for (const [index, y] of unique.entries()) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page
      .waitForLoadState("networkidle", { timeout: 3000 })
      .catch(() => undefined);
    await page.waitForTimeout(350);
    const suffix =
      index === 0
        ? "top"
        : index === unique.length - 1 && unique.length > 1
          ? "lower"
          : `band-${index + 1}`;
    const id =
      suffix === "top"
        ? `${prefix}-top`
        : suffix === "lower"
          ? `${prefix}-lower`
          : `${prefix}-${suffix}`;
    files.push(await saveScreenshot(page, join(dir, id)));
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return files;
}

export async function clickFirst(
  page: Page,
  candidates: Array<() => Locator>,
  timeout = 2000,
) {
  for (const make of candidates) {
    const loc = make();
    if ((await loc.count()) === 0) continue;
    const target = loc.first();
    if (!(await target.isVisible().catch(() => false))) continue;
    await target.click({ timeout }).catch(() => undefined);
    return true;
  }
  return false;
}

/** Hover primary nav / menu triggers and capture revealed dropdowns or tooltips. */
export async function captureHoverStates(
  page: Page,
  dir: string,
  max = 4,
): Promise<CaptureFileResult[]> {
  const files: CaptureFileResult[] = [];
  const triggers = page.locator(
    [
      "header nav >> role=button",
      "header nav >> role=link",
      'header [aria-haspopup="true"]',
      'header [aria-expanded]',
      'nav [data-radix-collection-item]',
      '[role="menubar"] >> role=menuitem',
      '[class*="Nav" i] button',
    ].join(", "),
  );

  const count = Math.min(await triggers.count().catch(() => 0), max * 3);
  for (let i = 0; i < count && files.length < max; i++) {
    const trigger = triggers.nth(i);
    if (!(await trigger.isVisible().catch(() => false))) continue;
    const box = await trigger.boundingBox();
    if (!box || box.width < 24 || box.height < 16) continue;

    await trigger.hover({ timeout: 1500 }).catch(() => undefined);
    await page.waitForTimeout(450);

    const menu = page.locator(
      '[role="menu"], [role="listbox"], [data-radix-popper-content-wrapper], [class*="Dropdown" i], [class*="Popover" i], [role="tooltip"]',
    );
    const menuVisible =
      (await menu.count()) > 0 &&
      (await menu.first().isVisible().catch(() => false));

    if (menuVisible) {
      const clip = menu.first();
      const mbox = await clip.boundingBox();
      if (mbox && mbox.width > 40 && mbox.height > 24) {
        files.push(
          await saveScreenshot(page, join(dir, `hover-menu-${files.length + 1}`), {
            clip,
            interactionState: "hover",
            taxonomyLayer: "component",
          }),
        );
      } else {
        files.push(
          await saveScreenshot(page, join(dir, `hover-${files.length + 1}`)),
        );
      }
    } else {
      // Still capture focused hover chrome on the header
      const header = page.locator("header, [role='banner']").first();
      if (await header.isVisible().catch(() => false)) {
        files.push(
          await saveScreenshot(page, join(dir, `hover-nav-${files.length + 1}`), {
            clip: header,
            interactionState: "hover",
            taxonomyLayer: "component",
          }),
        );
      }
    }

    await page.mouse.move(0, 0).catch(() => undefined);
    await page.waitForTimeout(150);
  }

  return files;
}

/**
 * Capture default + hover (+ active/disabled when available) for interactive controls.
 * Links state variant filenames via element.interaction.stateShots.
 */
export async function captureInteractiveStates(
  page: Page,
  dir: string,
  max = 3,
): Promise<CaptureFileResult[]> {
  const files: CaptureFileResult[] = [];
  const controls = page.locator(
    [
      "header a[href]",
      "header button",
      'main a[href]',
      'main button',
      '[role="button"]',
      "a.button, button[type='submit']",
    ].join(", "),
  );

  const count = Math.min(await controls.count().catch(() => 0), max * 4);
  const seen = new Set<string>();

  for (let i = 0; i < count && files.length / 2 < max; i++) {
    const control = controls.nth(i);
    if (!(await control.isVisible().catch(() => false))) continue;
    const box = await control.boundingBox();
    if (!box || box.width < 32 || box.height < 18) continue;
    if (box.width > 480) continue;
    const key = `${Math.round(box.width)}x${Math.round(box.height)}@${Math.round(box.x)}:${Math.round(box.y)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const idx = Math.floor(files.length / 2) + 1;
    const defaultPath = join(dir, `state-${idx}-default`);
    const hoverPath = join(dir, `state-${idx}-hover`);

    const defaultShot = await saveLocatorScreenshot(control, defaultPath, {
      interactionState: "default",
      taxonomyLayer: "state",
    });

    await control.hover({ timeout: 1200 }).catch(() => undefined);
    await page.waitForTimeout(280);
    const hoverShot = await saveLocatorScreenshot(control, hoverPath, {
      interactionState: "hover",
      taxonomyLayer: "state",
    });

    const stateShots: NonNullable<ElementCapture["interaction"]["stateShots"]> =
      {
        default: defaultShot.file,
        hover: hoverShot.file,
      };

    // Optional active (mousedown) — brief, non-destructive
    const activePath = join(dir, `state-${idx}-active`);
    let activeShot: CaptureFileResult | undefined;
    try {
      await control.hover({ timeout: 800 });
      await page.mouse.down();
      await page.waitForTimeout(120);
      activeShot = await saveLocatorScreenshot(control, activePath, {
        interactionState: "active",
        taxonomyLayer: "state",
      });
      stateShots.active = activeShot.file;
      await page.mouse.up().catch(() => undefined);
    } catch {
      await page.mouse.up().catch(() => undefined);
    }

    // Disabled variant only if the control is already disabled
    const isDisabled = await control.isDisabled().catch(() => false);
    let disabledShot: CaptureFileResult | undefined;
    if (isDisabled) {
      disabledShot = await saveLocatorScreenshot(
        control,
        join(dir, `state-${idx}-disabled`),
        { interactionState: "disabled", taxonomyLayer: "state" },
      );
      stateShots.disabled = disabledShot.file;
    }

    for (const shot of [defaultShot, hoverShot, activeShot, disabledShot]) {
      if (!shot) continue;
      if (shot.element) {
        shot.element.interaction.stateShots = { ...stateShots };
      }
      files.push(shot);
    }

    await page.mouse.move(0, 0).catch(() => undefined);
    await page.waitForTimeout(100);
  }

  return files;
}

/**
 * Click through primary nav links in sequence — multi-step surface captures.
 */
export async function captureClickSequence(
  page: Page,
  dir: string,
  origin: string,
  max = 6,
): Promise<CaptureFileResult[]> {
  const files: CaptureFileResult[] = [];
  const hrefs = await page.evaluate((siteOrigin) => {
    const links = [
      ...document.querySelectorAll("header a[href], nav a[href], [role='navigation'] a[href]"),
    ] as HTMLAnchorElement[];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const a of links) {
      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
      let abs: string;
      try {
        abs = new URL(href, siteOrigin).toString();
      } catch {
        continue;
      }
      if (!abs.startsWith(siteOrigin)) continue;
      const path = new URL(abs).pathname;
      if (path === "/" || path === "") continue;
      if (seen.has(path)) continue;
      seen.add(path);
      out.push(abs);
      if (out.length >= 12) break;
    }
    return out;
  }, origin);

  for (const [index, url] of hrefs.slice(0, max).entries()) {
    try {
      await gotoReady(page, url);
      files.push(
        await saveScreenshot(page, join(dir, `sequence-${index + 1}`)),
      );
    } catch {
      /* skip */
    }
  }
  return files;
}

/** Clip common chrome regions: header/nav, footer, dialog. */
export async function captureChromeClips(
  page: Page,
  dir: string,
): Promise<CaptureFileResult[]> {
  const files: CaptureFileResult[] = [];
  const regions: Array<{ name: string; selector: string; minH: number }> = [
    { name: "nav-clip", selector: "header, [role='banner'], nav", minH: 40 },
    {
      name: "footer-clip",
      selector: "footer, [role='contentinfo']",
      minH: 60,
    },
  ];

  for (const region of regions) {
    const loc = page.locator(region.selector).first();
    if (!(await loc.isVisible().catch(() => false))) continue;
    const box = await loc.boundingBox();
    if (!box || box.height < region.minH || box.width < 200) continue;
    // Avoid capturing the entire page mistaken as header
    if (box.height > (page.viewportSize()?.height ?? 900) * 0.55) continue;
    files.push(
      await saveScreenshot(page, join(dir, region.name), {
        clip: loc,
        taxonomyLayer: "component",
      }),
    );
  }

  const dialog = page.getByRole("dialog").first();
  if (await dialog.isVisible().catch(() => false)) {
    files.push(
      await saveScreenshot(page, join(dir, "dialog-clip"), {
        clip: dialog,
        taxonomyLayer: "component",
      }),
    );
  }

  return files;
}

export async function captureViewportVariants(
  page: Page,
  dir: string,
  url: string,
  goto: typeof gotoReady,
): Promise<CaptureFileResult[]> {
  const files: CaptureFileResult[] = [];
  const order: ViewportName[] = ["desktop", "tablet", "mobile"];

  for (const name of order) {
    await setViewport(page, name);
    await goto(page, url);
    files.push(await saveScreenshot(page, join(dir, `viewport-${name}`)));
  }

  await setViewport(page, "desktop");
  return files;
}
