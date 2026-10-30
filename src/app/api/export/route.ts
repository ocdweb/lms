import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseISODate, toISODate } from "@/lib/dates";
import { toCsv } from "@/lib/present";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const all = sp.get("scope") === "all" && user.role === "ADMIN";

  const where: Prisma.LeaveRequestWhereInput = all
    ? {
        userId: sp.get("userId") || undefined,
        status: sp.get("status") || undefined,
        leaveTypeId: sp.get("type") || undefined,
        user: sp.get("q") ? { OR: [{ name: { contains: sp.get("q")!, mode: "insensitive" } }, { department: { contains: sp.get("q")!, mode: "insensitive" } }] } : undefined,
        endDate: sp.get("from") ? { gte: parseISODate(sp.get("from")!) } : undefined,
        startDate: sp.get("to") ? { lte: parseISODate(sp.get("to")!) } : undefined,
      }
    : { userId: user.id };

  const rows = await db.leaveRequest.findMany({ where, include: { user: true, leaveType: true, reviewedBy: true }, orderBy: { startDate: "desc" } });
  const csv = toCsv([
    ["Employee", "Email", "Department", "Leave Type", "Start", "End", "Duration", "Days", "Status", "Reason", "Admin Note", "Reviewed By", "Submitted"],
    ...rows.map((r) => [
      r.user.name,
      r.user.email,
      r.user.department,
      r.leaveType.name,
      toISODate(r.startDate),
      toISODate(r.endDate),
      r.duration,
      r.days,
      r.status,
      r.reason,
      r.adminComment,
      r.reviewedBy?.name,
      r.createdAt.toISOString(),
    ]),
  ]);
  const name = all ? "legacy-media-leave-summary" : `my-leave-${user.name.toLowerCase().replace(/\s+/g, "-")}`;
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}-${toISODate(new Date())}.csv"` },
  });
}
