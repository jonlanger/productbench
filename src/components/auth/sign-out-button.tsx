"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!hasSupabasePublicConfig()) return null;

  async function handleSignOut() {
    setPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
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
