import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calendarConfigured } from "@/lib/config";
import { addDays, dayNum, formatLong, formatWeekdayLong, isWeekend, monthAbbr, parseISODate, toISODate } from "@/lib/dates";
import { currentYear, today } from "@/lib/leave";
import { Icon } from "@/components/Icon";
import { initials } from "@/components/Avatar";
import { HolidayLedger } from "@/components/admin/HolidayLedger";

export const metadata: Metadata = { title: "Holidays & Calendar" };

const MONTH_FMT = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function HolidaysPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const { m } = await searchParams;
  const now = today();
  const monthStart = parseISODate(/^\d{4}-\d{2}$/.test(m ?? "") ? `${m}-01` : `${now.slice(0, 7)}-01`);
  const nextMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
  const prevMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1));
  const monthEnd = addDays(nextMonth, -1);
  const year = currentYear();

  const [holidays, leaves] = await Promise.all([
    db.holiday.findMany({ orderBy: { startDate: "asc" } }),
    db.leaveRequest.findMany({
      where: {
        status: isAdmin ? { in: ["APPROVED", "PENDING"] } : "APPROVED",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
        user: { status: "ACTIVE" },
      },
      include: { user: true, leaveType: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  // Calendar grid: Monday-first weeks covering the month
  const lead = (monthStart.getUTCDay() + 6) % 7;
  const gridStart = addDays(monthStart, -lead);
  const cells = Array.from({ length: Math.ceil((lead + monthEnd.getUTCDate()) / 7) * 7 }, (_, i) => toISODate(addDays(gridStart, i)));
  const activeHolidays = holidays.filter((h) => h.active);
  const yearHolidays = holidays.filter((h) => h.startDate.getUTCFullYear() >= year);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span className="text-label-sm uppercase tracking-wider text-secondary">Company Calendar</span>
          </div>
          <h1 className="text-headline-xl-mobile sm:text-headline-xl">Holidays &amp; Calendar</h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">Public holidays and who&apos;s out of office. Holidays are automatically excluded from leave calculations.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl shadow-sm self-start md:self-auto">
          <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
            <Icon name="calendar_month" className="text-lg" />
          </div>
          <div>
            <div className="text-label-sm text-on-surface">Google Calendar</div>
            <div className="text-body-sm text-on-surface-variant">{calendarConfigured() ? "Approved leave syncs automatically" : "Not connected yet"}</div>
          </div>
        </div>
      </div>

      <section className="card p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="eyebrow block mb-1">Out of Office</span>
            <h2 className="text-headline-md">{MONTH_FMT.format(monthStart)}</h2>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/holidays?m=${toISODate(prevMonth).slice(0, 7)}`} className="icon-btn" aria-label="Previous month">
              <Icon name="chevron_left" />
            </Link>
            <Link href="/holidays" className="btn-ghost text-label-sm">Today</Link>
            <Link href={`/holidays?m=${toISODate(nextMonth).slice(0, 7)}`} className="icon-btn" aria-label="Next month">
              <Icon name="chevron_right" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="grid grid-cols-7 gap-1.5 min-w-[700px]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-label-sm uppercase tracking-wider text-on-surface-variant px-2 pb-1">{d}</div>
            ))}
            {cells.map((iso) => {
              const inMonth = iso.slice(0, 7) === toISODate(monthStart).slice(0, 7);
              const weekend = isWeekend(parseISODate(iso));
              const holiday = activeHolidays.find((h) => iso >= toISODate(h.startDate) && iso <= toISODate(h.endDate));
              const off = weekend || holiday ? [] : leaves.filter((l) => iso >= toISODate(l.startDate) && iso <= toISODate(l.endDate));
              return (
                <div
                  key={iso}
                  className={`min-h-[96px] rounded-lg p-2 space-y-1 ${!inMonth ? "opacity-40" : ""} ${
                    holiday ? "bg-secondary-container/30" : weekend ? "bg-surface-container-low" : "bg-surface"
                  } ${iso === now ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="text-label-md text-on-surface-variant">{Number(iso.slice(8))}</div>
                  {holiday && <div className="text-label-sm text-on-secondary-container truncate">🎉 {holiday.name}</div>}
                  {off.slice(0, 3).map((l) => (
                    <div
                      key={l.id}
                      title={`${l.user.name} — ${l.leaveType.name}${l.status === "PENDING" ? " (pending)" : ""}`}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-label-sm truncate ${
                        l.status === "PENDING" ? "border border-dashed border-outline-variant text-on-surface-variant" : "bg-surface-container-lowest shadow-sm text-on-surface"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-surface-container-high text-[8px] flex items-center justify-center shrink-0">{initials(l.user.name)}</span>
                      <span className="truncate">{l.user.name.split(" ")[0]}</span>
                    </div>
                  ))}
                  {off.length > 3 && <div className="text-label-sm text-on-surface-variant">+{off.length - 3} more</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-secondary-container/60" /> Public holiday</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-surface-container-lowest shadow" /> Approved leave</span>
          {isAdmin && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-dashed border-outline" /> Pending request</span>}
        </div>
      </section>

      {isAdmin ? (
        <HolidayLedger holidays={yearHolidays.map((h) => ({ id: h.id, name: h.name, start: toISODate(h.startDate), end: toISODate(h.endDate), kind: h.kind, active: h.active }))} showAll />
      ) : (
        <section className="card p-6 lg:p-8 space-y-6">
          <div>
            <span className="eyebrow block mb-1">Public Holidays</span>
            <h2 className="text-headline-md">Public Holidays</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearHolidays.filter((h) => h.active).map((h) => {
              const days = Math.round((h.endDate.getTime() - h.startDate.getTime()) / 86_400_000) + 1;
              const past = toISODate(h.endDate) < now;
              return (
                <div key={h.id} className={`p-4 rounded-xl bg-surface-container-low flex items-start gap-4 ${past ? "opacity-60" : ""}`}>
                  <div className="w-12 h-14 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center shrink-0 shadow-sm">
                    <span className="text-label-sm uppercase text-secondary font-bold">{monthAbbr(h.startDate)}</span>
                    <span className="text-headline-sm font-bold leading-none">{dayNum(h.startDate)}</span>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-label-lg truncate">{h.name}</h3>
                    <p className="text-body-sm text-secondary font-medium">{days} {days === 1 ? "Day" : "Days"} • Office Closed</p>
                    <p className="text-label-sm text-on-surface-variant">{days === 1 ? formatWeekdayLong(h.startDate) : `${formatLong(h.startDate)} – ${formatLong(h.endDate)}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
