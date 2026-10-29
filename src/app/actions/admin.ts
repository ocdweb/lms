"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseISODate, type Duration } from "@/lib/dates";
import { currentYear, ensureBalances, validateLeave } from "@/lib/leave";
import { onEmployeeCreated, onLeaveCancelled, onLeaveDecided, onLeaveRecorded } from "@/lib/workflow";
import { fail, ok, type ActionState } from "@/lib/action-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === "" ? null : Number(v);
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const refresh = () => revalidatePath("/", "layout");
const DURATIONS: Duration[] = ["FULL", "HALF_AM", "HALF_PM"];
const asDuration = (v: string): Duration => (DURATIONS.includes(v as Duration) ? (v as Duration) : "FULL");

// ── Leave requests ──────────────────────────────────────

export async function approveLeave(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const r = await db.leaveRequest.findUnique({ where: { id: str(fd, "id") }, include: { user: true, leaveType: true } });
  if (!r || r.status !== "PENDING") return fail("This request is no longer pending.");

  // Re-check balance at approval time (quotas may have changed since submission)
  const v = await validateLeave(
    r.user,
    { leaveTypeId: r.leaveTypeId, start: r.startDate.toISOString().slice(0, 10), end: r.endDate.toISOString().slice(0, 10), duration: asDuration(r.duration), excludeRequestId: r.id },
    { asAdmin: true },
  );
  if ("error" in v) return fail(v.error!);

  await db.leaveRequest.update({
    where: { id: r.id },
    data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date(), adminComment: str(fd, "comment") || null },
  });
  await onLeaveDecided(r.id);
  refresh();
  return ok(`Approved ${r.user.name}'s ${r.leaveType.name}. They've been notified by email.`);
}

export async function rejectLeave(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const comment = str(fd, "comment");
  const r = await db.leaveRequest.findUnique({ where: { id: str(fd, "id") }, include: { user: true, leaveType: true } });
  if (!r || r.status !== "PENDING") return fail("This request is no longer pending.");
  if (!comment) return fail("Please give the employee a reason for the rejection.");
  await db.leaveRequest.update({
    where: { id: r.id },
    data: { status: "REJECTED", reviewedById: admin.id, reviewedAt: new Date(), adminComment: comment },
  });
  await onLeaveDecided(r.id);
  refresh();
  return ok(`Rejected ${r.user.name}'s request. They've been notified by email.`);
}

export async function adjustLeaveDates(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const r = await db.leaveRequest.findUnique({ where: { id: str(fd, "id") }, include: { user: true } });
  if (!r || !["PENDING", "APPROVED"].includes(r.status)) return fail("Only pending or approved leave can be adjusted.");
  const start = str(fd, "startDate");
  const end = str(fd, "endDate") || start;
  const v = await validateLeave(
    r.user,
    { leaveTypeId: r.leaveTypeId, start, end, duration: asDuration(str(fd, "duration") || r.duration), excludeRequestId: r.id },
    { asAdmin: true },
  );
  if ("error" in v) return fail(v.error!);
  await db.leaveRequest.update({
    where: { id: r.id },
    data: { startDate: parseISODate(start), endDate: parseISODate(end), days: v.days, duration: v.duration },
  });
  if (r.status === "APPROVED" && r.googleEventId) {
    // Re-sync the calendar entry with the new dates
    const { deleteCalendarEvent } = await import("@/lib/calendar");
    await deleteCalendarEvent(r.googleEventId);
    await db.leaveRequest.update({ where: { id: r.id }, data: { googleEventId: null } });
    await onLeaveDecided(r.id);
  }
  refresh();
  return ok(`Dates updated — now ${v.days} working day(s).`);
}

/** Admin records leave on behalf of an employee (auto-approved). */
export async function recordLeave(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const user = await db.user.findUnique({ where: { id: str(fd, "userId") } });
  if (!user) return fail("Choose an employee.");
  const start = str(fd, "startDate");
  const end = str(fd, "endDate") || start;
  const v = await validateLeave(
    user,
    { leaveTypeId: str(fd, "leaveTypeId"), start, end, duration: asDuration(str(fd, "duration")) },
    { asAdmin: true },
  );
  if ("error" in v) return fail(v.error!);
  const r = await db.leaveRequest.create({
    data: {
      userId: user.id,
      leaveTypeId: v.type.id,
      startDate: parseISODate(start),
      endDate: parseISODate(end),
      duration: v.duration,
      days: v.days,
      reason: str(fd, "reason") || "Recorded by Admin",
      adminComment: str(fd, "comment") || null,
      status: "APPROVED",
      retrospective: v.retrospective,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      recordedById: admin.id,
      adminEmailSent: true,
    },
  });
  if (bool(fd, "notify")) await onLeaveRecorded(r.id);
  else {
    const { createCalendarEvent } = await import("@/lib/calendar");
    const id = await createCalendarEvent({ summary: `${user.name} — ${v.type.name}`, start: r.startDate, end: r.endDate });
    if (id) await db.leaveRequest.update({ where: { id: r.id }, data: { googleEventId: id } });
  }
  refresh();
  return ok(`Recorded ${v.days} day(s) of ${v.type.name} for ${user.name}.`);
}

