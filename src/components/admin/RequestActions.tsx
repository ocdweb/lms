"use client";

import { adjustLeaveDates, approveLeave, rejectLeave, removeLeave } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "../ActionForm";
import { Dialog } from "../Dialog";
import { Icon } from "../Icon";

type Props = { id: string; name: string; status: string; start: string; end: string };

export function RequestActions({ id, name, status, start, end }: Props) {
  return (
    <div className="inline-flex items-center gap-1">
      {status === "PENDING" && (
        <>
          <ActionForm action={approveLeave}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="p-2 rounded-lg text-sage hover:bg-sage-tint" title="Approve">
              <Icon name="check_circle" className="text-lg" />
            </button>
          </ActionForm>
          <Dialog
            title="Reject Request"
            description={`${name} will receive an email with your reason.`}
            trigger={(
              <button type="button" className="p-2 rounded-lg text-[#9e3f36] hover:bg-[#fbf2f1]" title="Reject">
                <Icon name="cancel" className="text-lg" />
              </button>
            )}
          >
            <ActionForm action={rejectLeave} className="space-y-4">
              <input type="hidden" name="id" value={id} />
              <textarea name="comment" required rows={3} className="field resize-none" placeholder="Reason for rejection" />
              <div className="flex justify-end">
                <SubmitButton pendingText="Rejecting…">Reject &amp; notify</SubmitButton>
              </div>
            </ActionForm>
          </Dialog>
        </>
      )}
      {(status === "PENDING" || status === "APPROVED") && (
        <>
          <Dialog
            title="Adjust Dates"
            description="Working days are recalculated and the calendar entry is updated."
            trigger={(
              <button type="button" className="icon-btn" title="Adjust dates">
                <Icon name="edit_calendar" className="text-lg" />
              </button>
            )}
          >
            <ActionForm action={adjustLeaveDates} className="space-y-4">
              <input type="hidden" name="id" value={id} />
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="field-label">Start date</span>
                  <input name="startDate" type="date" defaultValue={start} required className="field" />
                </label>
                <label className="block space-y-1.5">
                  <span className="field-label">End date</span>
                  <input name="endDate" type="date" defaultValue={end} required className="field" />
                </label>
              </div>
              <div className="flex justify-end">
                <SubmitButton pendingText="Saving…">Save new dates</SubmitButton>
              </div>
            </ActionForm>
          </Dialog>
          <Dialog
            title="Remove Leave"
            description={`Cancel this leave for ${name}. The days are returned to their balance and the calendar entry is removed.`}
            trigger={(
              <button type="button" className="p-2 rounded-lg text-error hover:bg-error-container/40" title="Remove leave">
                <Icon name="event_busy" className="text-lg" />
              </button>
            )}
          >
            <ActionForm action={removeLeave} className="space-y-4">
              <input type="hidden" name="id" value={id} />
              <input name="comment" className="field" placeholder="Note for the employee (optional)" />
              <div className="flex justify-end">
                <SubmitButton className="btn-danger" pendingText="Removing…">Remove leave</SubmitButton>
              </div>
            </ActionForm>
          </Dialog>
        </>
      )}
    </div>
  );
}
