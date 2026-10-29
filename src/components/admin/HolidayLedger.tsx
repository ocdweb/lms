"use client";

import { createHoliday, deleteHoliday, toggleHoliday } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "../ActionForm";
import { Dialog } from "../Dialog";
import { Icon } from "../Icon";
import { formatLong, formatMonthDay } from "@/lib/dates";

type H = { id: string; name: string; start: string; end: string; kind: string; active: boolean };

export function HolidayLedger({ holidays, showAll = false, today }: { holidays: H[]; showAll?: boolean; today?: string }) {
  const list = showAll ? holidays : holidays.filter((h) => !today || h.end >= today).slice(0, 4);
  return (
    <section className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="event_available" className="text-secondary text-xl" />
            <h3 className="text-headline-sm text-on-surface">Holiday &amp; Eid Exemption Ledger</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant">Gazetted holidays switched on are excluded from employee leave deductions.</p>
        </div>
        <Dialog
          title="Add Custom Holiday"
          description="Add a public, Eid or company holiday. Active holidays are excluded from leave day counts."
          trigger={(
            <button type="button" className="btn-secondary self-start md:self-auto">
              <Icon name="add" className="text-base" /> Add Custom Holiday
            </button>
          )}
        >
          <ActionForm action={createHoliday} resetOnSuccess className="space-y-4">
            <label className="block space-y-1.5">
              <span className="field-label">Holiday name</span>
              <input name="name" required className="field" placeholder="e.g. Eid-ul-Adha" />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="field-label">Start date</span>
                <input name="startDate" type="date" required className="field" />
              </label>
              <label className="block space-y-1.5">
                <span className="field-label">End date</span>
                <input name="endDate" type="date" className="field" />
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="field-label">Type</span>
              <select name="kind" className="field">
                <option value="GAZETTED">Gazetted — office closed, exempt from quota</option>
                <option value="OPTIONAL">Optional — listed only, not exempt</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-body-sm">
              <input type="checkbox" name="addToCalendar" defaultChecked className="accent-primary w-4 h-4" /> Add to the company Google Calendar
            </label>
            <div className="pt-2 flex justify-end">
              <SubmitButton pendingText="Saving…">Add holiday</SubmitButton>
            </div>
          </ActionForm>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        {list.length === 0 && <p className="text-body-sm text-on-surface-variant">No upcoming holidays. Add one to get started.</p>}
        {list.map((h) => (
          <div key={h.id} className={`p-4 rounded-xl bg-surface-container-low flex items-start justify-between gap-3 ${today && h.end < today ? "opacity-60" : ""}`}>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-label-md text-on-surface truncate">{h.name}</span>
                {h.active && <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />}
              </div>
              <div className="text-body-sm text-on-surface-variant">{h.start === h.end ? formatLong(h.start) : `${formatMonthDay(h.start)} — ${formatLong(h.end)}`}</div>
              <span className="inline-block px-2 py-0.5 rounded bg-surface-container text-label-sm text-on-surface-variant">
                {h.kind === "GAZETTED" ? "Gazetted" : "Optional"} • {h.active ? "Exempt" : "Not exempt"}
              </span>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <ActionForm action={toggleHoliday}>
                <input type="hidden" name="id" value={h.id} />
                <button
                  type="submit"
                  role="switch"
                  aria-checked={h.active}
                  aria-label={`Exempt ${h.name} from leave quotas`}
                  className={`relative w-9 h-5 rounded-full transition-colors ${h.active ? "bg-primary" : "bg-surface-container-highest"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface-container-lowest shadow transition-all ${h.active ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </ActionForm>
              <ActionForm action={deleteHoliday} confirm={`Delete ${h.name}?`}>
                <input type="hidden" name="id" value={h.id} />
                <button type="submit" className="text-on-surface-variant hover:text-error" aria-label={`Delete ${h.name}`}>
                  <Icon name="delete" className="text-base" />
                </button>
              </ActionForm>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
