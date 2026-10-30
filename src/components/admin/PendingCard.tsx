"use client";

import { adjustLeaveDates, approveLeave, rejectLeave } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "../ActionForm";
import { Dialog } from "../Dialog";
import { Icon } from "../Icon";
import { initials } from "../Avatar";

export type PendingData = {
  id: string;
  name: string;
  avatar: string | null;
  department: string | null;
  typeName: string;
  range: string;
  start: string;
  end: string;
  days: number;
  quotaNote: string;
  reason: string | null;
  retrospective: boolean;
  submitted: string;
  handover: string | null;
};

export function PendingCard({ r }: { r: PendingData }) {
  return (
    <article className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-start gap-6 min-w-0">
        <div className="w-full sm:w-56 h-32 sm:h-36 rounded-[999px] bg-gradient-to-br from-surface-container-low via-secondary-container/40 to-surface-container-high flex items-center justify-center shrink-0">
          {r.avatar ? (
            <img src={r.avatar} alt={r.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-sm" />
          ) : (
            <span className="text-headline-xl text-on-secondary-container/80">{initials(r.name)}</span>
          )}
        </div>
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-headline-sm text-on-surface">{r.name}</span>
            {r.department && <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-label-sm">{r.department}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-label-sm">{r.typeName}</span>
            {r.retrospective && <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-label-sm">Post-dated</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-surface-variant text-body-sm">
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar_today" className="text-base text-secondary" /> {r.range}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="schedule" className="text-base" /> <strong className="text-on-surface text-label-md">{r.days} working {r.days === 1 ? "day" : "days"}</strong>
            </span>
          </div>
          <div className="inline-flex items-center gap-1 text-on-surface-variant text-body-sm">
            <Icon name="pie_chart" className="text-base text-secondary" /> {r.quotaNote}
          </div>
          {r.reason && <p className="text-body-sm text-on-surface-variant/90 italic">“{r.reason}”</p>}
          <p className="text-label-sm text-on-surface-variant">
            Submitted {r.submitted}
            {r.handover ? ` • Handover: ${r.handover}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end xl:self-center">
        <Dialog
          title="Adjust Dates"
          description={`Change the dates of ${r.name}'s ${r.typeName}. Working days are recalculated automatically.`}
          trigger={(
            <button type="button" className="btn px-3.5 py-2 bg-surface-container text-on-surface hover:bg-surface-container-high">
              Adjust Dates
            </button>
          )}
        >
          <ActionForm action={adjustLeaveDates} className="space-y-4">
            <input type="hidden" name="id" value={r.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="field-label">Start date</span>
                <input name="startDate" type="date" defaultValue={r.start} required className="field" />
              </label>
              <label className="block space-y-1.5">
                <span className="field-label">End date</span>
                <input name="endDate" type="date" defaultValue={r.end} required className="field" />
              </label>
            </div>
            <div className="flex justify-end">
              <SubmitButton pendingText="Saving…">Save new dates</SubmitButton>
            </div>
          </ActionForm>
        </Dialog>
        <Dialog
          title="Reject Request"
          description={`${r.name} will receive an email with your reason.`}
          trigger={(
            <button type="button" className="btn px-3.5 py-2 bg-error-container/40 text-on-error-container hover:bg-error-container">
              Reject
            </button>
          )}
        >
          <ActionForm action={rejectLeave} className="space-y-4">
            <input type="hidden" name="id" value={r.id} />
            <label className="block space-y-1.5">
              <span className="field-label">Reason for rejection</span>
              <textarea name="comment" required rows={3} className="field resize-none" placeholder="e.g. Critical client delivery that week — could you move this by a few days?" />
            </label>
            <div className="flex justify-end">
              <SubmitButton className="btn px-5 py-2.5 bg-[#9e3f36] text-on-primary hover:bg-[#86342c]" pendingText="Rejecting…">
                Reject &amp; notify
              </SubmitButton>
            </div>
          </ActionForm>
        </Dialog>
        <ActionForm action={approveLeave}>
          <input type="hidden" name="id" value={r.id} />
          <SubmitButton className="btn px-5 py-2 bg-primary text-secondary-fixed hover:bg-primary-container shadow-sm" pendingText="Approving…">
            <Icon name="check_circle" className="text-base" /> Approve
          </SubmitButton>
        </ActionForm>
      </div>
    </article>
  );
}
