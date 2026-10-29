"use client";

import { saveLeaveType } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";

export type LeaveTypeData = {
  id?: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  defaultQuota: number;
  deductsQuota: boolean;
  allowPastDates: boolean;
  birthdayMonthOnly: boolean;
  allowHalfDay: boolean;
  maxDaysPerRequest: number | null;
  minNoticeDays: number;
  active: boolean;
};

const BLANK: LeaveTypeData = {
  name: "",
  description: "",
  icon: "event",
  accent: "ink",
  defaultQuota: 0,
  deductsQuota: true,
  allowPastDates: false,
  birthdayMonthOnly: false,
  allowHalfDay: true,
  maxDaysPerRequest: null,
  minNoticeDays: 0,
  active: true,
};

const ICONS = ["beach_access", "coffee", "stethoscope", "event_upcoming", "cake", "celebration", "more_horiz", "child_friendly", "family_restroom", "school", "mosque", "flight", "favorite", "work_off", "event"];

function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-primary w-4 h-4 mt-0.5" />
      <span>
        <span className="block text-label-md">{label}</span>
        <span className="block text-body-sm text-on-surface-variant">{hint}</span>
      </span>
    </label>
  );
}

export function LeaveTypeDialog({ type }: { type?: LeaveTypeData }) {
  const t = type ?? BLANK;
  return (
    <Dialog
      wide
      title={type ? `Edit ${type.name}` : "New Leave Type"}
      description="Define the entitlement and the rules employees must follow when requesting this leave."
      trigger={type ? (
          <button type="button" className="btn-secondary py-2">
            <Icon name="edit" className="text-base" /> Edit policy
          </button>
        ) : (
          <button type="button" className="btn-primary">
            <Icon name="add" className="text-base" /> New Leave Type
          </button>
        )
      }
    >
      <ActionForm action={saveLeaveType} resetOnSuccess={!type} className="space-y-4">
        {type?.id && <input type="hidden" name="id" value={type.id} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="field-label">Name</span>
            <input name="name" defaultValue={t.name} required className="field" placeholder="e.g. Maternity Leave" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Icon</span>
            <select name="icon" defaultValue={t.icon} className="field">
              {ICONS.map((i) => (
                <option key={i} value={i}>{i.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="field-label">Description</span>
            <input name="description" defaultValue={t.description} className="field" placeholder="Shown to employees on the apply form and policy page" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Default yearly quota (days)</span>
            <input name="defaultQuota" type="number" min={0} step={0.5} defaultValue={t.defaultQuota} className="field" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Progress bar colour</span>
            <select name="accent" defaultValue={t.accent} className="field">
              <option value="ink">Ink (charcoal)</option>
              <option value="gold">Muted gold</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="field-label">Max days per request <span className="text-on-surface-variant font-normal">(blank = no limit)</span></span>
            <input name="maxDaysPerRequest" type="number" min={0} step={0.5} defaultValue={t.maxDaysPerRequest ?? ""} className="field" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Minimum notice (days)</span>
            <input name="minNoticeDays" type="number" min={0} defaultValue={t.minNoticeDays} className="field" />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Check name="deductsQuota" label="Deducts from quota" hint="Off = unlimited, tracked only (e.g. Eid, unpaid)" defaultChecked={t.deductsQuota} />
          <Check name="allowPastDates" label="Can apply after the date" hint="e.g. Sick leave logged post-recovery" defaultChecked={t.allowPastDates} />
          <Check name="allowHalfDay" label="Half days allowed" hint="1st / 2nd half on single-day requests" defaultChecked={t.allowHalfDay} />
          <Check name="birthdayMonthOnly" label="Birthday month only" hint="Must fall within the employee's birthday month" defaultChecked={t.birthdayMonthOnly} />
          <Check name="active" label="Active" hint="Inactive types are hidden from employees" defaultChecked={t.active} />
          <Check name="applyToAll" label="Apply quota to everyone now" hint="Overwrite this year's allocation for all active employees" defaultChecked={false} />
        </div>
        <div className="flex justify-end">
          <SubmitButton pendingText="Saving…">{type ? "Save policy" : "Create leave type"}</SubmitButton>
        </div>
      </ActionForm>
    </Dialog>
  );
}
