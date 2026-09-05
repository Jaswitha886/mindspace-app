"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_ICONS, type IconKey } from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
  exact?: boolean;
};

export type NavProps = { items: NavItem[] };

function useActive() {
  const pathname = usePathname();
  return (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function BottomNav({ items }: NavProps) {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = NAV_ICONS[item.icon];
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-1 px-1 py-2.5 text-[0.6875rem] font-semibold transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="bottomnav-indicator"
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`h-[1.35rem] w-[1.35rem] transition-colors ${
                    active ? "text-brand" : "text-ink-muted"
                  }`}
                />
                <span className={active ? "text-brand" : "text-ink-muted"}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav({ items }: NavProps) {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(item);
        const Icon = NAV_ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="relative flex items-center gap-3 rounded-(--radius-btn) px-3 py-2.5 text-sm transition-colors duration-150"
          >
            {active && (
              <motion.span
                layoutId="sidenav-indicator"
                className="absolute inset-0 rounded-(--radius-btn) border border-white/10 bg-sidebar-active"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              className={`relative h-[1.15rem] w-[1.15rem] shrink-0 transition-colors ${
                    active ? "text-sidebar-text" : "text-sidebar-muted"
              }`}
            />
            <span
              className={`relative transition-colors ${
                active
                  ? "font-semibold text-sidebar-text"
                  : "font-medium text-sidebar-muted hover:text-sidebar-text"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
