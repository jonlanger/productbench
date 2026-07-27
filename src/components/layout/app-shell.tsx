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
      <SidebarInset className="h-svh min-h-0 min-w-0 overflow-hidden">
        {isMemberPreview ? <MemberPreviewBanner /> : null}
        <SiteHeader />
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
