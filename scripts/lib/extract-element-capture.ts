/**
 * Extract structured per-element capture data via Playwright locator.evaluate.
 * Used alongside locator screenshots so galleries get DOM/styles/tokens, not just PNGs.
 */

import { writeFileSync } from "fs";
import type { Locator, Page } from "playwright";

import type {
  AtomicDesignLevel,
  ElementCapture,
  ElementInteractionState,
} from "../../src/data/types";

export type ExtractElementOptions = {
  interactionState?: ElementInteractionState;
  taxonomyLayer?: ElementCapture["taxonomyLayer"];
  /** Write `{pathWithoutExt}.element.json` sidecar next to the PNG. */
  sidecarPathWithoutExt?: string;
};

const STYLE_PROPS = [
  "color",
  "backgroundColor",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "margin",
  "padding",
  "borderRadius",
  "boxShadow",
  "border",
  "borderColor",
  "display",
  "gap",
  "opacity",
  "position",
] as const;

function inferAtomicLevel(
  tagName: string,
  role: string | null,
  semanticHint: string | null,
  nestingDepth: number,
  childElementCount: number,
  box: { width: number; height: number },
): AtomicDesignLevel {
  const hint = (semanticHint || role || tagName).toLowerCase();
  const area = box.width * box.height;

  if (
    /^(html|body)$/.test(tagName) ||
    (hint === "main" && area > 400_000)
  ) {
    return "page";
  }
  if (
    /^(header|footer|nav|main|aside|section|form|dialog|alertdialog)$/.test(hint) ||
    /^(banner|navigation|contentinfo|complementary|main)$/.test(hint)
  ) {
    if (childElementCount > 8 || area > 180_000) return "organism";
    return nestingDepth <= 4 ? "organism" : "molecule";
  }
  if (
    /^(article|ul|ol|table|fieldset|menu|listbox|tablist|toolbar)$/.test(hint) ||
    childElementCount >= 4
  ) {
    return area > 120_000 ? "organism" : "molecule";
  }
  if (
    /^(button|a|input|select|textarea|img|svg|label|span|i|strong|em|code)$/.test(
      tagName,
    ) ||
    /^(button|link|textbox|checkbox|radio|switch|img|menuitem|tab)$/.test(hint)
  ) {
    return childElementCount <= 2 ? "atom" : "molecule";
  }
  if (nestingDepth <= 3 && childElementCount > 12) return "template";
  if (childElementCount === 0 || childElementCount <= 2) return "atom";
  if (childElementCount <= 8) return "molecule";
  return "organism";
}

function breakpointFor(width: number): "mobile" | "tablet" | "desktop" {
  if (width <= 500) return "mobile";
  if (width <= 900) return "tablet";
  return "desktop";
}

function flexOrGridOf(
  display: string,
): ElementCapture["layout"]["flexOrGrid"] {
  if (display === "flex" || display === "inline-flex") return display;
  if (display === "grid" || display === "inline-grid") return display;
  return "none";
}

/**
 * Pull DOM semantics, computed styles, CSS vars, text, layout, and interaction
 * hints for a live locator. Keep the page.evaluate callback free of nested
 * function declarations — tsx/esbuild can inject __name helpers that break serialization.
 */
