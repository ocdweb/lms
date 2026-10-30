import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Leave Policy" };

export default async function PolicyPage() {
  await requireUser();
  const types = await db.leaveType.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <span className="eyebrow">Policy</span>
        <h1 className="text-headline-lg-mobile sm:text-headline-lg">Leave Types &amp; Entitlements</h1>
        <p className="text-body-md text-on-surface-variant max-w-2xl">
          Working days are counted Monday–Friday. Weekends and public holidays are never deducted from your balance. Balances reset each calendar year.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((t) => (
          <article key={t.id} className="card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center">
                <Icon name={t.icon} className="text-xl" />
              </span>
              <div>
                <h2 className="text-headline-sm">{t.name}</h2>
                <p className="text-label-sm text-secondary">{t.deductsQuota ? `${t.defaultQuota} days per year` : "No quota deduction"}</p>
              </div>
            </div>
            {t.description && <p className="text-body-sm text-on-surface-variant">{t.description}</p>}
            <ul className="flex flex-wrap gap-1.5">
              {t.allowPastDates && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">Can apply after the date</li>}
              {t.minNoticeDays > 0 && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">{t.minNoticeDays} days&apos; notice</li>}
              {t.maxDaysPerRequest && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">Max {t.maxDaysPerRequest} days / request</li>}
              {t.birthdayMonthOnly && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">Birthday month only</li>}
              {t.allowHalfDay && <li className="px-2 py-0.5 rounded bg-surface-container text-label-sm">Half days allowed</li>}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
