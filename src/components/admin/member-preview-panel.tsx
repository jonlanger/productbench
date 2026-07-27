"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  disableMemberPreview,
  enableMemberPreview,
} from "@/app/actions/member-preview";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

type MemberPreviewPanelProps = {
  isMemberPreview: boolean;
  publicCount: number;
  totalCount: number;
};

export function MemberPreviewPanel({
  isMemberPreview,
  publicCount,
  totalCount,
}: MemberPreviewPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setPreview(enabled: boolean) {
    startTransition(async () => {
      if (enabled) {
        await enableMemberPreview();
      } else {
        await disableMemberPreview();
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-5">
      <div className="space-y-1.5">
        <h2 className="font-heading text-xl tracking-tight">Member preview</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          See the rest of ProductBench the way a non-admin user does — catalog
          scope, sidebar links, and product visibility. Admin tools stay on
          this page; exit preview anytime to restore full access.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {isMemberPreview ? "Previewing as member" : "Viewing as admin"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isMemberPreview
              ? `Showing the public catalog (${publicCount} of ${totalCount} products).`
              : `Full catalog visible (${totalCount} products).`}
          </p>
        </div>
        <Toggle
          pressed={isMemberPreview}
          disabled={pending}
          variant="outline"
          aria-label="Toggle member preview"
          onPressedChange={setPreview}
        >
          {isMemberPreview ? "On" : "Off"}
        </Toggle>
      </div>

      {isMemberPreview ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => setPreview(false)}
        >
          Exit member preview
        </Button>
      ) : (
        <Button
          type="button"
          disabled={pending}
          onClick={() => setPreview(true)}
        >
          Start member preview
        </Button>
      )}
    </section>
  );
}
