import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";

import { AuthMenu } from "@/components/auth/auth-menu";
import { CatalogProvider } from "@/components/catalog/catalog-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getVisibleProducts } from "@/data/queries";
import { getViewer } from "@/lib/auth";
import { getUserAvatarUrl } from "@/lib/avatar";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ProductBench",
    template: "%s · ProductBench",
  },
  description:
    "Research database of enterprise, consumer, and industrial software — UX patterns, workflows, tech stacks, and product architecture.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ user, isAdmin }, products] = await Promise.all([
    getViewer(),
    getVisibleProducts(),
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[radial-gradient(ellipse_at_top,_oklch(0.97_0.01_240),_transparent_55%),linear-gradient(to_bottom,_var(--background),_oklch(0.985_0.005_240))]">
        <TooltipProvider>
          <CatalogProvider products={products}>
            <SiteHeader
              account={
                <AuthMenu
                  email={user?.email ?? null}
                  avatarUrl={getUserAvatarUrl(user)}
                  isAdmin={isAdmin}
                />
              }
            />
            <main className="flex flex-1 flex-col">{children}</main>
          </CatalogProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
