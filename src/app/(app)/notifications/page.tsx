import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TIMEZONE } from "@/lib/config";
import { formatDateTime } from "@/lib/dates";
import { markNotificationsRead } from "@/app/actions/leave";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="eyebrow">Inbox</span>
          <h1 className="text-headline-lg-mobile sm:text-headline-lg">Notifications</h1>
          <p className="text-body-md text-on-surface-variant">Status updates on leave requests. Each of these is also sent to you by email.</p>
        </div>
        {unread > 0 && (
          <ActionForm action={markNotificationsRead}>
            <SubmitButton className="btn-secondary">
              <Icon name="done_all" className="text-base" /> Mark all read
            </SubmitButton>
          </ActionForm>
        )}
      </div>
      <div className="card divide-y divide-surface-container overflow-hidden">
        {items.length === 0 && (
          <div className="p-10 text-center text-on-surface-variant text-body-sm">
            <Icon name="notifications_off" className="text-3xl text-outline block mb-2" />
            You&apos;re all caught up.
          </div>
        )}
        {items.map((n) => {
          const tone = /approved|recorded/i.test(n.title) ? "check_circle" : /rejected|removed/i.test(n.title) ? "cancel" : "mail";
          const body = (
            <div className={`flex items-start gap-4 p-5 ${n.read ? "" : "bg-secondary-container/10"}`}>
              <span className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center shrink-0 text-secondary">
                <Icon name={tone} className="text-lg" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-label-lg text-on-surface">{n.title}</span>
                  <span className="text-label-sm text-on-surface-variant whitespace-nowrap">{formatDateTime(n.createdAt, TIMEZONE)}</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-0.5">{n.body}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0" aria-label="Unread" />}
            </div>
          );
          return n.link ? (
            <Link key={n.id} href={n.link} className="block hover:bg-surface-container-low transition-colors">
              {body}
            </Link>
          ) : (
            <div key={n.id}>{body}</div>
          );
        })}
      </div>
    </div>
  );
}
