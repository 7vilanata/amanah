"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FolderKanban, LayoutDashboard, ListChecks, Users } from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarNavProps = {
  role: "OWNER" | "ADMIN" | "MEMBER";
};

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["OWNER", "ADMIN", "MEMBER"] as SidebarNavProps["role"][],
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    roles: ["OWNER", "ADMIN", "MEMBER"] as SidebarNavProps["role"][],
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: ListChecks,
    roles: ["OWNER", "ADMIN", "MEMBER"] as SidebarNavProps["role"][],
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    roles: ["OWNER", "ADMIN", "MEMBER"] as SidebarNavProps["role"][],
  },
  {
    href: "/team",
    label: "Tim",
    icon: Users,
    roles: ["OWNER", "ADMIN"] as SidebarNavProps["role"][],
  },
];

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems
        .filter((item) => item.roles.includes(role))
        .map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "border border-[color:color-mix(in_srgb,var(--accent)_28%,white)] !bg-white !text-[var(--accent-strong)] shadow-[0_14px_30px_-24px_rgba(217,115,68,0.3)] [&_svg]:!text-[var(--accent-strong)] [&_span]:!text-[var(--accent-strong)]"
                  : "text-[var(--muted-strong)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {active ? <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[var(--accent)]" /> : null}
            </Link>
          );
        })}
    </nav>
  );
}
