import "server-only";
import type { LeaveType, User } from "@prisma/client";
import { db } from "./db";
import { TIMEZONE } from "./config";
import { countLeaveDays, parseISODate, todayISO, toISODate, type Duration, type HolidaySpan } from "./dates";

export const currentYear = () => Number(todayISO(TIMEZONE).slice(0, 4));
export const today = () => todayISO(TIMEZONE);

const yearRange = (year: number) => ({ gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) });

export async function activeHolidays(): Promise<HolidaySpan[]> {
  const rows = await db.holiday.findMany({ where: { active: true }, orderBy: { startDate: "asc" } });
  return rows.map((h) => ({ name: h.name, start: toISODate(h.startDate), end: toISODate(h.endDate) }));
}

/** Creates any missing balance rows for the year from each leave type's default quota. */
export async function ensureBalances(userId: string, year = currentYear()) {
  const [types, existing] = await Promise.all([
    db.leaveType.findMany({ where: { deductsQuota: true } }),
    db.leaveBalance.findMany({ where: { userId, year }, select: { leaveTypeId: true } }),
  ]);
  const have = new Set(existing.map((b) => b.leaveTypeId));
  const missing = types.filter((t) => !have.has(t.id));
  if (missing.length) {
    await db.leaveBalance.createMany({
      data: missing.map((t) => ({ userId, leaveTypeId: t.id, year, allocated: t.defaultQuota })),
    });
  }
}

export type BalanceRow = {
  type: LeaveType;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  available: number; // remaining minus pending requests
};

export async function getBalances(userId: string, year = currentYear()): Promise<BalanceRow[]> {
  await ensureBalances(userId, year);
  const [types, balances, requests] = await Promise.all([
    db.leaveType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.leaveBalance.findMany({ where: { userId, year } }),
    db.leaveRequest.findMany({
      where: { userId, status: { in: ["APPROVED", "PENDING"] }, startDate: yearRange(year) },
      select: { leaveTypeId: true, status: true, days: true },
    }),
  ]);
  return types.map((type) => {
    const allocated = balances.find((b) => b.leaveTypeId === type.id)?.allocated ?? 0;
    const sum = (status: string) =>
      requests.filter((r) => r.leaveTypeId === type.id && r.status === status).reduce((a, r) => a + r.days, 0);
    const used = sum("APPROVED");
    const pending = sum("PENDING");
    const remaining = type.deductsQuota ? Math.max(allocated - used, 0) : 0;
    return { type, allocated, used, pending, remaining, available: Math.max(remaining - pending, 0) };
  });
}

export function totals(rows: BalanceRow[]) {
  const quota = rows.filter((r) => r.type.deductsQuota);
  return {
    allocated: quota.reduce((a, r) => a + r.allocated, 0),
    used: quota.reduce((a, r) => a + r.used, 0),
    remaining: quota.reduce((a, r) => a + r.remaining, 0),
  };
}

export type LeaveInput = {
  leaveTypeId: string;
  start: string;
  end: string;
  duration: Duration;
  excludeRequestId?: string;
};

/**
 * Validates a leave request against the leave type's policy and the employee's balance.
 * `asAdmin` relaxes notice / past-date rules and the balance check is still enforced.
 */
export async function validateLeave(user: User, input: LeaveInput, opts: { asAdmin?: boolean } = {}) {
  const type = await db.leaveType.findUnique({ where: { id: input.leaveTypeId } });
  if (!type || (!type.active && !opts.asAdmin)) return { error: "Please choose a valid leave type." } as const;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start) || !/^\d{4}-\d{2}-\d{2}$/.test(input.end))
    return { error: "Please select both a start and end date." } as const;
  if (input.end < input.start) return { error: "End date cannot be before the start date." } as const;

  const duration: Duration = input.start === input.end && type.allowHalfDay ? input.duration : "FULL";
  const now = today();
  const retrospective = input.start < now;

  if (!opts.asAdmin) {
    if (retrospective && !type.allowPastDates)
      return { error: `${type.name} must be booked for today or a future date. Only leave types such as Sick Leave can be added after the fact.` } as const;
    if (type.minNoticeDays > 0 && !retrospective) {
      const noticeDate = toISODate(new Date(parseISODate(now).getTime() + type.minNoticeDays * 86_400_000));
      if (input.start < noticeDate)
        return { error: `${type.name} needs at least ${type.minNoticeDays} days' notice.` } as const;
    }
  }

  if (type.birthdayMonthOnly) {
    if (!user.birthday) return { error: "Your birthday isn't on file yet — ask an admin to add it to your profile." } as const;
    const month = user.birthday.getUTCMonth();
    if (parseISODate(input.start).getUTCMonth() !== month || parseISODate(input.end).getUTCMonth() !== month)
      return { error: "Birthday Leave can only be taken during your birthday month." } as const;
  }

  const holidays = await activeHolidays();
  const { days } = countLeaveDays(input.start, input.end, duration, holidays);
  if (days <= 0) return { error: "The selected dates fall entirely on weekends or public holidays." } as const;
  if (type.maxDaysPerRequest && days > type.maxDaysPerRequest)
    return { error: `${type.name} is limited to ${type.maxDaysPerRequest} days per request.` } as const;

  const overlap = await db.leaveRequest.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PENDING", "APPROVED"] },
      id: input.excludeRequestId ? { not: input.excludeRequestId } : undefined,
      startDate: { lte: parseISODate(input.end) },
      endDate: { gte: parseISODate(input.start) },
    },
  });
  if (overlap) return { error: "These dates overlap with another pending or approved leave." } as const;

  if (type.deductsQuota) {
    const year = Number(input.start.slice(0, 4));
    const rows = await getBalances(user.id, year);
    const row = rows.find((r) => r.type.id === type.id);
    let available = row?.available ?? 0;
    if (input.excludeRequestId) {
      const existing = await db.leaveRequest.findUnique({ where: { id: input.excludeRequestId } });
      if (existing && existing.leaveTypeId === type.id && ["PENDING", "APPROVED"].includes(existing.status))
        available += existing.days;
    }
    if (days > available)
      return { error: `Not enough ${type.name} balance: ${days} day(s) requested, ${available} available.` } as const;
  }

  return { ok: true, type, days, duration, retrospective } as const;
}

/** Balances for many users at once (used by the admin directory). */
export async function getAllBalances(userIds: string[], year = currentYear()) {
  await Promise.all(userIds.map((id) => ensureBalances(id, year)));
  const [types, balances, requests] = await Promise.all([
    db.leaveType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.leaveBalance.findMany({ where: { year, userId: { in: userIds } } }),
    db.leaveRequest.findMany({
      where: { userId: { in: userIds }, status: { in: ["APPROVED", "PENDING"] }, startDate: yearRange(year) },
      select: { userId: true, leaveTypeId: true, status: true, days: true },
    }),
  ]);
  const map = new Map<string, BalanceRow[]>();
  for (const userId of userIds) {
    map.set(
      userId,
      types.map((type) => {
        const allocated = balances.find((b) => b.userId === userId && b.leaveTypeId === type.id)?.allocated ?? 0;
        const sum = (status: string) =>
          requests.filter((r) => r.userId === userId && r.leaveTypeId === type.id && r.status === status).reduce((a, r) => a + r.days, 0);
        const used = sum("APPROVED");
        const pending = sum("PENDING");
        const remaining = type.deductsQuota ? Math.max(allocated - used, 0) : 0;
        return { type, allocated, used, pending, remaining, available: Math.max(remaining - pending, 0) };
      }),
    );
  }
  return map;
}
