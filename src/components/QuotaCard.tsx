import type { BalanceRow } from "@/lib/leave";
import { Icon } from "./Icon";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function QuotaCard({ row, birthday }: { row: BalanceRow; birthday?: Date | null }) {
  const { type, allocated, used, pending, remaining } = row;

  if (!type.deductsQuota) {
    return (
      <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col justify-between shadow-card">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">{type.name}</span>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary">
              <Icon name={type.icon} className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-numerical-display text-on-surface font-semibold">{fmt(used)}</span>
            <span className="text-body-sm text-on-surface-variant">{used === 1 ? "day" : "days"} taken</span>
          </div>
          <p className="text-label-sm text-secondary">Zero quota deduction applied</p>
        </div>
        <div className="mt-4 pt-4 flex items-center justify-between text-on-surface-variant text-label-sm">
          <span>{pending ? `${fmt(pending)} pending` : "Granted on approval"}</span>
          <span>No limit</span>
        </div>
      </div>
    );
  }

  const pct = allocated > 0 ? Math.round((remaining / allocated) * 1000) / 10 : 0;
  const isBirthday = type.birthdayMonthOnly;
  return (
    <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-label-md text-on-surface-variant uppercase tracking-wider">{type.name}</span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type.accent === "gold" && isBirthday ? "bg-secondary-container/40 text-secondary" : "bg-surface-container-low text-on-surface"}`}>
            <Icon name={type.icon} className="text-base" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-numerical-display text-on-surface font-semibold">{fmt(remaining)}</span>
            <span className="text-body-sm text-on-surface-variant">{remaining === 1 ? "day" : "days"} left</span>
          </div>
          {isBirthday ? (
            <span className="text-label-sm text-secondary">
              {birthday ? `Active in Birthday Month (${MONTHS[birthday.getUTCMonth()]})` : "Add your birthday to your profile"}
            </span>
          ) : (
            <span className="text-label-sm text-on-surface-variant">of {fmt(allocated)} total allocated</span>
          )}
        </div>
        {type.allowPastDates && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant text-label-sm">
            <Icon name="verified" className="text-[14px] text-secondary" />
            Can apply post-recovery
          </div>
        )}
        {pending > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container/30 text-on-secondary-container text-label-sm ml-1">
            <Icon name="schedule" className="text-[14px]" />
            {fmt(pending)} pending approval
          </div>
        )}
      </div>
      <div className="mt-6 pt-4 space-y-2">
        <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${type.accent === "gold" ? "bg-secondary" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex justify-between text-label-sm text-on-surface-variant">
          <span>{fmt(used)} {used === 1 ? "day" : "days"} used</span>
          <span>{pct}% available</span>
        </div>
      </div>
    </div>
  );
}
