"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, formatLabel } from "@/lib/filters";

export function ContributeForm() {
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState<string>("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-border/80 bg-muted/30 px-6 py-10">
        <CheckCircle2 className="size-8 text-foreground" />
        <h2 className="font-heading text-2xl tracking-tight">
          Submission received
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Thanks for contributing. In this prototype, submissions are stored
          locally in the session — a backend pipeline can wire these into the
          product database next.
        </p>
        <Button type="button" variant="outline" onClick={() => setSubmitted(false)}>
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Product name" htmlFor="name">
          <Input id="name" name="name" required placeholder="e.g. Notion" />
        </Field>
        <Field label="Company" htmlFor="company">
          <Input
            id="company"
            name="company"
            required
            placeholder="e.g. Notion Labs"
          />
        </Field>
        <Field label="Website" htmlFor="website">
          <Input
            id="website"
            name="website"
            type="url"
            required
            placeholder="https://"
          />
        </Field>
        <Field label="Category" htmlFor="category">
          <Select
            value={category}
            onValueChange={(value) => setCategory(value ?? "")}
          >
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {formatLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Tagline" htmlFor="tagline">
        <Input
          id="tagline"
          name="tagline"
          required
          placeholder="One-line product summary"
        />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="What the product does and who it's for"
        />
      </Field>

      <Field label="Notable UX patterns" htmlFor="ux">
        <Textarea
          id="ux"
          name="ux"
          rows={3}
          placeholder="Command palette, record pages, infinite canvas…"
        />
      </Field>

      <Field label="Key workflows" htmlFor="workflows">
        <Textarea
          id="workflows"
          name="workflows"
          rows={3}
          placeholder="Lead-to-opportunity, deploy preview, chart review…"
        />
      </Field>

      <Field label="Tech stack" htmlFor="stack">
        <Input
          id="stack"
          name="stack"
          placeholder="React, TypeScript, PostgreSQL…"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Estimated page count" htmlFor="pages">
          <Input id="pages" name="pages" type="number" min={1} placeholder="48" />
        </Field>
        <Field label="Your name" htmlFor="contributor">
          <Input id="contributor" name="contributor" required placeholder="Alex" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg">
          <Send className="size-4" />
          Submit product
        </Button>
        <Badge variant="outline" className="font-normal">
          Prototype form — no account required
        </Badge>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
