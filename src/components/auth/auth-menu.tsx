"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUserInitials } from "@/lib/avatar";
import { hasSupabasePublicConfig } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AuthMenuProps = {
  email: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  className?: string;
};

export function AuthMenu({
  email,
  avatarUrl,
  isAdmin,
  className,
}: AuthMenuProps) {
  const authReady = hasSupabasePublicConfig();

  if (!authReady) {
    return null;
  }

  if (!email) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn("shrink-0", className)}
        render={<Link href="/sign-in" />}
      >
        <LogIn className="size-3.5" />
        Sign in
      </Button>
    );
  }

  const initials = getUserInitials(email);

  return (
    <Link
      href="/account"
      className={cn(
        "group shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label={isAdmin ? "Admin account" : "Your account"}
    >
      <Avatar
        size="default"
        className="transition-opacity group-hover:opacity-90"
      >
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt="" />
        ) : null}
        <AvatarFallback className="bg-foreground text-background text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
