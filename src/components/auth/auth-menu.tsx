"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { isAuthEnabled } from "@/lib/auth-config";
import { getUserInitials } from "@/lib/avatar";
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
  if (!email) {
    if (!isAuthEnabled()) return null;

    return (
      <Link
        href="/sign-in"
        className={cn(
          "group shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
        aria-label="Sign in"
      >
        <Avatar
          size="default"
          className="transition-opacity group-hover:opacity-90"
        >
          <AvatarFallback className="bg-foreground text-background">
            <LogIn className="size-3.5" aria-hidden />
          </AvatarFallback>
        </Avatar>
      </Link>
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
