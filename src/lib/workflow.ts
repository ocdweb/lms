import "server-only";
import { db } from "./db";
import { emailLayout, sendMail } from "./email";
import { createCalendarEvent, deleteCalendarEvent } from "./calendar";
import { formatDays, formatRange } from "./dates";

// Side effects for leave lifecycle events: in-portal notifications, emails and Google Calendar sync.
// Every step is best-effort so a mail/calendar outage never blocks the leave record itself.

const loadRequest = (id: string) =>
  db.leaveRequest.findUniqueOrThrow({ where: { id }, include: { user: true, leaveType: true, reviewedBy: true } });

type FullRequest = Awaited<ReturnType<typeof loadRequest>>;

const durationLabel = (r: FullRequest) =>
  r.duration === "HALF_AM" ? " (1st half)" : r.duration === "HALF_PM" ? " (2nd half)" : "";

async function adminRecipients() {
  const fromEnv = (process.env.ADMIN_NOTIFY_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
  const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true, email: true } });
  return { emails: fromEnv.length ? fromEnv : admins.map((a) => a.email), adminIds: admins.map((a) => a.id) };
}

async function syncToCalendar(r: FullRequest) {
  if (r.googleEventId) return;
  const eventId = await createCalendarEvent({
    summary: `${r.user.name} — ${r.leaveType.name}${durationLabel(r)}`,
    description: [`${formatDays(r.days)} • ${r.user.department ?? ""}`, r.handoverContact && `Handover: ${r.handoverContact}`]
      .filter(Boolean)
      .join("\n"),
    start: r.startDate,
    end: r.endDate,
  });
  if (eventId) await db.leaveRequest.update({ where: { id: r.id }, data: { googleEventId: eventId } });
}

export async function onLeaveSubmitted(requestId: string) {
  const r = await loadRequest(requestId);
  const { emails, adminIds } = await adminRecipients();
  const when = `${formatRange(r.startDate, r.endDate)}${durationLabel(r)}`;

  await db.notification.createMany({
    data: adminIds.map((userId) => ({
      userId,
      title: `New ${r.leaveType.name} request`,
      body: `${r.user.name} requested ${formatDays(r.days)} • ${when}`,
      link: "/admin#pending",
    })),
  });

  const sent = await sendMail(
    emails,
    `Leave request: ${r.user.name} — ${r.leaveType.name} (${formatDays(r.days)})`,
    emailLayout({
      eyebrow: "Awaiting your review",
      title: `${r.user.name} has requested ${r.leaveType.name}`,
      intro: r.retrospective
        ? "This leave was logged after the fact (retrospective). Please review and record a decision in the Leave Portal."
        : "A new leave request has been submitted and is waiting for your approval in the Leave Portal.",
      rows: [
        ["Employee", `${r.user.name}${r.user.department ? ` • ${r.user.department}` : ""}`],
        ["Leave type", r.leaveType.name],
        ["Dates", when],
        ["Working days", formatDays(r.days)],
        ...(r.handoverContact ? ([["Handover", r.handoverContact]] as [string, string][]) : []),
      ],
      note: r.reason ?? undefined,
      cta: { label: "Review request", path: "/admin#pending" },
    }),
  );
  if (sent) await db.leaveRequest.update({ where: { id: r.id }, data: { adminEmailSent: true } });
}

export async function onLeaveDecided(requestId: string) {
  const r = await loadRequest(requestId);
  const approved = r.status === "APPROVED";
  const when = `${formatRange(r.startDate, r.endDate)}${durationLabel(r)}`;

  await db.notification.create({
    data: {
      userId: r.userId,
      title: `${r.leaveType.name} ${approved ? "approved" : "rejected"}`,
      body: `${when} • ${formatDays(r.days)}${r.adminComment ? ` — “${r.adminComment}”` : ""}`,
      link: `/leaves/${r.id}`,
    },
  });

  if (approved) await syncToCalendar(r);
  else await deleteCalendarEvent(r.googleEventId);

  const sent = await sendMail(
    r.user.email,
    `Your ${r.leaveType.name} request was ${approved ? "approved" : "rejected"}`,
    emailLayout({
      eyebrow: approved ? "Request approved" : "Request rejected",
      title: approved ? `Enjoy your time off, ${r.user.name.split(" ")[0]}.` : `Your leave request wasn't approved`,
      intro: approved
        ? "Your leave has been approved and added to the company calendar. Your balance in the Leave Portal has been updated."
        : "Your leave request has been reviewed and was not approved. No days were deducted from your balance.",
      rows: [
        ["Leave type", r.leaveType.name],
        ["Dates", when],
        ["Working days", formatDays(r.days)],
        ["Reviewed by", r.reviewedBy?.name ?? "Admin"],
      ],
      note: r.adminComment ?? undefined,
      cta: { label: "Open Leave Portal", path: `/leaves/${r.id}` },
    }),
  );
  if (sent) await db.leaveRequest.update({ where: { id: r.id }, data: { employeeEmailSent: true } });
}

