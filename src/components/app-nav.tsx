"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

// Bottom tab bar for small screens: icon over a small label, active tab in
// plum. Hidden once a sidebar fits.
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
                className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[0.6875rem] font-semibold transition-colors ${
                  active ? "text-brand-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                <Icon className="h-[1.35rem] w-[1.35rem]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// The desktop promotion of that same tab bar: identical items, turned on their
// side so a laptop isn't mostly empty.
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
            className={`flex items-center gap-3 rounded-(--radius-btn) px-3 py-2.5 text-sm transition-colors duration-150 ${
              active
                ? "bg-brand-tint font-semibold text-brand-ink"
                : "font-medium text-ink-secondary hover:bg-sunken-2 hover:text-ink"
            }`}
          >
            <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
