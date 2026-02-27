"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavigationLink = {
  href: string;
  label: string;
};

export function DashboardNav({ links }: { links: readonly NavigationLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-charcoal">
      {links.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border-b-2 border-transparent pb-1 transition-colors",
              "hover:text-brand-red",
              isActive && "border-brand-red text-brand-red"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
