import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TIMEZONE } from "@/lib/config";
import { formatDateTime, formatDays, formatRange, toISODate } from "@/lib/dates";
import { emailNote } from "@/lib/present";
import { today } from "@/lib/leave";
import { cancelLeave } from "@/app/actions/leave";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata: Metadata = { title: "Leave details" };

export default async function LeaveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const r = await db.leaveRequest.findUnique({ where: { id }, include: { leaveType: true, user: true, reviewedBy: true, recordedBy: true } });
  if (!r || (r.userId !== user.id && user.role !== "ADMIN")) notFound();

  const rows: [string, string][] = [
    ["Employee", r.user.name],
    ["Leave type", r.leaveType.name],
    ["Dates", formatRange(r.startDate, r.endDate)],
    ["Duration", r.duration === "FULL" ? "Full day(s)" : r.duration === "HALF_AM" ? "Half day — 1st half" : "Half day — 2nd half"],
    ["Working days", formatDays(r.days)],
    ["Submitted", `${formatDateTime(r.createdAt, TIMEZONE)}${r.recordedBy ? ` — recorded by ${r.recordedBy.name}` : ""}`],
    ["Handover contact", r.handoverContact || "—"],
    ["Emergency contact", r.emergencyContact || "—"],
  ];
  const timeline = [
    { icon: "edit_note", label: r.recordedBy ? "Recorded by Admin" : "Request submitted", when: formatDateTime(r.createdAt, TIMEZONE), done: true },
    { icon: "outgoing_mail", label: "Admin notified by email", when: r.adminEmailSent ? "Sent" : "Pending", done: r.adminEmailSent },
    {
      icon: r.status === "REJECTED" ? "cancel" : r.status === "CANCELLED" ? "block" : "check_circle",
      label: r.status === "PENDING" ? "Awaiting decision" : r.status === "CANCELLED" ? "Cancelled" : `${r.status === "APPROVED" ? "Approved" : "Rejected"}${r.reviewedBy ? ` by ${r.reviewedBy.name}` : ""}`,
      when: r.reviewedAt ? formatDateTime(r.reviewedAt, TIMEZONE) : "—",
      done: r.status !== "PENDING",
    },
    { icon: "mark_email_read", label: "Employee notified by email", when: r.employeeEmailSent ? "Sent" : "—", done: r.employeeEmailSent },
    ...(r.status === "APPROVED" ? [{ icon: "calendar_month", label: "Added to Google Calendar", when: r.googleEventId ? "Synced" : "Not connected", done: Boolean(r.googleEventId) }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href={user.role === "ADMIN" && r.userId !== user.id ? "/admin/requests" : "/dashboard"} className="btn-ghost -ml-3">
        <Icon name="arrow_back" className="text-base" /> Back
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="eyebrow">Leave Request</span>
          <h1 className="text-headline-lg-mobile sm:text-headline-lg flex items-center gap-3 flex-wrap">
            {r.leaveType.name} <StatusBadge status={r.status} completed={r.status === "APPROVED" && toISODate(r.endDate) < today()} />
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {formatRange(r.startDate, r.endDate)} • {formatDays(r.days)} • {emailNote(r)}
          </p>
        </div>
        {r.status === "PENDING" && r.userId === user.id && (
          <ActionForm action={cancelLeave} confirm="Withdraw this leave request?" redirectTo="/dashboard">
            <input type="hidden" name="id" value={r.id} />
            <SubmitButton className="btn-danger">Withdraw request</SubmitButton>
          </ActionForm>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <section className="card p-6 md:col-span-3 space-y-4">
          <h2 className="text-headline-sm">Details</h2>
          <dl className="divide-y divide-surface-container">
            {rows.map(([k, v]) => (
              <div key={k} className="py-3 grid grid-cols-5 gap-3">
                <dt className="col-span-2 text-body-sm text-on-surface-variant">{k}</dt>
                <dd className="col-span-3 text-label-lg text-on-surface">{v}</dd>
              </div>
            ))}
          </dl>
          {r.reason && (
            <div className="p-4 rounded-lg bg-surface-container-low">
              <div className="text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">Reason</div>
              <p className="text-body-md italic">“{r.reason}”</p>
            </div>
          )}
          {r.adminComment && (
            <div className="p-4 rounded-lg bg-secondary-container/30">
              <div className="text-label-sm uppercase tracking-wider text-on-secondary-container mb-1">Admin note</div>
              <p className="text-body-md">{r.adminComment}</p>
            </div>
          )}
        </section>
        <section className="card p-6 md:col-span-2 space-y-4">
          <h2 className="text-headline-sm">Timeline</h2>
          <ol className="space-y-4">
            {timeline.map((s) => (
              <li key={s.label} className="flex items-start gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-primary text-secondary-fixed" : "bg-surface-container text-on-surface-variant"}`}>
                  <Icon name={s.icon} className="text-base" />
                </span>
                <div>
                  <div className="text-label-lg text-on-surface">{s.label}</div>
                  <div className="text-body-sm text-on-surface-variant">{s.when}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