/** Removes (cancels) an approved or pending leave and returns the days to the balance. */
export async function removeLeave(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const r = await db.leaveRequest.findUnique({ where: { id: str(fd, "id") }, include: { user: true } });
  if (!r || !["PENDING", "APPROVED"].includes(r.status)) return fail("This leave can't be removed.");
  await db.leaveRequest.update({
    where: { id: r.id },
    data: { status: "CANCELLED", adminComment: str(fd, "comment") || "Removed by Admin" },
  });
  await onLeaveCancelled(r.id, "ADMIN");
  refresh();
  return ok(`Leave removed — ${r.days} day(s) returned to ${r.user.name}'s balance.`);
}

// ── Employees ───────────────────────────────────────────

function employeeFields(fd: FormData) {
  const birthday = str(fd, "birthday");
  return {
    name: str(fd, "name"),
    email: str(fd, "email").toLowerCase(),
    jobTitle: str(fd, "jobTitle") || null,
    department: str(fd, "department") || null,
    location: str(fd, "location") || null,
    phone: str(fd, "phone") || null,
    role: str(fd, "role") === "ADMIN" ? "ADMIN" : "EMPLOYEE",
    birthday: birthday ? parseISODate(birthday) : null,
  };
}

export async function createEmployee(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const data = employeeFields(fd);
  if (!data.name || !/^\S+@\S+\.\S+$/.test(data.email)) return fail("Name and a valid email are required.");
  if (await db.user.findUnique({ where: { email: data.email } })) return fail("An employee with this email already exists.");
  const password = str(fd, "password") || randomBytes(6).toString("base64url");
  if (password.length < 8 && str(fd, "password")) return fail("Temporary password must be at least 8 characters.");
  const joined = str(fd, "joinedAt");

  const user = await db.user.create({
    data: { ...data, passwordHash: await bcrypt.hash(password, 10), joinedAt: joined ? parseISODate(joined) : new Date() },
  });
  await ensureBalances(user.id);

  // Apply any custom starting quotas from the form (quota_<leaveTypeId>)
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("quota_") || value === "") continue;
    await db.leaveBalance.updateMany({
      where: { userId: user.id, leaveTypeId: key.slice(6), year: currentYear() },
      data: { allocated: Number(value) },
    });
  }
  if (bool(fd, "sendWelcome")) await onEmployeeCreated(user.id, password);
  refresh();
  return ok(`${user.name} has been added${bool(fd, "sendWelcome") ? " and emailed their sign-in details" : ""}.`);
}

export async function updateEmployee(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const data = employeeFields(fd);
  if (!data.name || !/^\S+@\S+\.\S+$/.test(data.email)) return fail("Name and a valid email are required.");
  const clash = await db.user.findFirst({ where: { email: data.email, id: { not: id } } });
  if (clash) return fail("Another employee already uses this email.");
  if (id === admin.id && data.role !== "ADMIN") return fail("You can't remove your own admin access.");
  await db.user.update({ where: { id }, data });
  refresh();
  return ok("Profile saved.");
}

export async function setEmployeeStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  if (id === admin.id) return fail("You can't deactivate your own account.");
  const user = await db.user.update({ where: { id }, data: { status } });
  refresh();
  return ok(`${user.name} is now ${status === "ACTIVE" ? "active" : "deactivated and can no longer sign in"}.`);
}

export async function deleteEmployee(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  if (id === admin.id) return fail("You can't delete your own account.");
  const user = await db.user.findUnique({ where: { id }, include: { requests: { where: { googleEventId: { not: null } } } } });
  if (!user) return fail("Employee not found.");
  const { deleteCalendarEvent } = await import("@/lib/calendar");
  for (const r of user.requests) await deleteCalendarEvent(r.googleEventId);
  await db.leaveRequest.updateMany({ where: { reviewedById: id }, data: { reviewedById: null } });
  await db.leaveRequest.updateMany({ where: { recordedById: id }, data: { recordedById: null } });
  await db.user.delete({ where: { id } });
  refresh();
  return ok(`${user.name} and their leave history were permanently removed.`);
}

