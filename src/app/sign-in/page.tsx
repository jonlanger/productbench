import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Separator } from "@/components/ui/separator";
import { getViewer } from "@/lib/auth";

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

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Account
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Sign in</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Create an account or sign in. Admin accounts unlock the full catalog;
          everyone else sees the public set of products.
        </p>
      </div>

      <Separator className="my-8" />

      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
        }
      >
        <SignInForm />
      </Suspense>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
