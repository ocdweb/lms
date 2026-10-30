import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { activeHolidays, currentYear, getBalances, today, totals } from "@/lib/leave";
import { addDays, parseISODate, toISODate } from "@/lib/dates";
import { Icon } from "@/components/Icon";
import { avatarUrl } from "@/components/Avatar";
import { ApplyWorkspace } from "./ApplyWorkspace";

export const metadata: Metadata = { title: "Apply for Leave" };

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ type?: string; start?: string; end?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const now = today();
  const year = currentYear();

  const [balances, holidays, teamLeave] = await Promise.all([
    getBalances(user.id, year),
    activeHolidays(),
    db.leaveRequest.findMany({
      where: {
        userId: { not: user.id },
        status: { in: ["APPROVED", "PENDING"] },
        endDate: { gte: parseISODate(now) },
        startDate: { lte: addDays(parseISODate(now), 365) },
        user: { status: "ACTIVE" },
      },
      include: { user: true, leaveType: true },
      orderBy: { startDate: "asc" },
    }),
  ]);
  const t = totals(balances);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span className="text-label-sm uppercase tracking-wider text-secondary">Self-Service • Leave Request</span>
          </div>
          <h1 className="text-headline-xl-mobile sm:text-headline-xl text-on-surface">Book Time Off</h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Submit your request with thoughtful clarity. An automated email is sent to the Admin immediately for review and approval.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl shadow-sm self-start md:self-auto">
          <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
            <Icon name="bolt" className="text-lg" />
          </div>
          <div>
            <div className="text-label-sm text-on-surface">Auto-Routing Enabled</div>
            <div className="text-body-sm text-on-surface-variant">Admin is notified by email instantly</div>
          </div>
        </div>
      </div>

      <ApplyWorkspace
        today={now}
        year={year}
        hasBirthday={Boolean(user.birthday)}
        prefill={{ type: sp.type, start: sp.start, end: sp.end }}
        holidays={holidays}
        totals={t}
        types={balances.map((b) => ({
          id: b.type.id,
          code: b.type.code,
          name: b.type.name,
          icon: b.type.icon,
          description: b.type.description,
          deductsQuota: b.type.deductsQuota,
          allowPastDates: b.type.allowPastDates,
          allowHalfDay: b.type.allowHalfDay,
          birthdayMonthOnly: b.type.birthdayMonthOnly,
          maxDaysPerRequest: b.type.maxDaysPerRequest,
          minNoticeDays: b.type.minNoticeDays,
          allocated: b.allocated,
          remaining: b.remaining,
          available: b.available,
        }))}
        team={teamLeave.map((r) => ({
          id: r.id,
          name: r.user.name,
          avatar: avatarUrl(r.user),
          department: r.user.department ?? "",
          typeName: r.leaveType.name,
          status: r.status,
          start: toISODate(r.startDate),
          end: toISODate(r.endDate),
        }))}
      />
    </div>
  );
}
