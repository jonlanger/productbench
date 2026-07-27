"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Info,
  LogIn,
  LayoutGrid,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import { BenchLogo } from "@/components/brand/bench-logo";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getUserInitials } from "@/lib/avatar";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}> = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/catalog", label: "Catalog", icon: LayoutGrid },
  { href: "/process", label: "Process", icon: Workflow },
  { href: "/about", label: "About", icon: Info },
];

type AppSidebarProps = {
  email: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

function isNavActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ email, avatarUrl, isAdmin }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              tooltip="ProductBench"
            >
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BenchLogo className="size-4" />
              </span>
              <span className="font-heading text-lg tracking-tight">
                ProductBench
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isNavActive(pathname, item.href, item.exact)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/admin/submissions" />}
                    isActive={isNavActive(pathname, "/admin/submissions")}
                    tooltip="Admin"
                  >
                    <ShieldCheck />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {!email ? (
              <SidebarMenuButton
                size="lg"
                render={<Link href="/sign-in" />}
                tooltip="Sign in"
              >
                <Avatar className="size-8 rounded-lg after:rounded-lg">
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <LogIn className="size-4" aria-hidden />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Sign in</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    Or create an account
                  </span>
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                size="lg"
                render={<Link href="/account" />}
                tooltip={email}
              >
                <Avatar className="size-8 rounded-lg after:rounded-lg">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                    {getUserInitials(email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Account</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {email}
                  </span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
