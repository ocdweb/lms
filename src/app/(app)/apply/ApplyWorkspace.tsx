"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { applyForLeave } from "@/app/actions/leave";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/Toaster";
import { countLeaveDays, formatMonthDay, formatWeekdayLong, type Duration, type HolidaySpan } from "@/lib/dates";

type TypeOption = {
  id: string;
  code: string;
  name: string;
  icon: string;
  description: string | null;
  deductsQuota: boolean;
  allowPastDates: boolean;
  allowHalfDay: boolean;
  birthdayMonthOnly: boolean;
  maxDaysPerRequest: number | null;
  minNoticeDays: number;
  allocated: number;
  remaining: number;
  available: number;
};

type TeamLeave = { id: string; name: string; avatar: string | null; department: string; typeName: string; status: string; start: string; end: string };

type Props = {
  today: string;
  year: number;
  hasBirthday: boolean;
  prefill: { type?: string; start?: string; end?: string };
  holidays: HolidaySpan[];
  totals: { allocated: number; used: number; remaining: number };
  types: TypeOption[];
  team: TeamLeave[];
};

const DRAFT_KEY = "lms-apply-draft";
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function ApplyWorkspace({ today, year, hasBirthday, prefill, holidays, totals, types, team }: Props) {
  const router = useRouter();
  const [typeId, setTypeId] = useState(prefill.type && types.some((t) => t.id === prefill.type) ? prefill.type : types[0]?.id);
  const [start, setStart] = useState(prefill.start ?? "");
  const [end, setEnd] = useState(prefill.end ?? prefill.start ?? "");
  const [duration, setDuration] = useState<Duration>("FULL");
  const [reason, setReason] = useState("");
  const [handover, setHandover] = useState("");
  const [emergency, setEmergency] = useState("");

  // Restore a saved draft (unless the page was opened with a pre-filled booking)
  useEffect(() => {
    if (prefill.start || prefill.type) return;
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (!d) return;
      if (types.some((t) => t.id === d.typeId)) setTypeId(d.typeId);
      setStart(d.start ?? "");
      setEnd(d.end ?? "");
      setDuration(d.duration ?? "FULL");
      setReason(d.reason ?? "");
      setHandover(d.handover ?? "");
      setEmergency(d.emergency ?? "");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const type = types.find((t) => t.id === typeId)!;
  const singleDay = start && start === end;
  const effectiveDuration: Duration = singleDay && type?.allowHalfDay ? duration : "FULL";
  const calc = useMemo(() => countLeaveDays(start, end || start, effectiveDuration, holidays), [start, end, effectiveDuration, holidays]);
  const isPast = Boolean(start && start < today);

  const warnings: string[] = [];
  if (start && end && end < start) warnings.push("End date cannot be before the start date.");
  if (isPast && type && !type.allowPastDates) warnings.push(`${type.name} can't be booked for past dates — choose Sick Leave (or Other Leave) for days already taken.`);
  if (type?.deductsQuota && calc.days > type.available) warnings.push(`You only have ${fmt(type.available)} ${type.name} day(s) available.`);
  if (type?.maxDaysPerRequest && calc.days > type.maxDaysPerRequest) warnings.push(`${type.name} is limited to ${type.maxDaysPerRequest} day(s) per request.`);
  if (type?.birthdayMonthOnly && !hasBirthday) warnings.push("Your birthday isn't on file yet — ask an Admin to add it.");

  const overlaps = start ? team.filter((m) => m.start <= (end || start) && m.end >= start) : [];
  const holidayInRange = holidays.filter((h) => start && h.start <= (end || start) && h.end >= start);
  const nextHoliday = holidays.find((h) => h.end >= today);

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ typeId, start, end, duration, reason, handover, emergency }));
      toast("Progress saved as draft on this device.");
    } catch {
      toast("Couldn't save a draft in this browser.", "error");
    }
  };

  const pct = totals.allocated ? Math.round((totals.remaining / totals.allocated) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <ActionForm
        action={applyForLeave}
        redirectTo="/dashboard"
        onSuccess={() => {
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch {}
        }}
        className="lg:col-span-8 flex flex-col gap-6"
      >
        <input type="hidden" name="leaveTypeId" value={typeId} />
        <input type="hidden" name="duration" value={effectiveDuration} />

        {/* Step 1 */}
        <section className="card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Step 01</span>
              <h2 className="text-headline-md text-on-surface">Select Leave Category</h2>
            </div>
            <span className="text-label-sm px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant whitespace-nowrap">Balance synchronized</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" role="radiogroup">
            {types.map((t) => {
              const selected = t.id === typeId;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  key={t.id}
                  onClick={() => setTypeId(t.id)}
                  className={`text-left relative p-4 rounded-xl transition-all flex flex-col justify-between min-h-[110px] ${
                    selected ? "bg-surface-container-lowest ring-2 ring-primary" : "bg-surface-container-low hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon name={t.icon} className={`text-xl ${t.birthdayMonthOnly ? "text-secondary" : "text-on-surface"}`} />
                    {t.birthdayMonthOnly ? (
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">Bonus</span>
                    ) : !t.deductsQuota ? (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm">No deduction</span>
                    ) : (
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${selected ? "bg-primary" : "bg-surface-container-lowest"}`}>
                        <span className={`w-2 h-2 rounded-full bg-surface-container-lowest ${selected ? "opacity-100" : "opacity-0"}`} />
                      </span>
                    )}
                  </div>
                  <div className="pt-3">
                    <div className="text-label-lg text-on-surface">{t.name}</div>
                    <div className="text-body-sm text-on-surface-variant">
                      {t.deductsQuota ? (
                        <>
                          <span className={`font-bold ${t.birthdayMonthOnly ? "text-secondary" : "text-on-surface"}`}>{fmt(t.available)}</span>{" "}
                          {t.available === 1 ? "day" : "days"} available
                        </>
                      ) : (
                        "0 quota deduction"
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {type?.description && (
            <div className={`p-4 rounded-xl bg-surface-container-low flex items-start gap-3 ${type.allowPastDates ? "ring-2 ring-secondary/20" : ""}`}>
              <Icon name="info" className="text-secondary text-xl shrink-0" />
              <div className="text-body-sm text-on-surface-variant">
                {type.allowPastDates && <span className="font-bold text-on-surface">Applying after being unwell? </span>}
                {type.allowPastDates
                  ? "You can select past dates for retrospective leave. Mention any medical certificate in your reason and share it with your Admin."
                  : type.description}
                {type.minNoticeDays > 0 && !/notice|ahead/i.test(type.description) && ` Requires ${type.minNoticeDays} days' notice.`}
              </div>
            </div>
          )}
        </section>

        {/* Step 2 */}
        <section className="card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Step 02</span>
              <h2 className="text-headline-md text-on-surface">Duration &amp; Date Schedule</h2>
            </div>
            <div className="pill-tabs self-start">
              {(
                [
                  ["FULL", "Full Days"],
                  ["HALF_AM", "1st Half"],
                  ["HALF_PM", "2nd Half"],
                ] as const
              ).map(([key, label]) => {
                const disabled = key !== "FULL" && (!type?.allowHalfDay || !singleDay);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    title={disabled ? "Half days are available for single-day leave only" : undefined}
                    onClick={() => setDuration(key)}
                    className={`pill-tab disabled:opacity-40 ${effectiveDuration === key ? "pill-tab-active" : ""}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-on-surface-variant flex items-center gap-1.5">
                <Icon name="calendar_today" className="text-base" /> From Date
              </span>
              <input
                type="date"
                name="startDate"
                required
                value={start}
                min={type?.allowPastDates ? undefined : today}
                onChange={(e) => {
                  setStart(e.target.value);
                  if (!end || end < e.target.value) setEnd(e.target.value);
                }}
                className="field cursor-pointer"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-on-surface-variant flex items-center gap-1.5">
                <Icon name="event" className="text-base" /> To Date
              </span>
              <input type="date" name="endDate" required value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} className="field cursor-pointer" />
            </label>
          </div>

          <div className="rounded-xl bg-surface-container-low p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface shrink-0">
                <Icon name="calculate" className="text-xl" />
              </div>
              <div>
                <div className="text-headline-sm text-on-surface">
                  Calculated: <span className="text-secondary">{calc.days.toFixed(1)}</span> Working {calc.days === 1 ? "Day" : "Days"}
                </div>
                <div className="text-body-sm text-on-surface-variant">
                  {!start
                    ? "Pick your dates to see the working days deducted."
                    : [
                        calc.weekendDays ? `Weekends (Sat–Sun) excluded` : null,
                        calc.holidayHits.length ? `${calc.holidayHits.join(", ")} excluded` : null,
                        isPast ? "Retrospective request" : null,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "No weekends or holidays in range"}
                </div>
              </div>
            </div>
            <span className="self-start sm:self-auto text-label-sm px-3 py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-secondary flex items-center gap-1 whitespace-nowrap">
              <Icon name="verified" className="text-sm" /> Holidays auto-excluded
            </span>
          </div>

          {warnings.length > 0 && (
            <ul className="space-y-2">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-2 p-3 rounded-lg bg-[#fbf2f1] text-[#9e3f36] text-body-sm">
                  <Icon name="warning" className="text-base mt-0.5" /> {w}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Step 3 */}
        <section className="card p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">Step 03</span>
            <h2 className="text-headline-md text-on-surface">Reason &amp; Handover Details</h2>
          </div>
          <label className="flex flex-col gap-2">
            <span className="field-label flex items-center justify-between">
              Primary Reason for Leave <span className="text-body-sm text-on-surface-variant font-normal">Visible to approving admin</span>
            </span>
            <textarea
              name="reason"
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="field resize-none"
              placeholder="e.g. Taking annual leave for a family trip. Deliverables for this week have been handed over…"
            />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="field-label flex items-center gap-1.5">
                <Icon name="person_pin" className="text-base" /> Delegated Handover Contact <span className="text-on-surface-variant font-normal">(Optional)</span>
              </span>
              <input name="handoverContact" value={handover} onChange={(e) => setHandover(e.target.value)} className="field" placeholder="e.g. Elena Rostova (Operations)" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="field-label flex items-center gap-1.5">
                <Icon name="contact_phone" className="text-base" /> Emergency Contact Info <span className="text-on-surface-variant font-normal">(Optional)</span>
              </span>
              <input name="emergencyContact" value={emergency} onChange={(e) => setEmergency(e.target.value)} className="field" placeholder="Phone or email while away" />
            </label>
          </div>
        </section>

        <div className="bg-secondary-container rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-on-secondary-container">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-label-md">
              <Icon name="forward_to_inbox" className="text-lg" /> Automated Email Dispatch
            </div>
            <div className="text-body-sm">
              • An email alert is sent instantly to the Admin for review.
              <br />• You&apos;ll be notified by email and in the portal once a decision is made.
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-surface-container-lowest/80 px-3.5 py-2 rounded-lg text-secondary text-label-sm shadow-sm">
            <Icon name="notifications_active" className="text-sm" /> Realtime Tracking
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="button" onClick={saveDraft} className="btn-secondary w-full sm:w-auto px-5 py-3">
              Save as Draft
            </button>
            <button type="button" onClick={() => router.back()} className="btn-ghost w-full sm:w-auto px-4 py-3">
              Cancel
            </button>
          </div>
          <SubmitButton className="btn w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-container text-on-primary shadow-md hover:shadow-lg" pendingText="Submitting…">
            Submit for Admin Approval <Icon name="arrow_forward" className="text-lg text-secondary-fixed" />
          </SubmitButton>
        </div>
      </ActionForm>

      <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between pb-2">
            <div>
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">Allowance</span>
              <h3 className="text-headline-sm text-on-surface">Available Quota ({year})</h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <Icon name="pie_chart" className="text-base" />
            </div>
          </div>
          <div className="flex items-center gap-6 p-4 rounded-xl bg-surface-container-low">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e2dd" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#795915" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${pct}, 100`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-headline-md text-on-surface leading-none">{fmt(totals.remaining)}</span>
                <span className="text-[9px] font-semibold text-on-surface-variant uppercase">Left</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-label-md text-on-surface">
                {fmt(totals.remaining)} of {fmt(totals.allocated)} days remain
              </div>
              <p className="text-body-sm text-on-surface-variant">{fmt(totals.used)} days taken year-to-date across all categories.</p>
            </div>
          </div>
          <div className="space-y-3 text-body-sm">
            {types
              .filter((t) => t.deductsQuota)
              .map((t, i) => (
                <div key={t.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-on-surface-variant">
                      <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-secondary" : i % 2 ? "bg-primary" : "bg-outline"}`} />
                      {t.name}
                    </span>
                    <span className="text-label-sm text-on-surface">
                      {fmt(t.remaining)} / {fmt(t.allocated)} Days
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-secondary" : i % 2 ? "bg-primary" : "bg-outline"}`}
                      style={{ width: `${t.allocated ? (t.remaining / t.allocated) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-label-sm uppercase tracking-wider text-on-surface-variant">Team Coordination</span>
              <h3 className="text-headline-sm text-on-surface">Out of Office Those Days</h3>
            </div>
            {start && (
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface text-label-sm whitespace-nowrap">
                {formatMonthDay(start)}
                {end && end !== start ? ` – ${formatMonthDay(end)}` : ""}
              </span>
            )}
          </div>
          <p className="text-body-sm text-on-surface-variant">Check colleague overlaps to ensure coverage during critical deliveries:</p>
          <div className="space-y-3">
            {overlaps.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={m.name} src={m.avatar} size="sm" />
                  <div className="min-w-0">
                    <div className="text-label-md text-on-surface truncate">{m.name}</div>
                    <div className="text-body-sm text-on-surface-variant truncate">
                      {m.department ? `${m.department} • ` : ""}
                      {m.typeName}
                      {m.status === "PENDING" ? " (pending)" : ""}
                    </div>
                  </div>
                </div>
                <span className={`text-label-sm px-2.5 py-1 rounded-full whitespace-nowrap ${m.status === "PENDING" ? "bg-surface-container-highest text-on-surface-variant" : "bg-secondary-container text-on-secondary-container"}`}>
                  {formatMonthDay(m.start)}
                  {m.end !== m.start ? ` – ${formatMonthDay(m.end)}` : ""}
                </span>
              </div>
            ))}
            {overlaps.length === 0 && (
              <div className="p-3 rounded-lg bg-surface-container-low flex items-center gap-2.5 text-on-surface-variant">
                <Icon name="check_circle" className="text-base text-secondary" />
                <span className="text-body-sm">{start ? "No colleagues are away on these dates." : "Select dates to check for overlaps."}</span>
              </div>
            )}
          </div>
        </div>

        {(holidayInRange[0] ?? nextHoliday) && (
          <div className="bg-surface-container-low rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
              <Icon name="event_available" className="text-lg" />
            </div>
            <div className="space-y-1">
              <div className="text-label-md text-on-surface">{holidayInRange.length ? "Public Holiday In Your Dates" : "Upcoming Public Holiday"}</div>
              <div className="text-body-sm text-on-surface-variant">
                <strong>{(holidayInRange[0] ?? nextHoliday)!.name}</strong> is observed on {formatWeekdayLong((holidayInRange[0] ?? nextHoliday)!.start)}. Holiday days are excluded from your calculated quota.
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