export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const password = str(fd, "password");
  if (password.length < 8) return fail("Password must be at least 8 characters.");
  const user = await db.user.update({ where: { id: str(fd, "id") }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  if (bool(fd, "sendEmail")) await onEmployeeCreated(user.id, password);
  return ok(`Password reset for ${user.name}.`);
}

export async function updateQuotas(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const userId = str(fd, "userId");
  const year = Number(str(fd, "year")) || currentYear();
  await ensureBalances(userId, year);
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("quota_") || value === "") continue;
    const allocated = Number(value);
    if (!Number.isFinite(allocated) || allocated < 0) return fail("Quotas must be zero or more.");
    await db.leaveBalance.upsert({
      where: { userId_leaveTypeId_year: { userId, leaveTypeId: key.slice(6), year } },
      update: { allocated },
      create: { userId, leaveTypeId: key.slice(6), year, allocated },
    });
  }
  refresh();
  return ok(`Quotas for ${year} updated.`);
}

// ── Leave types & policies ──────────────────────────────

function leaveTypeFields(fd: FormData) {
  return {
    name: str(fd, "name"),
    description: str(fd, "description") || null,
    icon: str(fd, "icon") || "event",
    accent: str(fd, "accent") === "gold" ? "gold" : "ink",
    defaultQuota: num(fd, "defaultQuota") ?? 0,
    deductsQuota: bool(fd, "deductsQuota"),
    allowPastDates: bool(fd, "allowPastDates"),
    birthdayMonthOnly: bool(fd, "birthdayMonthOnly"),
    allowHalfDay: bool(fd, "allowHalfDay"),
    maxDaysPerRequest: num(fd, "maxDaysPerRequest") || null,
    minNoticeDays: num(fd, "minNoticeDays") ?? 0,
    active: bool(fd, "active"),
  };
}

export async function saveLeaveType(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  const data = leaveTypeFields(fd);
  if (!data.name) return fail("Leave type name is required.");
  if (id) {
    await db.leaveType.update({ where: { id }, data });
  } else {
    const code = data.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (await db.leaveType.findUnique({ where: { code } })) return fail("A leave type with this name already exists.");
    const sortOrder = (await db.leaveType.count()) + 1;
    await db.leaveType.create({ data: { ...data, code, sortOrder } });
  }
  // Sync default quota into this year's balances when asked
  if (bool(fd, "applyToAll") && data.deductsQuota) {
    const type = await db.leaveType.findFirstOrThrow({ where: id ? { id } : { name: data.name } });
    const users = await db.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
    const year = currentYear();
    for (const u of users) {
      await db.leaveBalance.upsert({
        where: { userId_leaveTypeId_year: { userId: u.id, leaveTypeId: type.id, year } },
        update: { allocated: data.defaultQuota },
        create: { userId: u.id, leaveTypeId: type.id, year, allocated: data.defaultQuota },
      });
    }
  }
  refresh();
  return ok(id ? `${data.name} policy updated.` : `${data.name} created.`);
}

// ── Holidays ────────────────────────────────────────────

export async function createHoliday(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = str(fd, "name");
  const start = str(fd, "startDate");
  const end = str(fd, "endDate") || start;
  if (!name || !start) return fail("Holiday name and date are required.");
  if (end < start) return fail("End date cannot be before the start date.");
  const kind = str(fd, "kind") === "OPTIONAL" ? "OPTIONAL" : "GAZETTED";
  const holiday = await db.holiday.create({
    data: { name, startDate: parseISODate(start), endDate: parseISODate(end), kind, active: kind === "GAZETTED" },
  });
  if (bool(fd, "addToCalendar")) {
    const { createCalendarEvent } = await import("@/lib/calendar");
    const id = await createCalendarEvent({ summary: `🎉 ${name} — Office closed`, start: holiday.startDate, end: holiday.endDate });
    if (id) await db.holiday.update({ where: { id: holiday.id }, data: { googleEventId: id } });
  }
  refresh();
  return ok(`${name} added to the holiday calendar.`);
}

export async function toggleHoliday(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const h = await db.holiday.findUnique({ where: { id: str(fd, "id") } });
  if (!h) return fail("Holiday not found.");
  await db.holiday.update({ where: { id: h.id }, data: { active: !h.active } });
  refresh();
  return ok(`${h.name} is now ${h.active ? "not exempted" : "exempted"} from leave quotas.`);
}

export async function deleteHoliday(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const h = await db.holiday.findUnique({ where: { id: str(fd, "id") } });
  if (!h) return fail("Holiday not found.");
  const { deleteCalendarEvent } = await import("@/lib/calendar");
  await deleteCalendarEvent(h.googleEventId);
  await db.holiday.delete({ where: { id: h.id } });
  refresh();
  return ok(`${h.name} removed.`);
}
