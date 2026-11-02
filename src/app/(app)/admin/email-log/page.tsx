import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { syncCalendar } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { TIMEZONE, calendarConfigured, emailConfigured } from "@/lib/config";
import { formatDateTime } from "@/lib/dates";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Email Log" };

const TONE: Record<string, string> = {
  SENT: "bg-sage-tint text-sage",
  LOGGED: "bg-secondary-container/40 text-on-secondary-container",
  FAILED: "bg-[#fbf2f1] text-[#9e3f36]",
};

/** Plain-English fix for the SMTP errors people usually hit with Gmail / Google Workspace. */
function smtpHint(error: string) {
  if (/530|Authentication Required/i.test(error))
    return "The server wasn't sent a login at all — SMTP_USER is empty or not set for this environment. Set SMTP_USER and SMTP_PASS, then redeploy.";
  if (/535|534|Username and Password not accepted|Invalid login|BadCredentials/i.test(error))
    return "Gmail rejected the login. SMTP_USER must be the full mailbox address and SMTP_PASS a 16-character App Password (2-Step Verification on), not the normal password.";
  if (/wrong version number|ssl3_get_record|EPROTO/i.test(error))
    return "Port and SSL don't match. Use SMTP_PORT=587 with SMTP_SECURE=false, or SMTP_PORT=465 with SMTP_SECURE=true.";
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|Greeting never received|Connection timeout/i.test(error))
    return "Couldn't reach the mail server. Check SMTP_HOST (smtp.gmail.com) and SMTP_PORT (587).";
  if (/Missing credentials|EAUTH/i.test(error)) return "SMTP_USER or SMTP_PASS is missing.";
  return null;
}

export default async function EmailLogPage() {
  await requireAdmin();
  const [logs, missingEvents] = await Promise.all([
    db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    calendarConfigured() ? db.leaveRequest.count({ where: { status: "APPROVED", googleEventId: null } }) : 0,
  ]);
  const integrations: { name: string; icon: string; on: boolean; detail: string; extra?: ReactNode }[] = [
    {
      name: "Email (SMTP)",
      icon: "mail",
      on: emailConfigured(),
      detail: emailConfigured() ? `Sending via ${process.env.SMTP_HOST}` : "Not configured — emails are written to this log instead of being sent. Set the SMTP_* environment variables.",
    },
    {
      name: "Google Calendar",
      icon: "calendar_month",
      on: calendarConfigured(),
      detail: calendarConfigured() ? `Approved leave is added to ${process.env.GOOGLE_CALENDAR_ID}` : "Not configured — set GOOGLE_CALENDAR_ID and the service-account credentials in the environment variables.",
      extra: calendarConfigured() && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className={`text-body-sm ${missingEvents ? "text-secondary" : "text-on-surface-variant"}`}>
            {missingEvents
              ? `${missingEvents} approved ${missingEvents === 1 ? "leave isn't" : "leaves aren't"} on the calendar yet.`
              : "All approved leave is on the calendar."}
          </span>
          {missingEvents > 0 && (
            <ActionForm action={syncCalendar}>
              <SubmitButton pendingText="Syncing…" className="btn-secondary px-3 py-1.5 text-label-md">
                <Icon name="sync" className="text-base" /> Sync to Google Calendar
              </SubmitButton>
            </ActionForm>
          )}
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="eyebrow">Notifications</span>
        <h1 className="text-headline-lg-mobile sm:text-headline-lg">Email Log &amp; Integrations</h1>
        <p className="text-body-md text-on-surface-variant">Every notification email the system sends, plus the status of connected services.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((i) => (
          <div key={i.name} className="card p-5 flex items-start gap-4">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${i.on ? "bg-sage-tint text-sage" : "bg-surface-container text-on-surface-variant"}`}>
              <Icon name={i.icon} />
            </span>
            <div>
              <div className="text-label-lg flex items-center gap-2">
                {i.name}
                <span className={`px-2 py-0.5 rounded-full text-label-sm ${i.on ? "bg-sage-tint text-sage" : "bg-surface-container text-on-surface-variant"}`}>{i.on ? "Connected" : "Off"}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-1 break-all">{i.detail}</p>
              {i.extra}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px] text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">When</th>
                <th className="py-4 px-4">To</th>
                <th className="py-4 px-4">Subject</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-on-surface-variant">No emails yet.</td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-surface-container-low">
                  <td className="py-3 px-6 whitespace-nowrap text-on-surface-variant">{formatDateTime(l.createdAt, TIMEZONE)}</td>
                  <td className="py-3 px-4">{l.to}</td>
                  <td className="py-3 px-4">
                    {l.subject}
                    {l.error && (
                      <div className="mt-1 text-[#9e3f36] space-y-0.5">
                        {smtpHint(l.error) && <p className="font-semibold">{smtpHint(l.error)}</p>}
                        <p className="text-on-surface-variant break-all">{l.error}</p>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-6">
                    <span className={`px-2.5 py-0.5 rounded-full text-label-sm ${TONE[l.status]}`} title={l.error ?? undefined}>
                      {l.status === "LOGGED" ? "Logged (dev)" : l.status === "SENT" ? "Sent" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