/** Admin logged leave on the employee's behalf (already approved). */
export async function onLeaveRecorded(requestId: string) {
  const r = await loadRequest(requestId);
  const when = `${formatRange(r.startDate, r.endDate)}${durationLabel(r)}`;
  await db.notification.create({
    data: { userId: r.userId, title: `${r.leaveType.name} recorded by Admin`, body: `${when} • ${formatDays(r.days)}`, link: `/leaves/${r.id}` },
  });
  await syncToCalendar(r);
  const sent = await sendMail(
    r.user.email,
    `${r.leaveType.name} recorded on your profile`,
    emailLayout({
      eyebrow: "Leave recorded",
      title: `${r.leaveType.name} has been added to your record`,
      intro: "An administrator recorded the following leave on your behalf. Your balance has been updated accordingly.",
      rows: [
        ["Leave type", r.leaveType.name],
        ["Dates", when],
        ["Working days", formatDays(r.days)],
      ],
      note: r.adminComment ?? r.reason ?? undefined,
      cta: { label: "View my leaves", path: "/dashboard" },
    }),
  );
  if (sent) await db.leaveRequest.update({ where: { id: r.id }, data: { employeeEmailSent: true } });
}

/** Leave withdrawn by the employee or removed by an admin. */
export async function onLeaveCancelled(requestId: string, by: "EMPLOYEE" | "ADMIN") {
  const r = await loadRequest(requestId);
  await deleteCalendarEvent(r.googleEventId);
  if (r.googleEventId) await db.leaveRequest.update({ where: { id: r.id }, data: { googleEventId: null } });
  const when = formatRange(r.startDate, r.endDate);

  if (by === "EMPLOYEE") {
    const { emails, adminIds } = await adminRecipients();
    await db.notification.createMany({
      data: adminIds.map((userId) => ({ userId, title: "Leave request withdrawn", body: `${r.user.name} withdrew ${r.leaveType.name} • ${when}`, link: "/admin/requests" })),
    });
    await sendMail(
      emails,
      `Withdrawn: ${r.user.name} — ${r.leaveType.name}`,
      emailLayout({
        eyebrow: "Request withdrawn",
        title: `${r.user.name} withdrew a leave request`,
        intro: "No action is needed. The request has been cancelled and any calendar entry removed.",
        rows: [["Leave type", r.leaveType.name], ["Dates", when], ["Working days", formatDays(r.days)]],
      }),
    );
  } else {
    await db.notification.create({
      data: { userId: r.userId, title: `${r.leaveType.name} removed by Admin`, body: `${when} • ${formatDays(r.days)} returned to your balance`, link: `/leaves/${r.id}` },
    });
    await sendMail(
      r.user.email,
      `${r.leaveType.name} removed from your record`,
      emailLayout({
        eyebrow: "Leave removed",
        title: "A leave entry was removed by an administrator",
        intro: "The days below have been returned to your balance and the calendar entry removed.",
        rows: [["Leave type", r.leaveType.name], ["Dates", when], ["Working days", formatDays(r.days)]],
        note: r.adminComment ?? undefined,
        cta: { label: "Open Leave Portal", path: "/dashboard" },
      }),
    );
  }
}

export async function onEmployeeCreated(userId: string, tempPassword: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await sendMail(
    u.email,
    "Your Legacy Media Leave Portal account",
    emailLayout({
      eyebrow: "Welcome aboard",
      title: `Welcome, ${u.name.split(" ")[0]}`,
      intro: "An account has been created for you on the Legacy Media Leave Portal. Sign in with the details below and change your password from your profile.",
      rows: [["Email", u.email], ["Temporary password", tempPassword]],
      cta: { label: "Sign in", path: "/login" },
    }),
  );
}
