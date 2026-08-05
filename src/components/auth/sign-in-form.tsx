"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isAuthEnabled } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const authError = searchParams.get("error");
  const initialMode =
    searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    authError === "auth"
      ? "Sign-in link expired or was invalid. Try again."
      : null,
  );
  const [pending, setPending] = useState(false);

  if (!isAuthEnabled()) {
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/30 px-6 py-8 text-sm text-muted-foreground">
        Sign-in is currently unavailable. Account auth is not enabled for this
        deployment.
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        router.refresh();
        router.push(next);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.refresh();
        router.push(next);
        return;
      }

      setMessage(
        "Check your email to confirm your account, then sign in.",
      );
      setMode("sign-in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg border border-border/80 bg-muted/20 p-1">
        <Button
          type="button"
          variant={mode === "sign-in" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => {
            setMode("sign-in");
            setMessage(null);
          }}
        >
          Sign in
        </Button>
        <Button
          type="button"
          variant={mode === "sign-up" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => {
            setMode("sign-up");
            setMessage(null);
          }}
        >
          Create account
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        {message ? (
          <p
            className="rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
            role="status"
          >
            {message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending} size="lg">
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : mode === "sign-in" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Guests can browse the public catalog without an account.{" "}
        <Link href="/catalog" className="text-foreground underline-offset-4 hover:underline">
          View catalog
        </Link>
      </p>
    </div>
  );
}
