import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SubmissionReviewCard } from "@/components/admin/submission-review-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPendingSubmissions } from "@/data/submissions";
import { getViewer } from "@/lib/auth";
import { isAuthEnabled } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Review submissions",
  description: "Approve or reject user-submitted product details.",
};

export default async function AdminSubmissionsPage() {
  if (!isAuthEnabled()) {
    redirect("/");
  }

  const { user, isAdmin } = await getViewer();
  if (!user) {
    redirect("/sign-in?next=/admin/submissions");
  }
  if (!isAdmin) {
    redirect("/account");
  }

  const pending = await getPendingSubmissions();

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Admin
        </p>
        <h1 className="font-heading text-4xl tracking-tight">
          Review submissions
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Approve screenshot contributions to merge them into product galleries,
          or reject ones that should not be published.
        </p>
      </div>

      <Separator className="my-8" />

      {pending.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <p className="font-heading text-lg">No pending submissions</p>
          <p className="text-sm text-muted-foreground">
            When someone uses Add Details on a product page, their screenshots
            show up here.
          </p>
          <Button render={<Link href="/catalog" />} variant="outline">
            Browse catalog
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground tabular-nums">
            {pending.length} pending
          </p>
          {pending.map((submission) => (
            <SubmissionReviewCard
              key={submission.id}
              submission={submission}
            />
          ))}
        </div>
      )}
    </div>
  );
}
