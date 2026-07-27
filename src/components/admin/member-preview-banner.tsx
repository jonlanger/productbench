"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  disableMemberPreview,
  enableMemberPreview,
} from "@/app/actions/member-preview";
import { Button } from "@/components/ui/button";

export function MemberPreviewBanner() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function exitPreview() {
    startTransition(async () => {
      await disableMemberPreview();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-950 dark:text-amber-50">
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="size-4 shrink-0" aria-hidden />
        <p>
          <span className="font-medium">Member preview</span>
          <span className="text-amber-950/80 dark:text-amber-50/80">
            {" "}
            — you&apos;re seeing the catalog and navigation as a non-admin user.
          </span>
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 border-amber-500/30 bg-background/80"
        disabled={pending}
        onClick={exitPreview}
      >
        <EyeOff className="size-3.5" />
        Exit preview
      </Button>
    </div>
  );
}
