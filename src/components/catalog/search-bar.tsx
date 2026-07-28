"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  Boxes,
  Building2,
  Layers,
  LoaderCircle,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import { useCatalog } from "@/components/catalog/catalog-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildSearchIndex,
  getSearchSuggestions,
  suggestionKindLabel,
  type SearchSuggestion,
  type SuggestionKind,
} from "@/lib/search-suggestions";
import { cn } from "@/lib/utils";

const SUGGESTION_LIMIT = 5;
const SUGGESTION_DEBOUNCE_MS = 200;
/** Keep keystrokes local; commit catalog filtering after typing settles. */
const QUERY_COMMIT_MS = 150;

const KIND_ICON: Record<SuggestionKind, typeof Search> = {
  product: Boxes,
  company: Building2,
  tag: Tag,
  feature: Sparkles,
  tech: Layers,
  industry: Building2,
  category: Layers,
  segment: Layers,
  platform: Layers,
  pricing: Tag,
  density: Layers,
  pattern: Sparkles,
  integration: Layers,
  competitor: Building2,
};

export function SearchBar({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isCatalog = pathname === "/catalog";
  const { products, filters, setFilters } = useCatalog();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const commitTimerRef = useRef<number | null>(null);
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const index = useMemo(() => buildSearchIndex(products), [products]);

  // Stay in sync when parent clears/resets query (filters, suggestions, etc.).
  // Skip while a local commit is pending so a slower parent update can't
  // clobber characters the user has already typed.
  useEffect(() => {
    if (commitTimerRef.current !== null) return;
    setDraft(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }
    };
  }, []);

  function commitQuery(next: string, immediate = false) {
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }

    if (immediate || next === value) {
      if (next !== value) onChange(next);
      return;
    }

    commitTimerRef.current = window.setTimeout(() => {
      commitTimerRef.current = null;
      onChange(next);
    }, QUERY_COMMIT_MS);
  }

  useEffect(() => {
    const query = draft.trim();
    if (!query) {
      setSuggestions([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    setActiveIndex(-1);
    const timer = window.setTimeout(() => {
      setSuggestions(getSearchSuggestions(index, query, SUGGESTION_LIMIT));
      setLoading(false);
    }, SUGGESTION_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, index]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function openCatalog() {
    if (!isCatalog) {
      router.push("/catalog");
    }
  }

  function applySuggestion(suggestion: SearchSuggestion) {
    setOpen(false);
    setActiveIndex(-1);

    if (suggestion.productSlug) {
      setDraft("");
      commitQuery("", true);
      router.push(`/products/${suggestion.productSlug}`);
      return;
    }

    if (suggestion.filterKey && suggestion.filterValue) {
      const key = suggestion.filterKey;
      const current = filters[key] as string[];
      const nextValues = current.includes(suggestion.filterValue)
        ? current
        : [...current, suggestion.filterValue];
      setDraft("");
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
      setFilters({
        ...filters,
        query: "",
        [key]: nextValues,
      });
      openCatalog();
      return;
    }

    const next = suggestion.query ?? suggestion.label;
    setDraft(next);
    commitQuery(next, true);
    openCatalog();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      if (draft.trim()) setOpen(true);
      return;
    }

    if (event.key === "Enter" && activeIndex < 0 && draft.trim()) {
      event.preventDefault();
      commitQuery(draft, true);
      setOpen(false);
      openCatalog();
      return;
    }

    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (loading || suggestions.length === 0) return;
      setActiveIndex((index) =>
        index < suggestions.length - 1 ? index + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (loading || suggestions.length === 0) return;
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      applySuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showMenu = open && draft.trim().length > 0;

  return (
    <div ref={rootRef} className={cn("relative w-full", !compact && "max-w-xl")}>
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          setOpen(true);
          commitQuery(next);
        }}
        onFocus={() => {
          if (draft.trim()) setOpen(true);
        }}
        onBlur={() => {
          // Flush pending text so catalog matches what the user typed.
          commitQuery(draft, true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={
          compact
            ? "Search products…"
            : "Search products, UX patterns, tech stacks, workflows…"
        }
        className={cn("w-full pr-10 pl-10", compact ? "h-9" : "h-11")}
        aria-label="Search products"
        aria-autocomplete="list"
        aria-controls={showMenu ? listboxId : undefined}
        aria-expanded={showMenu}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        role="combobox"
      />
      {draft ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1.5 z-10 -translate-y-1/2"
          onClick={() => {
            setDraft("");
            commitQuery("", true);
            setOpen(false);
            setSuggestions([]);
          }}
          aria-label="Clear search"
        >
          <X className="size-4" />
        </Button>
      ) : null}

      {showMenu ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-50 overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Finding suggestions…
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No suggestions for “{draft.trim()}”
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => {
                const Icon = KIND_ICON[suggestion.kind];
                const active = index === activeIndex;
                return (
                  <li key={suggestion.id} role="presentation">
                    <button
                      type="button"
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={active}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                        active ? "bg-muted" : "hover:bg-muted/70",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => {
                        // Keep input focus; apply before blur closes the menu.
                        event.preventDefault();
                        applySuggestion(suggestion);
                      }}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {suggestion.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {suggestionKindLabel(suggestion.kind)}
                          {suggestion.description &&
                          suggestion.description !==
                            suggestionKindLabel(suggestion.kind)
                            ? ` · ${suggestion.description}`
                            : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
