import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Separator } from "@/components/ui/separator";
import { getViewer } from "@/lib/auth";
import { isAuthEnabled } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to ProductBench to manage your account.",
};

type SignInPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { user } = await getViewer();
  const params = await searchParams;
  if (user) {
    redirect(params.next || "/account");
  }

  const authEnabled = isAuthEnabled();

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Account
        </p>
        <h1 className="font-heading text-4xl tracking-tight">
          {authEnabled ? "Sign in" : "Sign-in unavailable"}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {authEnabled
            ? "Create an account or sign in. Admin accounts unlock the full catalog; everyone else sees the public set of products."
            : "Account auth is not enabled on this deployment. You can still browse the public catalog without signing in."}
        </p>
      </div>

      <Separator className="my-8" />

      {authEnabled ? (
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
          }
        >
          <SignInForm />
        </Suspense>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-muted/30 px-6 py-8 text-sm text-muted-foreground">
          Sign-in is currently unavailable.
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
