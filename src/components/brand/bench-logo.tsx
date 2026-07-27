import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

export function BenchLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(className)}
      {...props}
    >
      <rect x="5" y="5.5" width="14" height="2.75" rx="0.75" />
      <rect x="3" y="11" width="18" height="2.75" rx="0.75" />
      <rect x="5.5" y="13.75" width="2.25" height="6.75" rx="0.5" />
      <rect x="16.25" y="13.75" width="2.25" height="6.75" rx="0.5" />
      <rect x="5.5" y="8.25" width="1.75" height="2.75" rx="0.375" />
      <rect x="16.75" y="8.25" width="1.75" height="2.75" rx="0.375" />
    </svg>
  );
}
