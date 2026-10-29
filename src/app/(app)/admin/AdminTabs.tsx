"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/requests", label: "Leave Requests" },
  { href: "/admin/leave-types", label: "Leave Types & Policies" },
  { href: "/admin/email-log", label: "Email Log" },
];

export function AdminTabs() {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" || path.startsWith("/admin/employees") : path.startsWith(href));
  return (
    <div className="pill-tabs mb-8">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={`pill-tab ${active(t.href) ? "pill-tab-active" : ""}`}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
