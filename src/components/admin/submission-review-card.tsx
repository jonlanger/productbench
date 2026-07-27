"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, LoaderCircle, X } from "lucide-react";

import {
  approveSubmission,
  rejectSubmission,
} from "@/app/actions/submissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProductSubmissionRow } from "@/db/schema";

export function SubmissionReviewCard({
  submission,
}: {
  submission: ProductSubmissionRow;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function review(action: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const result =
        action === "approve"
          ? await approveSubmission(submission.id, note)
          : await rejectSubmission(submission.id, note);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const items =
    submission.payload.type === "screenshots"
      ? submission.payload.items
      : [];

  return (
    <article className="space-y-4 rounded-2xl border border-border/80 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl tracking-tight">
              {submission.productName}
            </h2>
            <Badge variant="secondary">Screenshots</Badge>
            <Badge variant="outline">{items.length} image{items.length === 1 ? "" : "s"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            From {submission.submitterEmail ?? "unknown"} ·{" "}
            {new Date(submission.createdAt).toLocaleString()}
          </p>
          <Link
            href={`/products/${submission.productSlug}`}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            View product
          </Link>
        </div>
      </div>

      {submission.payload.type === "screenshots" &&
      submission.payload.note ? (
        <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {submission.payload.note}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <figure
            key={item.storagePath}
            className="overflow-hidden rounded-xl border border-border/70"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.publicUrl}
              alt={item.title}
              className="aspect-[16/10] w-full object-cover object-top"
            />
            <figcaption className="space-y-1 border-t border-border/70 px-3 py-2">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-muted-foreground">
                {item.kind === "product" ? "Product surface" : "UI detail"}
                {item.caption ? ` · ${item.caption}` : ""}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`note-${submission.id}`}>
          Review note (optional)
        </label>
        <Textarea
          id={`note-${submission.id}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Why approve or reject…"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="status">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => review("approve")}
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Approve & add
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => review("reject")}
        >
          <X className="size-4" />
          Reject
        </Button>
      </div>
    </article>
  );
}
