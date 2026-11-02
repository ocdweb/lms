import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEPARTMENTS, TIMEZONE } from "@/lib/config";
import { formatDateTime, formatMonthDay, formatRange, parseISODate, toISODate } from "@/lib/dates";
import { currentYear, getAllBalances, today } from "@/lib/leave";
import { Icon } from "@/components/Icon";
import { PendingCard } from "@/components/admin/PendingCard";
import { HolidayLedger } from "@/components/admin/HolidayLedger";
import { EmployeeDirectory, type DirectoryRow } from "@/components/admin/EmployeeDirectory";
import { AddEmployeeDialog, RecordLeaveDialog } from "@/components/admin/EmployeeDialogs";
import { avatarUrl } from "@/components/Avatar";

export const metadata: Metadata = { title: "Admin Management" };

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const SHORT: Record<string, string> = { CASUAL: "Cas", SICK: "Sick", PLANNED: "Plan", BIRTHDAY: "B-Day" };

export default async function AdminPage() {
  await requireAdmin();
  const now = today();
  const nowDate = parseISODate(now);
  const year = currentYear();

  const [pending, users, types, holidays, onLeaveToday] = await Promise.all([
    db.leaveRequest.findMany({ where: { status: "PENDING" }, include: { user: true, leaveType: true }, orderBy: { createdAt: "asc" } }),
    db.user.findMany({ orderBy: [{ status: "asc" }, { name: "asc" }] }),
    db.leaveType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.holiday.findMany({ orderBy: { startDate: "asc" } }),
    db.leaveRequest.findMany({
      where: { status: "APPROVED", startDate: { lte: nowDate }, endDate: { gte: nowDate }, user: { status: "ACTIVE" } },
      include: { user: true },
    }),
  ]);
  const balances = await getAllBalances(users.map((u) => u.id), year);
  const active = users.filter((u) => u.status === "ACTIVE");
  const onLeaveIds = new Set(onLeaveToday.map((r) => r.userId));
  const nextHoliday = holidays.find((h) => h.active && toISODate(h.endDate) >= now);

  const rows: DirectoryRow[] = users.map((u) => {
    const b = balances.get(u.id) ?? [];
    const annual = b.find((r) => r.type.code === "ANNUAL");
    return {
      id: u.id,
      name: u.name,
      avatar: avatarUrl(u),
      email: u.email,
      jobTitle: u.jobTitle,
      department: u.department,
      location: u.location,
      role: u.role,
      status: u.status,
      onLeave: onLeaveIds.has(u.id),
      annual: annual ? { remaining: annual.remaining, allocated: annual.allocated } : null,
      chips: b
        .filter((r) => r.type.deductsQuota && r.type.code !== "ANNUAL")
        .map((r) => `${SHORT[r.type.code] ?? r.type.name.split(" ")[0]}: ${fmt(r.remaining)}/${fmt(r.allocated)}`),
      quotaRows: b.filter((r) => r.type.deductsQuota).map((r) => ({ typeId: r.type.id, name: r.type.name, allocated: r.allocated, used: r.used })),
    };
  });

  const teams = new Set(onLeaveToday.map((r) => r.user.department)).size;
  const typeLite = types.map((t) => ({ id: t.id, name: t.name, deductsQuota: t.deductsQuota, defaultQuota: t.defaultQuota }));
  const employeesLite = active.map((u) => ({ id: u.id, name: u.name }));

  const stats = [
    { label: "Pending Actions", value: String(pending.length), sub: "Awaiting authorization", icon: "pending_actions", gold: true },
    { label: "On Leave Today", value: String(onLeaveIds.size), sub: onLeaveIds.size ? `Across ${teams} ${teams === 1 ? "team" : "teams"}` : "Everyone is in", icon: "flight_takeoff" },
    { label: "Active Workforce", value: String(active.length), sub: `${users.length - active.length} inactive`, icon: "badge" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Icon name="admin_panel_settings" className="text-base text-secondary" />
            <span className="text-label-sm uppercase tracking-wider">Administrative Operations • Leave Console</span>
          </div>
          <h1 className="text-headline-xl-mobile sm:text-headline-xl text-on-surface max-w-xl">Admin Management &amp; Leave Approvals</h1>
          <p className="text-body-md text-on-surface-variant max-w-xl">Review leave submissions, manage quotas, and administer the employee directory.</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end lg:max-w-md">
          <a href="/api/export?scope=all" className="btn px-4 py-2.5 bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low">
            <Icon name="download" className="text-base" /> Export Summary
          </a>
          <RecordLeaveDialog
            types={typeLite}
            employees={employeesLite}
            trigger={(
              <button type="button" className="btn-secondary">
                <Icon name="edit_calendar" className="text-base" /> Record Leave for Employee
              </button>
            )}
          />
          <AddEmployeeDialog
            types={typeLite}
            departments={DEPARTMENTS}
            trigger={(
              <button type="button" className="btn-primary">
                <Icon name="person_add" className="text-base" /> Add New Employee
              </button>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
            <div>
              <span className="text-label-sm text-on-surface-variant uppercase">{s.label}</span>
              <div className="text-numerical-display text-on-surface mt-1">{s.value}</div>
              <span className={`text-body-sm ${s.gold ? "text-secondary" : "text-on-surface-variant"}`}>{s.sub}</span>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.gold ? "bg-secondary-container/40 text-on-secondary-container" : "bg-surface-container-low text-on-surface"}`}>
              <Icon name={s.icon} />
            </div>
          </div>
        ))}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-label-sm text-on-surface-variant uppercase">Upcoming Holiday</span>
            <div className="text-headline-md text-on-surface mt-1 truncate">{nextHoliday?.name ?? "None scheduled"}</div>
            {nextHoliday && (
              <span className="text-body-sm text-secondary">
                {formatMonthDay(nextHoliday.startDate)} • {Math.round((nextHoliday.endDate.getTime() - nextHoliday.startDate.getTime()) / 86_400_000) + 1} day(s)
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-secondary-container/40 text-on-secondary-container flex items-center justify-center shrink-0">
            <Icon name="celebration" />
          </div>
        </div>
      </div>

      <section className="space-y-4" id="pending">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-headline-md text-on-surface">Pending Approvals Queue</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">
              {pending.length} {pending.length === 1 ? "Request" : "Requests"}
            </span>
          </div>
          <p className="text-body-sm text-on-surface-variant flex items-center gap-1">
            <Icon name="bolt" className="text-base text-secondary" /> Approving or rejecting immediately emails the employee.
          </p>
        </div>
        {pending.length === 0 && (
          <div className="card p-10 text-center text-on-surface-variant">
            <Icon name="task_alt" className="text-4xl text-secondary block mb-2" />
            All caught up — no requests are waiting for review.
          </div>
        )}
        {pending.map((r) => {
          const b = balances.get(r.userId)?.find((x) => x.type.id === r.leaveTypeId);
          return (
            <PendingCard
              key={r.id}
              r={{
                id: r.id,
                name: r.user.name,
                avatar: avatarUrl(r.user),
                department: r.user.department,
                typeName: r.leaveType.name,
                range: formatRange(r.startDate, r.endDate) + (r.duration !== "FULL" ? ` (${r.duration === "HALF_AM" ? "1st" : "2nd"} half)` : ""),
                start: toISODate(r.startDate),
                end: toISODate(r.endDate),
                days: r.days,
                quotaNote: r.leaveType.deductsQuota && b ? `Quota remaining: ${fmt(b.remaining)} of ${fmt(b.allocated)} days (before this request)` : "No quota deduction",
                reason: r.reason,
                retrospective: r.retrospective,
                submitted: formatDateTime(r.createdAt, TIMEZONE),
                handover: r.handoverContact,
              }}
            />
          );
        })}
      </section>

      <HolidayLedger
        today={now}
        holidays={holidays.map((h) => ({ id: h.id, name: h.name, start: toISODate(h.startDate), end: toISODate(h.endDate), kind: h.kind, active: h.active }))}
      />

      <EmployeeDirectory rows={rows} types={typeLite} employees={employeesLite} year={year} />
    </div>
  );
}
