import Link from "next/link";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";
import { MobileNav, NavLinks, RoleSwitch, type NavItem } from "./NavLinks";

export async function AppHeader({ user }: { user: User }) {
  const isAdmin = user.role === "ADMIN";
  const [pending, unread] = await Promise.all([
    isAdmin ? db.leaveRequest.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
    db.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  const items: NavItem[] = [
    { href: "/dashboard", label: "My Leaves & Balance" },
    { href: "/apply", label: "Apply for Leave" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Management", badge: pending }] : []),
    { href: "/holidays", label: "Holidays & Calendar" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(28,27,24,0.04)]">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <NavLinks items={items} />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {isAdmin && <RoleSwitch />}
          <Link href="/notifications" aria-label={`Notifications (${unread} unread)`} className="relative icon-btn">
            <Icon name="mail" className="text-xl" />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary" />}
          </Link>
          <Link href="/apply" className="hidden sm:inline-flex btn px-4 py-2 bg-primary text-on-primary hover:bg-primary-container">
            <Icon name="add" className="text-base" />
            Book Leave
          </Link>
          <details className="relative">
            <summary className="list-none cursor-pointer pl-1" aria-label="Account menu">
              <Avatar name={user.name} size="sm" />
            </summary>
            <div className="absolute right-0 top-12 w-64 card shadow-float p-2 z-50">
              <div className="px-3.5 py-3 border-b border-surface-container mb-1">
                <div className="text-label-lg text-on-surface truncate">{user.name}</div>
                <div className="text-body-sm text-on-surface-variant truncate">{user.email}</div>
              </div>
              <Link href="/profile" className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface">
                <Icon name="person" className="text-lg" /> My Profile
              </Link>
              <form action={logout}>
                <button className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface">
                  <Icon name="logout" className="text-lg" /> Sign out
                </button>
              </form>
            </div>
          </details>
          <MobileNav items={items} />
        </div>
      </div>
    </header>
  );
}
