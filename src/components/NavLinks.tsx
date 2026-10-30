"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { DropdownMenu } from "./DropdownMenu";

export type NavItem = { href: string; label: string; badge?: number; match?: string };

const isActive = (path: string, item: NavItem) => {
  const base = item.match ?? item.href;
  return path === base || (base !== "/" && path.startsWith(base + "/"));
};

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="hidden xl:flex items-center gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(path, item) ? "page" : undefined}
          className={`px-3.5 py-2 rounded-lg text-label-md inline-flex items-center gap-2 transition-colors ${
            isActive(path, item) ? "bg-surface-container text-on-surface" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
          }`}
        >
          {item.label}
          {!!item.badge && <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">{item.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <DropdownMenu label="Menu" className="xl:hidden" triggerClassName="icon-btn" trigger={<Icon name="menu" className="text-xl" />}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-label-lg ${
            isActive(path, item) ? "bg-surface-container text-on-surface" : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          {item.label}
          {!!item.badge && <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">{item.badge}</span>}
        </Link>
      ))}
    </DropdownMenu>
  );
}

export function RoleSwitch() {
  const path = usePathname();
  const admin = path.startsWith("/admin");
  const cls = (on: boolean) =>
    `px-3 py-1 rounded-full text-label-sm transition-colors ${on ? "bg-surface-container-lowest text-on-surface shadow-[0_1px_2px_rgba(28,27,24,0.04)]" : "text-on-surface-variant hover:text-on-surface"}`;
  return (
    <div className="hidden md:flex items-center p-0.5 rounded-full bg-surface-container">
      <Link href="/dashboard" className={cls(!admin)}>Employee</Link>
      <Link href="/admin" className={cls(admin)}>Admin</Link>
    </div>
  );
}
