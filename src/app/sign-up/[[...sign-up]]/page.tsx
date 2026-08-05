import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

import { Separator } from "@/components/ui/separator";
import { getViewer } from "@/lib/auth";
import { isAuthEnabled } from "@/lib/auth-config";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a ProductBench account.",
};

type SignUpPageProps = {
  searchParams: Promise<{ next?: string; redirect_url?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const { user } = await getViewer();
  const next = params.next || params.redirect_url || "/account";

  if (user) {
    redirect(next.startsWith("/") ? next : "/account");
  }

  if (!isAuthEnabled()) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Account
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Create account</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Join ProductBench to unlock richer product galleries and contribute
          screenshots.
        </p>
      </div>

      <Separator className="my-8" />

      <div className="flex justify-center">
        <SignUp
          fallbackRedirectUrl={next.startsWith("/") ? next : "/account"}
          signInUrl="/sign-in"
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
