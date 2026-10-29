"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseISODate, type Duration } from "@/lib/dates";
import { validateLeave } from "@/lib/leave";
import { onLeaveCancelled, onLeaveSubmitted } from "@/lib/workflow";
import { fail, ok, type ActionState } from "@/lib/action-state";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const DURATIONS: Duration[] = ["FULL", "HALF_AM", "HALF_PM"];

export async function applyForLeave(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const duration = DURATIONS.includes(str(fd, "duration") as Duration) ? (str(fd, "duration") as Duration) : "FULL";
  const start = str(fd, "startDate");
  const end = str(fd, "endDate") || start;
  const reason = str(fd, "reason");
  if (reason.length < 3) return fail("Please add a short reason for your leave.");

  const v = await validateLeave(user, { leaveTypeId: str(fd, "leaveTypeId"), start, end, duration });
  if ("error" in v) return fail(v.error!);

  const request = await db.leaveRequest.create({
    data: {
      userId: user.id,
      leaveTypeId: v.type.id,
      startDate: parseISODate(start),
      endDate: parseISODate(end),
      duration: v.duration,
      days: v.days,
      reason,
      handoverContact: str(fd, "handoverContact") || null,
      emergencyContact: str(fd, "emergencyContact") || null,
      retrospective: v.retrospective,
    },
  });
  await onLeaveSubmitted(request.id);
  revalidatePath("/", "layout");
  return ok(`Your ${v.type.name} request was submitted and the Admin has been notified.`);
}

export async function cancelLeave(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await db.leaveRequest.findUnique({ where: { id: str(fd, "id") } });
  if (!r || r.userId !== user.id) return fail("Request not found.");
  if (r.status !== "PENDING") return fail("Only pending requests can be withdrawn. Contact your Admin to change approved leave.");
  await db.leaveRequest.update({ where: { id: r.id }, data: { status: "CANCELLED", adminComment: "Withdrawn by employee" } });
  await onLeaveCancelled(r.id, "EMPLOYEE");
  revalidatePath("/", "layout");
  return ok("Your request was withdrawn.");
}

export async function markNotificationsRead(_prev: ActionState, _fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/", "layout");
  return ok("All notifications marked as read.");
}
