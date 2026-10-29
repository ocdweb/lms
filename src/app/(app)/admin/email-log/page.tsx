import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
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

export default async function EmailLogPage() {
  await requireAdmin();
  const logs = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const integrations = [
    {
      name: "Email (SMTP)",
      icon: "mail",
      on: emailConfigured(),
      detail: emailConfigured() ? `Sending via ${process.env.SMTP_HOST}` : "Not configured — emails are written to this log instead of being sent. Set SMTP_* in .env.",
    },
    {
      name: "Google Calendar",
      icon: "calendar_month",
      on: calendarConfigured(),
      detail: calendarConfigured() ? `Approved leave is added to ${process.env.GOOGLE_CALENDAR_ID}` : "Not configured — set GOOGLE_CALENDAR_ID and the service-account credentials in .env.",
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
                  <td className="py-3 px-4">{l.subject}</td>
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
