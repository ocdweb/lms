import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentYear, getBalances, today, totals } from "@/lib/leave";
import { addDays, dayNum, formatDate, formatLong, formatWeekdayLong, monthAbbr, toISODate } from "@/lib/dates";
import { toLeaveRow } from "@/lib/present";
import { Icon } from "@/components/Icon";
import { QuotaCard } from "@/components/QuotaCard";
import { LeaveApplications } from "@/components/LeaveApplications";

export const metadata: Metadata = { title: "My Leaves & Balance" };

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default async function DashboardPage() {
  const user = await requireUser();
  const year = currentYear();
  const now = today();

  const [balances, requests, holidays] = await Promise.all([
    getBalances(user.id, year),
    db.leaveRequest.findMany({ where: { userId: user.id }, include: { leaveType: true }, orderBy: { startDate: "desc" } }),
    db.holiday.findMany({ where: { active: true }, orderBy: { startDate: "asc" } }),
  ]);
  const t = totals(balances);
  const upcoming = holidays.filter((h) => toISODate(h.endDate) >= now).slice(0, 3);
  const holidayDaysThisYear = holidays
    .filter((h) => h.startDate.getUTCFullYear() === year)
    .reduce((a, h) => a + Math.round((h.endDate.getTime() - h.startDate.getTime()) / 86_400_000) + 1, 0);

  // Bridge-day tip: a holiday ending on Thursday (book Friday) or starting on Tuesday (book Monday)
  const tip = upcoming
    .map((h) => {
      const end = h.endDate.getUTCDay();
      const start = h.startDate.getUTCDay();
      if (end === 4) return { h, day: addDays(h.endDate, 1) };
      if (start === 2) return { h, day: addDays(h.startDate, -1) };
      return null;
    })
    .find(Boolean);
  const annual = balances.find((b) => b.type.code === "ANNUAL");

  return (
    <div className="space-y-10">
      {/* Welcome banner */}
      <section className="relative overflow-hidden card p-8 lg:p-10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low text-secondary text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              BALANCE LEDGER • LEAVE YEAR {year}
            </div>
            <h1 className="text-headline-lg-mobile sm:text-headline-lg text-on-surface">
              Welcome back, {user.name.split(" ")[0]}. You have <span className="text-secondary">{fmt(t.remaining)} total</span> leave days remaining.
            </h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl">
              Your balances reflect this year&apos;s entitlements, approved leave and public holidays. Rest is essential; plan seamlessly.
            </p>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-surface-container-low text-on-surface-variant text-body-sm max-w-2xl">
              <Icon name="mark_email_read" className="text-secondary text-lg shrink-0 mt-0.5" />
              <p>
                Whenever you book leave, an email alert is sent to your Admin. You&apos;ll receive an email and an in-portal notification the moment your request is reviewed.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0">
            <Link href="/apply" className="btn px-6 py-3.5 bg-primary text-on-primary hover:bg-primary-container shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <Icon name="calendar_add_on" className="text-lg" /> Apply for Leave
            </Link>
            <Link href="/policy" className="btn px-6 py-3 bg-surface-container-low text-on-surface hover:bg-surface-container">
              <Icon name="history_edu" className="text-lg" /> View Full Policy
            </Link>
          </div>
        </div>
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
      </section>

      {/* Entitlements */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="eyebrow block mb-1">Time-Off Allowances</span>
            <h2 className="text-headline-md text-on-surface">Available Entitlements</h2>
          </div>
          <span className="text-label-sm text-on-surface-variant hidden sm:inline-block">
            {fmt(t.used)} of {fmt(t.allocated)} days used • {year}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {balances.map((row) => (
            <QuotaCard key={row.type.id} row={row} birthday={user.birthday} />
          ))}
          <Link href="/holidays" className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between shadow-card hover:bg-surface-container transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Public Holidays</span>
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                  <Icon name="celebration" className="text-base" />
                </div>
              </div>
              <div className="text-headline-md text-on-surface">Pre-scheduled</div>
              <span className="text-body-sm text-on-surface-variant">National &amp; NSW public holidays</span>
              <p className="text-label-sm text-secondary">Zero quota deduction applied</p>
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between text-on-surface-variant text-label-sm">
              <span>Corporate Calendar</span>
              <span className="inline-flex items-center gap-1 text-on-surface">
                {holidayDaysThisYear} Days in {year} <Icon name="arrow_forward" className="text-sm" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 card p-6 lg:p-8 space-y-6">
          <LeaveApplications rows={requests.map((r) => toLeaveRow(r, now))} />
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface-container-high/40 text-on-surface-variant text-body-sm">
            <span className="flex items-center gap-1.5">
              <Icon name="verified_user" className="text-sm text-secondary" />
              Email notifications are recorded for every request and decision
            </span>
            <a href="/api/export?scope=me" className="text-label-md text-on-surface hover:text-secondary inline-flex items-center gap-1 transition-colors">
              Export CSV Record <Icon name="download" className="text-sm" />
            </a>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="card p-6 lg:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow block mb-1">Public Holidays</span>
                <h3 className="text-headline-md text-on-surface">Upcoming Holidays</h3>
              </div>
              <Icon name="event" className="text-on-surface-variant" />
            </div>
            <div className="space-y-4">
              {upcoming.length === 0 && <p className="text-body-sm text-on-surface-variant">No upcoming holidays scheduled.</p>}
              {upcoming.map((h) => {
                const days = Math.round((h.endDate.getTime() - h.startDate.getTime()) / 86_400_000) + 1;
                return (
                  <div key={h.id} className="p-4 rounded-xl bg-surface-container-low flex items-start gap-4">
                    <div className="w-12 h-14 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span className="text-label-sm uppercase text-secondary font-bold">{monthAbbr(h.startDate)}</span>
                      <span className="text-headline-sm font-bold text-on-surface leading-none">{dayNum(h.startDate)}</span>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-label-lg text-on-surface truncate">{h.name}</h4>
                      <p className="text-body-sm text-secondary font-medium">
                        {days} {days === 1 ? "Day" : "Days"} • Office Closed
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {days === 1 ? formatWeekdayLong(h.startDate) : `${formatLong(h.startDate)} – ${formatLong(h.endDate)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link href="/holidays" className="w-full py-2.5 px-4 rounded-lg bg-surface-container flex items-center justify-center gap-2 text-on-surface text-label-md hover:bg-surface-container-high transition-colors">
              <Icon name="calendar_month" className="text-base" /> Open Annual Company Calendar
            </Link>
          </div>

          {tip && annual && annual.available >= 1 && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
                  <Icon name="lightbulb" className="text-lg" />
                </div>
                <h4 className="text-label-lg text-on-surface">Long Weekend Tip</h4>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                {tip.h.name} sits next to the weekend. Book {formatDate(tip.day)} using just <strong className="text-on-surface">1 Annual Day</strong> to enjoy an uninterrupted long weekend.
              </p>
              <Link
                href={`/apply?type=${annual.type.id}&start=${toISODate(tip.day)}&end=${toISODate(tip.day)}`}
                className="text-label-sm text-secondary hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Pre-fill {formatDate(tip.day)} booking <Icon name="arrow_forward" className="text-[14px]" />
              </Link>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl h-44 shadow-sm bg-gradient-to-br from-[#d9c7a3] via-[#a68a5b] to-[#3a3226]">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-secondary-fixed/30 blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent flex flex-col justify-end p-5 text-on-primary">
              <span className="text-label-sm text-secondary-fixed uppercase tracking-wider">Mindful Wellbeing</span>
              <p className="text-headline-sm leading-snug">“Taking deliberate rest restores your finest focus.”</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
