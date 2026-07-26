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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#1a1430]/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
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
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#4ecdc4]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`h-[1.35rem] w-[1.35rem] transition-colors ${
                    active ? "text-[#a29bfe]" : "text-white/40"
                  }`}
                />
                <span className={active ? "text-[#a29bfe]" : "text-white/40"}>
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
                className="absolute inset-0 rounded-(--radius-btn) bg-gradient-to-r from-[#6c5ce7]/15 to-[#4ecdc4]/10 border border-white/[0.06]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              className={`relative h-[1.15rem] w-[1.15rem] shrink-0 transition-colors ${
                active ? "text-[#a29bfe]" : "text-white/40"
              }`}
            />
            <span
              className={`relative transition-colors ${
                active ? "font-semibold text-white/90" : "font-medium text-white/50 hover:text-white/70"
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
