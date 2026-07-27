"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MemberPreviewBanner } from "@/components/admin/member-preview-banner";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type AppShellProps = {
  children: ReactNode;
  email: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isMemberPreview: boolean;
};

export function AppShell({
  children,
  email,
  avatarUrl,
  isAdmin,
  isMemberPreview,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar
        email={email}
        avatarUrl={avatarUrl}
        isAdmin={isAdmin}
      />
      <SidebarInset className="min-h-svh min-w-0">
        {isMemberPreview ? <MemberPreviewBanner /> : null}
        <SiteHeader />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
