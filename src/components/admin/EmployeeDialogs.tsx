"use client";

import type { ReactNode } from "react";
import { createEmployee, recordLeave, updateQuotas } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "../ActionForm";
import { Dialog } from "../Dialog";

export type TypeLite = { id: string; name: string; deductsQuota: boolean; defaultQuota: number };
export type EmployeeLite = { id: string; name: string };

type Trigger = ReactNode;

export function AddEmployeeDialog({ types, departments, trigger }: { types: TypeLite[]; departments: string[]; trigger: Trigger }) {
  return (
    <Dialog wide title="Add New Employee" description="Set the employee's profile, sign-in details and starting leave allowances." trigger={trigger}>
      <ActionForm action={createEmployee} resetOnSuccess className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="field-label">Full name</span>
            <input name="name" required className="field" placeholder="e.g. Yasmin Qureshi" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Work email</span>
            <input name="email" type="email" required className="field" placeholder="yasmin.q@legacymedia.com" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Job title</span>
            <input name="jobTitle" className="field" placeholder="e.g. Content Producer" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Department</span>
            <select name="department" className="field">
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="field-label">Location</span>
            <input name="location" className="field" placeholder="e.g. Head Office" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Birthday <span className="text-on-surface-variant font-normal">(for Birthday Leave)</span></span>
            <input name="birthday" type="date" className="field" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Joining date</span>
            <input name="joinedAt" type="date" className="field" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Role</span>
            <select name="role" className="field">
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="field-label">Temporary password <span className="text-on-surface-variant font-normal">(leave blank to generate one)</span></span>
            <input name="password" minLength={8} className="field" autoComplete="new-password" />
          </label>
        </div>
        <div className="space-y-2 pt-2">
          <span className="field-label">Starting leave quotas this year (days)</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {types
              .filter((t) => t.deductsQuota)
              .map((t) => (
                <label key={t.id} className="p-3 rounded-lg bg-surface-container-low space-y-1">
                  <span className="text-label-sm text-on-surface-variant">{t.name}</span>
                  <input name={`quota_${t.id}`} type="number" min={0} step={0.5} defaultValue={t.defaultQuota} className="w-full bg-transparent text-headline-sm focus:outline-none" />
                </label>
              ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-body-sm">
          <input type="checkbox" name="sendWelcome" defaultChecked className="accent-primary w-4 h-4" /> Email sign-in details to the employee
        </label>
        <div className="pt-2 flex items-center justify-end gap-3">
          <SubmitButton pendingText="Creating…">Create &amp; Enrol Profile</SubmitButton>
        </div>
      </ActionForm>
    </Dialog>
  );
}

export function RecordLeaveDialog({
  types,
  employees,
  employeeId,
  trigger,
}: {
  types: TypeLite[];
  employees: EmployeeLite[];
  employeeId?: string;
  trigger: Trigger;
}) {
  return (
    <Dialog
      title="Record Leave for Employee"
      description="Log leave on an employee's behalf (e.g. sick days reported by phone). It's recorded as approved and deducted from their balance."
      trigger={trigger}
    >
      <ActionForm action={recordLeave} resetOnSuccess className="space-y-4">
        <label className="block space-y-1">
          <span className="field-label">Employee</span>
          <select name="userId" defaultValue={employeeId} required className="field">
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="field-label">Leave type</span>
          <select name="leaveTypeId" required className="field">
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block space-y-1">
            <span className="field-label">From</span>
            <input name="startDate" type="date" required className="field" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">To</span>
            <input name="endDate" type="date" className="field" />
          </label>
          <label className="block space-y-1">
            <span className="field-label">Duration</span>
            <select name="duration" className="field">
              <option value="FULL">Full day(s)</option>
              <option value="HALF_AM">1st half</option>
              <option value="HALF_PM">2nd half</option>
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="field-label">Note</span>
          <input name="comment" className="field" placeholder="e.g. Called in sick, confirmed by team lead" />
        </label>
        <label className="flex items-center gap-2 text-body-sm">
          <input type="checkbox" name="notify" defaultChecked className="accent-primary w-4 h-4" /> Notify the employee by email
        </label>
        <div className="flex justify-end">
          <SubmitButton pendingText="Recording…">Record leave</SubmitButton>
        </div>
      </ActionForm>
    </Dialog>
  );
}

export function QuotaDialog({
  employee,
  year,
  rows,
  trigger,
}: {
  employee: EmployeeLite;
  year: number;
  rows: { typeId: string; name: string; allocated: number; used: number }[];
  trigger: Trigger;
}) {
  return (
    <Dialog title={`Edit Quota — ${employee.name}`} description={`Set the number of days allocated for ${year}. Used days are calculated from approved leave.`} trigger={trigger}>
      <ActionForm action={updateQuotas} className="space-y-4">
        <input type="hidden" name="userId" value={employee.id} />
        <input type="hidden" name="year" value={year} />
        <div className="grid grid-cols-2 gap-3">
          {rows.map((r) => (
            <label key={r.typeId} className="p-3 rounded-lg bg-surface-container-low space-y-1">
              <span className="text-label-sm text-on-surface-variant flex justify-between">
                {r.name} <span>{r.used} used</span>
              </span>
              <input name={`quota_${r.typeId}`} type="number" min={0} step={0.5} defaultValue={r.allocated} className="w-full bg-transparent text-headline-sm focus:outline-none" />
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <SubmitButton pendingText="Saving…">Save quotas</SubmitButton>
        </div>
      </ActionForm>
    </Dialog>
  );
}
