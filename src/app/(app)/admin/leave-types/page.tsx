import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { LeaveTypeDialog } from "./LeaveTypeForm";

export const metadata: Metadata = { title: "Leave Types & Policies" };

export default async function LeaveTypesPage() {
  await requireAdmin();
  const types = await db.leaveType.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { requests: true } } } });
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="eyebrow">Configuration</span>
          <h1 className="text-headline-lg-mobile sm:text-headline-lg">Leave Types &amp; Policies</h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl">
            Default quotas apply to new employees and each new leave year. Adjust an individual&apos;s allocation from the employee directory.
          </p>
        </div>
        <LeaveTypeDialog />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {types.map((t) => (
          <article key={t.id} className={`card p-6 flex flex-col justify-between gap-5 ${t.active ? "" : "opacity-60"}`}>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.accent === "gold" ? "bg-secondary-container/40 text-secondary" : "bg-surface-container-low"}`}>
                    <Icon name={t.icon} className="text-xl" />
                  </span>
                  <div>
                    <h2 className="text-headline-sm">{t.name}</h2>
                    <p className="text-label-sm text-secondary">{t.deductsQuota ? `${t.defaultQuota} days / year` : "No quota deduction"}</p>
                  </div>
                </div>
                {!t.active && <span className="px-2 py-0.5 rounded-full bg-surface-container text-label-sm">Inactive</span>}
              </div>
              {t.description && <p className="text-body-sm text-on-surface-variant">{t.description}</p>}
              <ul className="flex flex-wrap gap-1.5">
                {t.allowPastDates && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">Post-dated OK</li>}
                {t.minNoticeDays > 0 && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">{t.minNoticeDays}d notice</li>}
                {t.maxDaysPerRequest && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">Max {t.maxDaysPerRequest}d</li>}
                {t.birthdayMonthOnly && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">Birthday month</li>}
                {t.allowHalfDay && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">Half days</li>}
              </ul>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label-sm text-on-surface-variant">{t._count.requests} requests</span>
              <LeaveTypeDialog
                type={{
                  id: t.id,
                  name: t.name,
                  description: t.description ?? "",
                  icon: t.icon,
                  accent: t.accent,
                  defaultQuota: t.defaultQuota,
                  deductsQuota: t.deductsQuota,
                  allowPastDates: t.allowPastDates,
                  birthdayMonthOnly: t.birthdayMonthOnly,
                  allowHalfDay: t.allowHalfDay,
                  maxDaysPerRequest: t.maxDaysPerRequest,
                  minNoticeDays: t.minNoticeDays,
                  active: t.active,
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
