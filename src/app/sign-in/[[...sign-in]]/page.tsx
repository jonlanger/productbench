import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

import { Separator } from "@/components/ui/separator";
import { getViewer } from "@/lib/auth";
import { isAuthEnabled } from "@/lib/auth-config";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to ProductBench to manage your account.",
};

type SignInPageProps = {
  searchParams: Promise<{ next?: string; redirect_url?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const { user } = await getViewer();
  const next = params.next || params.redirect_url || "/account";

  if (user) {
    redirect(next.startsWith("/") ? next : "/account");
  }

  if (!isAuthEnabled()) {
    return (
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-3">
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Account
          </p>
          <h1 className="font-heading text-4xl tracking-tight">
            Sign-in unavailable
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Clerk is not configured for this deployment. Add the Clerk
            environment variables, then restart the app.
          </p>
        </div>
        <Separator className="my-8" />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    );
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

      <div className="flex justify-center">
        <SignIn
          fallbackRedirectUrl={next.startsWith("/") ? next : "/account"}
          signUpUrl="/sign-up"
        />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
