"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isAuthEnabled } from "@/lib/auth-config";

export function SignOutButton() {
  if (!isAuthEnabled()) return null;
  return <ClerkSignOutButton />;
}

function ClerkSignOutButton() {
  const { signOut } = useClerk();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={handleSignOut}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : "Sign out"}
    </Button>
  );
}
