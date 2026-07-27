import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvatarUploader } from "@/components/auth/avatar-uploader";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCatalogStats } from "@/data/queries";
import { countSubmissionsByStatus } from "@/data/submissions";
import { getUserAvatarUrl } from "@/lib/avatar";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Account",
  description: "Your ProductBench account and catalog access.",
};

export default async function AccountPage() {
  const { user, isAdmin } = await getViewer();
  if (!user) {
    redirect("/sign-in?next=/account");
  }

  const stats = await getCatalogStats();
  const avatarUrl = getUserAvatarUrl(user);
  const pendingCount = isAdmin
    ? await countSubmissionsByStatus("pending")
    : 0;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Account
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-4xl tracking-tight">Your account</h1>
          {isAdmin ? (
            <Badge>Admin</Badge>
          ) : (
            <Badge variant="secondary">Member</Badge>
          )}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Signed in as{" "}
          <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </div>

      <Separator className="my-8" />

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-tight">Profile photo</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This avatar appears in the header when you are signed in.
        </p>
        <AvatarUploader
          userId={user.id}
          email={user.email ?? ""}
          avatarUrl={avatarUrl}
        />
      </section>

      <Separator className="my-8" />

      {isAdmin ? (
        <>
          <section className="space-y-4">
            <h2 className="font-heading text-xl tracking-tight">
              Admin review
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {pendingCount > 0
                ? `${pendingCount} screenshot submission${pendingCount === 1 ? "" : "s"} waiting for review.`
                : "No pending screenshot submissions right now."}
            </p>
            <Button render={<Link href="/admin/submissions" />} size="lg">
              Review submissions
              {pendingCount > 0 ? (
                <Badge className="ml-1">{pendingCount}</Badge>
              ) : null}
            </Button>
          </section>
          <Separator className="my-8" />
        </>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-heading text-xl tracking-tight">Catalog access</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isAdmin
            ? `You have admin access to the full catalog (${stats.totalCount} products).`
            : `You can browse the public catalog (${stats.publicCount} products). Admin accounts unlock entries marked private.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/catalog" />} size="lg">
            Open catalog
          </Button>
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