export async function extractElementCapture(
  locator: Locator,
  options: ExtractElementOptions = {},
): Promise<ElementCapture | null> {
  try {
    if (!(await locator.isVisible().catch(() => false))) return null;

    const page = locator.page();
    const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
    const styleKeys = [...STYLE_PROPS];

    // Flat evaluate payload — no nested fn declarations inside the browser callback.
    const raw = await locator.evaluate(
      (el, args: { styleKeys: string[] }) => {
        const htmlEl = el as HTMLElement;
        const tagName = htmlEl.tagName.toLowerCase();
        const roleAttr = htmlEl.getAttribute("role");
        const implicitRoles: Record<string, string> = {
          button: "button",
          a: "link",
          nav: "navigation",
          header: "banner",
          footer: "contentinfo",
          main: "main",
          aside: "complementary",
          form: "form",
          dialog: "dialog",
          img: "img",
          input: "textbox",
          select: "listbox",
          textarea: "textbox",
          ul: "list",
          ol: "list",
          li: "listitem",
          table: "table",
          h1: "heading",
          h2: "heading",
          h3: "heading",
          h4: "heading",
          h5: "heading",
          h6: "heading",
        };
        const role = roleAttr || implicitRoles[tagName] || null;
        const semanticHint = role || tagName;

        let nestingDepth = 0;
        let node: HTMLElement | null = htmlEl;
        while (node && node !== document.documentElement) {
          nestingDepth += 1;
          node = node.parentElement;
        }

        const rect = htmlEl.getBoundingClientRect();
        const cs = window.getComputedStyle(htmlEl);
        const styles: Record<string, string> = {};
        for (const key of args.styleKeys) {
          const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          const val = cs.getPropertyValue(cssKey) || (cs as unknown as Record<string, string>)[key] || "";
          if (val && val !== "none" && val !== "normal" && val !== "auto") {
            styles[key] = val.trim();
          }
        }
        // Prefer camelCase lookups for reliability across browsers
        styles.color = cs.color;
        styles.backgroundColor = cs.backgroundColor;
        styles.fontFamily = cs.fontFamily;
        styles.fontSize = cs.fontSize;
        styles.fontWeight = cs.fontWeight;
        styles.lineHeight = cs.lineHeight;
        styles.letterSpacing = cs.letterSpacing;
        styles.textAlign = cs.textAlign;
        styles.margin = cs.margin;
        styles.padding = cs.padding;
        styles.borderRadius = cs.borderRadius;
        styles.boxShadow = cs.boxShadow;
        styles.border = cs.border;
        styles.borderColor = cs.borderColor;
        styles.display = cs.display;
        styles.gap = cs.gap;
        styles.opacity = cs.opacity;
        styles.position = cs.position;

        const cssVariables: Record<string, string> = {};
        const varTargets: Array<Element | null> = [
          document.documentElement,
          document.body,
          htmlEl,
        ];
        let ancestor: HTMLElement | null = htmlEl.parentElement;
        let hops = 0;
        while (ancestor && hops < 6) {
          varTargets.push(ancestor);
          ancestor = ancestor.parentElement;
          hops += 1;
        }
        for (const target of varTargets) {
          if (!target) continue;
          const decl = window.getComputedStyle(target);
          for (let i = 0; i < decl.length; i++) {
            const name = decl[i];
            if (!name || !name.startsWith("--")) continue;
            const value = decl.getPropertyValue(name).trim();
            if (!value || cssVariables[name]) continue;
            cssVariables[name] = value;
          }
          const styleAttr =
            (target as HTMLElement).getAttribute?.("style") || "";
          const re = /(--[\w-]+)\s*:/g;
          let match: RegExpExecArray | null = re.exec(styleAttr);
          while (match) {
            const name = match[1]!;
            if (!cssVariables[name]) {
              const value = decl.getPropertyValue(name).trim();
              if (value) cssVariables[name] = value;
            }
            match = re.exec(styleAttr);
          }
        }

        // Prefer token-like vars (color, space, radius, font, shadow)
        const preferred: Record<string, string> = {};
        const rest: Record<string, string> = {};
        for (const [name, value] of Object.entries(cssVariables)) {
          if (
            /color|bg|background|space|spacing|gap|pad|margin|radius|font|shadow|border|size|token/i.test(
              name,
            )
          ) {
            preferred[name] = value;
          } else {
            rest[name] = value;
          }
        }
        const orderedVars = {
          ...preferred,
          ...Object.fromEntries(Object.entries(rest).slice(0, 40)),
        };

        const attrNames = [
          "id",
          "class",
          "role",
          "name",
          "type",
          "href",
          "aria-label",
          "aria-labelledby",
          "aria-describedby",
          "aria-expanded",
          "aria-pressed",
          "aria-checked",
          "aria-disabled",
          "aria-haspopup",
          "aria-controls",
          "data-testid",
          "data-state",
          "placeholder",
          "disabled",
          "tabindex",
        ];
        const attributes: Record<string, string> = {};
        for (const name of attrNames) {
          const val = htmlEl.getAttribute(name);
          if (val != null && val !== "") attributes[name] = val.slice(0, 200);
        }

        let accessibleName =
          htmlEl.getAttribute("aria-label") ||
          (htmlEl as HTMLInputElement).labels?.[0]?.textContent ||
          htmlEl.getAttribute("title") ||
          "";
        if (!accessibleName && attributes["aria-labelledby"]) {
          const ids = attributes["aria-labelledby"].split(/\s+/);
          accessibleName = ids
            .map((id) => document.getElementById(id)?.textContent || "")
            .join(" ");
        }
        accessibleName = (accessibleName || htmlEl.innerText || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160);

        const visibleText = (htmlEl.innerText || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 240);
        const placeholder =
          htmlEl.getAttribute("placeholder") ||
          (htmlEl as HTMLInputElement).placeholder ||
          null;

        const nearbyLabels: string[] = [];
        const labelEl = (htmlEl as HTMLInputElement).labels?.[0];
        if (labelEl?.textContent) {
          nearbyLabels.push(labelEl.textContent.replace(/\s+/g, " ").trim());
        }
        const prev = htmlEl.previousElementSibling;
        if (prev && /LABEL|SPAN|P|H[1-6]/.test(prev.tagName)) {
          const t = (prev.textContent || "").replace(/\s+/g, " ").trim();
          if (t && t.length < 80) nearbyLabels.push(t);
        }
        const parentLabel = htmlEl.closest("label");
        if (parentLabel && parentLabel !== htmlEl) {
          const t = (parentLabel.textContent || "").replace(/\s+/g, " ").trim();
          if (t && t.length < 80) nearbyLabels.push(t);
        }

        const events: string[] = [];
        if (typeof htmlEl.onclick === "function" || htmlEl.hasAttribute("onclick")) {
          events.push("click");
        }
        if (
          typeof (htmlEl as HTMLInputElement).onchange === "function" ||
          htmlEl.hasAttribute("onchange")
        ) {
          events.push("change");
        }
        if (
          typeof htmlEl.onmouseenter === "function" ||
          htmlEl.hasAttribute("onmouseenter") ||
          htmlEl.hasAttribute("onmouseover")
        ) {
          events.push("hover");
        }
        if (
          typeof htmlEl.onfocus === "function" ||
          htmlEl.hasAttribute("onfocus")
        ) {
          events.push("focus");
        }
        // Heuristic interactivity from semantics
        if (
          /^(button|a|input|select|textarea|summary)$/.test(tagName) ||
          /^(button|link|textbox|checkbox|radio|switch|menuitem|tab|option)$/.test(
            role || "",
          ) ||
          htmlEl.hasAttribute("tabindex") ||
          htmlEl.getAttribute("role") === "button"
        ) {
          if (!events.includes("click") && tagName !== "input") events.push("click");
          if (
            /^(input|select|textarea)$/.test(tagName) &&
            !events.includes("change")
          ) {
            events.push("change");
          }
          if (!events.includes("hover")) events.push("hover");
          if (!events.includes("focus")) events.push("focus");
        }

        const disabled =
          htmlEl.hasAttribute("disabled") ||
          htmlEl.getAttribute("aria-disabled") === "true" ||
          (htmlEl as HTMLInputElement).disabled === true;

        const expandedAttr = htmlEl.getAttribute("aria-expanded");
        const pressedAttr = htmlEl.getAttribute("aria-pressed");
        const checkedAttr = htmlEl.getAttribute("aria-checked");

        const parent = htmlEl.parentElement;
        const parentDisplay = parent
          ? window.getComputedStyle(parent).display
          : null;

        const classList = [...htmlEl.classList].slice(0, 24);

        return {
          tagName,
          role,
          semanticHint,
          nestingDepth,
          childElementCount: htmlEl.childElementCount,
          accessibleName: accessibleName || null,
          id: htmlEl.id || null,
          classList,
          attributes,
          styles,
          cssVariables: orderedVars,
          visibleText,
          placeholder,
          ariaLabel: htmlEl.getAttribute("aria-label"),
          nearbyLabels: [...new Set(nearbyLabels)].slice(0, 6),
          linkHref:
            tagName === "a"
              ? htmlEl.getAttribute("href")
              : htmlEl.closest("a")?.getAttribute("href") || null,
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          display: cs.display,
          position: cs.position,
          parentDisplay,
          events,
          disabled,
          focused: document.activeElement === htmlEl,
          expanded:
            expandedAttr == null ? null : expandedAttr === "true",
          pressed: pressedAttr == null ? null : pressedAttr === "true",
          checked:
            checkedAttr == null
              ? (htmlEl as HTMLInputElement).checked ?? null
              : checkedAttr === "true",
        };
      },
      { styleKeys },
    );

    const atomicLevel = inferAtomicLevel(
      raw.tagName,
      raw.role,
      raw.semanticHint,
      raw.nestingDepth,
      raw.childElementCount,
      raw.boundingBox,
    );

    const element: ElementCapture = {
      capturedAt: new Date().toISOString(),
      taxonomyLayer: options.taxonomyLayer ?? "structure",
      interactionState: options.interactionState ?? "default",
      dom: {
        tagName: raw.tagName,
        role: raw.role,
        semanticHint: raw.semanticHint,
        nestingDepth: raw.nestingDepth,
        atomicLevel,
        accessibleName: raw.accessibleName,
        id: raw.id,
        classList: raw.classList,
        attributes: raw.attributes,
      },
      styles: {
        color: raw.styles.color,
        backgroundColor: raw.styles.backgroundColor,
        fontFamily: raw.styles.fontFamily,
        fontSize: raw.styles.fontSize,
        fontWeight: raw.styles.fontWeight,
        lineHeight: raw.styles.lineHeight,
        letterSpacing: raw.styles.letterSpacing,
        textAlign: raw.styles.textAlign,
        margin: raw.styles.margin,
        padding: raw.styles.padding,
        borderRadius: raw.styles.borderRadius,
        boxShadow:
          raw.styles.boxShadow && raw.styles.boxShadow !== "none"
            ? raw.styles.boxShadow
            : undefined,
        border: raw.styles.border,
        borderColor: raw.styles.borderColor,
        display: raw.styles.display,
        gap: raw.styles.gap,
        opacity: raw.styles.opacity,
      },
      cssVariables: raw.cssVariables,
      text: {
        visibleText: raw.visibleText || undefined,
        placeholder: raw.placeholder,
        ariaLabel: raw.ariaLabel,
        nearbyLabels: raw.nearbyLabels,
        linkHref: raw.linkHref,
      },
      layout: {
        boundingBox: raw.boundingBox,
        display: raw.display,
        position: raw.position,
        flexOrGrid: flexOrGridOf(raw.display || "block"),
        parentDisplay: raw.parentDisplay,
        breakpoint: breakpointFor(viewport.width),
        viewport: { width: viewport.width, height: viewport.height },
      },
      interaction: {
        events: raw.events,
        disabled: raw.disabled,
        focused: raw.focused,
        expanded: raw.expanded,
        pressed: raw.pressed,
        checked: raw.checked,
      },
    };

    if (options.sidecarPathWithoutExt) {
      try {
        writeFileSync(
          `${options.sidecarPathWithoutExt}.element.json`,
          JSON.stringify(element, null, 2),
        );
      } catch {
        /* non-fatal */
      }
    }

    return element;
  } catch {
    return null;
  }
}

/** Extract shell structure for a full viewport shot (main / body landmark). */
export async function extractPageShellCapture(
  page: Page,
  options: ExtractElementOptions = {},
): Promise<ElementCapture | null> {
  const main = page.locator('main, [role="main"], body').first();
  if (!(await main.count().catch(() => 0))) return null;
  return extractElementCapture(main, {
    ...options,
    taxonomyLayer: options.taxonomyLayer ?? "structure",
  });
}
