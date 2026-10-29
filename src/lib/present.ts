import type { LeaveRequest, LeaveType } from "@prisma/client";
import type { LeaveRowData } from "@/components/LeaveApplications";
import { formatDate, formatDays, formatMonthDay, formatRange, toISODate } from "./dates";

type Req = LeaveRequest & { leaveType: LeaveType };

export function emailNote(r: LeaveRequest) {
  if (r.status === "PENDING") return r.adminEmailSent ? "Admin alert dispatched" : "Awaiting admin alert";
  if (r.status === "CANCELLED") return "Withdrawn";
  return r.employeeEmailSent ? "Email confirmation sent" : "Decision recorded";
}

export function toLeaveRow(r: Req, today: string): LeaveRowData {
  const end = toISODate(r.endDate);
  const start = toISODate(r.startDate);
  const durationNote = r.duration === "HALF_AM" ? " (1st half)" : r.duration === "HALF_PM" ? " (2nd half)" : "";
  return {
    id: r.id,
    typeName: r.leaveType.name,
    icon: r.leaveType.icon,
    status: r.status,
    range: formatRange(r.startDate, r.endDate) + durationNote,
    days: formatDays(r.days),
    appliedOn: formatMonthDay(r.createdAt),
    past: end < today,
    upcoming: r.status === "APPROVED" && start >= today,
    retrospective: r.retrospective,
    emailNote: emailNote(r),
    adminComment: r.adminComment,
    recordedByAdmin: Boolean(r.recordedById),
  };
}

export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export { formatDate };
