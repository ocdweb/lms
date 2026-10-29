import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDays, formatMonthDay, formatRange, parseISODate, toISODate } from "@/lib/dates";
import { today } from "@/lib/leave";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { RequestActions } from "@/components/admin/RequestActions";

export const metadata: Metadata = { title: "Leave Requests" };

type SP = { status?: string; type?: string; q?: string; from?: string; to?: string };

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const now = today();
  const where: Prisma.LeaveRequestWhereInput = {
    status: sp.status && sp.status !== "ALL" ? sp.status : undefined,
    leaveTypeId: sp.type || undefined,
    user: sp.q ? { OR: [{ name: { contains: sp.q } }, { email: { contains: sp.q } }, { department: { contains: sp.q } }] } : undefined,
    endDate: sp.from ? { gte: parseISODate(sp.from) } : undefined,
    startDate: sp.to ? { lte: parseISODate(sp.to) } : undefined,
  };
  const [requests, types, counts] = await Promise.all([
    db.leaveRequest.findMany({ where, include: { user: true, leaveType: true, reviewedBy: true }, orderBy: { startDate: "desc" }, take: 300 }),
    db.leaveType.findMany({ orderBy: { sortOrder: "asc" } }),
    db.leaveRequest.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/requests?${p}`;
  };
  const exportHref = `/api/export?scope=all&${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][])}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="eyebrow">All Employees</span>
          <h1 className="text-headline-lg-mobile sm:text-headline-lg">Leave Requests</h1>
          <p className="text-body-md text-on-surface-variant">Every submitted, approved, rejected and cancelled leave across the company.</p>
        </div>
        <a href={exportHref} className="btn px-4 py-2.5 bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low self-start md:self-auto">
          <Icon name="download" className="text-base" /> Export CSV
        </a>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="pill-tabs">
          {[
            ["ALL", "All"],
            ["PENDING", `Pending (${count("PENDING")})`],
            ["APPROVED", `Approved (${count("APPROVED")})`],
            ["REJECTED", `Rejected (${count("REJECTED")})`],
            ["CANCELLED", `Cancelled (${count("CANCELLED")})`],
          ].map(([key, label]) => (
            <Link key={key} href={qs({ status: key === "ALL" ? undefined : key })} className={`pill-tab ${(sp.status ?? "ALL") === key ? "pill-tab-active" : ""}`}>
              {label}
            </Link>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" action="/admin/requests">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={sp.q} placeholder="Employee or team" className="px-3 py-2 rounded-lg bg-surface-container-lowest shadow-sm text-body-sm focus:outline-none w-40" />
          <select name="type" defaultValue={sp.type ?? ""} className="px-3 py-2 rounded-lg bg-surface-container-lowest shadow-sm text-body-sm focus:outline-none">
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input name="from" type="date" defaultValue={sp.from} aria-label="From" className="px-3 py-2 rounded-lg bg-surface-container-lowest shadow-sm text-body-sm focus:outline-none" />
          <input name="to" type="date" defaultValue={sp.to} aria-label="To" className="px-3 py-2 rounded-lg bg-surface-container-lowest shadow-sm text-body-sm focus:outline-none" />
          <button className="btn-primary py-2">Filter</button>
          {(sp.q || sp.type || sp.from || sp.to) && <Link href={qs({ q: undefined, type: undefined, from: undefined, to: undefined })} className="btn-ghost">Clear</Link>}
        </form>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px] text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-4">Leave</th>
                <th className="py-4 px-4">Dates</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Reviewed</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-on-surface-variant">No leave requests match these filters.</td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-surface-container-low hover:bg-surface-container-low/60">
                  <td className="py-4 px-6">
                    <Link href={`/admin/employees/${r.userId}`} className="text-label-lg hover:underline">{r.user.name}</Link>
                    <div className="text-on-surface-variant">{r.user.department ?? "—"}</div>
                  </td>
                  <td className="py-4 px-4">
                    <Link href={`/leaves/${r.id}`} className="inline-flex items-center gap-2 hover:underline">
                      <Icon name={r.leaveType.icon} className="text-base text-secondary" />
                      {r.leaveType.name}
                    </Link>
                    {r.reason && <div className="text-on-surface-variant italic truncate max-w-[220px]">“{r.reason}”</div>}
                  </td>
                  <td className="py-4 px-4">
                    <div>{formatRange(r.startDate, r.endDate)}</div>
                    <div className="text-on-surface-variant">
                      {formatDays(r.days)}
                      {r.retrospective ? " • post-dated" : ""}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={r.status} completed={r.status === "APPROVED" && toISODate(r.endDate) < now} />
                  </td>
                  <td className="py-4 px-4 text-on-surface-variant">
                    {r.reviewedBy ? `${r.reviewedBy.name.split(" ")[0]} • ${formatMonthDay(r.reviewedAt!)}` : "—"}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <RequestActions id={r.id} name={r.user.name} status={r.status} start={toISODate(r.startDate)} end={toISODate(r.endDate)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
