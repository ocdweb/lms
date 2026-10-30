import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEPARTMENTS } from "@/lib/config";
import { formatDays, formatLong, formatRange, toISODate } from "@/lib/dates";
import { currentYear, getBalances, today } from "@/lib/leave";
import { Avatar, avatarUrl } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { QuotaCard } from "@/components/QuotaCard";
import { StatusBadge } from "@/components/StatusBadge";
import { RequestActions } from "@/components/admin/RequestActions";
import { EmployeeAdminPanel } from "./EmployeeAdminPanel";

export const metadata: Metadata = { title: "Employee" };

export default async function EmployeePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ year?: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) notFound();

  const thisYear = currentYear();
  const year = Number(sp.year) || thisYear;
  const now = today();
  const [balances, requests, types, employees] = await Promise.all([
    getBalances(user.id, year),
    db.leaveRequest.findMany({ where: { userId: user.id }, include: { leaveType: true, reviewedBy: true }, orderBy: { startDate: "desc" } }),
    db.leaveType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.user.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const yearRequests = requests.filter((r) => r.startDate.getUTCFullYear() === year);

  return (
    <div className="space-y-10">
      <Link href="/admin#directory" className="btn-ghost -ml-3">
        <Icon name="arrow_back" className="text-base" /> Employee directory
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar name={user.name} src={avatarUrl(user)} size="lg" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-headline-lg-mobile sm:text-headline-lg">{user.name}</h1>
              {user.status !== "ACTIVE" && <span className="px-2.5 py-1 rounded-full bg-[#fbf2f1] text-[#9e3f36] text-label-sm">Inactive</span>}
              {user.role === "ADMIN" && <span className="px-2.5 py-1 rounded-full bg-primary text-on-primary text-label-sm">Admin</span>}
            </div>
            <p className="text-body-md text-on-surface-variant">
              {[user.jobTitle, user.department, user.location].filter(Boolean).join(" • ") || user.email} • Joined {formatLong(user.joinedAt)}
            </p>
          </div>
        </div>
        <div className="pill-tabs self-start">
          {[thisYear - 1, thisYear, thisYear + 1].map((y) => (
            <Link key={y} href={`/admin/employees/${user.id}?year=${y}`} className={`pill-tab ${y === year ? "pill-tab-active" : ""}`}>
              {y}
            </Link>
          ))}
        </div>
      </div>

      <EmployeeAdminPanel
        isSelf={admin.id === user.id}
        year={year}
        departments={DEPARTMENTS}
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle ?? "",
          department: user.department ?? "",
          location: user.location ?? "",
          phone: user.phone ?? "",
          role: user.role,
          status: user.status,
          birthday: user.birthday ? toISODate(user.birthday) : "",
        }}
        types={types.map((t) => ({ id: t.id, name: t.name, deductsQuota: t.deductsQuota, defaultQuota: t.defaultQuota }))}
        employees={employees}
        quotaRows={balances.filter((b) => b.type.deductsQuota).map((b) => ({ typeId: b.type.id, name: b.type.name, allocated: b.allocated, used: b.used }))}
      />

      <section>
        <div className="mb-6">
          <span className="eyebrow block mb-1">Balances</span>
          <h2 className="text-headline-md">Entitlements {year}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {balances.map((row) => (
            <QuotaCard key={row.type.id} row={row} birthday={user.birthday} />
          ))}
        </div>
      </section>

      <section className="card p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="eyebrow block mb-1">Leave History</span>
            <h2 className="text-headline-md">{year} Requests ({yearRequests.length})</h2>
          </div>
          <a href={`/api/export?scope=all&userId=${user.id}`} className="text-label-md inline-flex items-center gap-1 hover:text-secondary">
            Export CSV <Icon name="download" className="text-sm" />
          </a>
        </div>
        <div className="space-y-3">
          {yearRequests.length === 0 && <p className="text-body-sm text-on-surface-variant">No leave recorded for {year}.</p>}
          {yearRequests.map((r) => (
            <div key={r.id} className="p-4 rounded-lg bg-surface flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                  <Icon name={r.leaveType.icon} className="text-xl" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/leaves/${r.id}`} className="text-label-lg hover:underline">{r.leaveType.name}</Link>
                    <StatusBadge status={r.status} completed={r.status === "APPROVED" && toISODate(r.endDate) < now} />
                    {r.recordedById && <span className="text-label-sm text-on-surface-variant">Recorded by Admin</span>}
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    {formatRange(r.startDate, r.endDate)} • <strong className="text-on-surface">{formatDays(r.days)}</strong>
                    {r.reviewedBy ? ` • reviewed by ${r.reviewedBy.name}` : ""}
                  </p>
                  {(r.adminComment || r.reason) && <p className="text-body-sm text-on-surface-variant italic">“{r.adminComment || r.reason}”</p>}
                </div>
              </div>
              <div className="self-end md:self-center">
                <RequestActions id={r.id} name={user.name} status={r.status} start={toISODate(r.startDate)} end={toISODate(r.endDate)} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
