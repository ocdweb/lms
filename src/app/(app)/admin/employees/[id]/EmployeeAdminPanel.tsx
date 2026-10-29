"use client";

import { deleteEmployee, resetPassword, setEmployeeStatus, updateEmployee } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { QuotaDialog, RecordLeaveDialog, type EmployeeLite, type TypeLite } from "@/components/admin/EmployeeDialogs";

type U = { id: string; name: string; email: string; jobTitle: string; department: string; location: string; phone: string; role: string; status: string; birthday: string };

export function EmployeeAdminPanel({
  user,
  isSelf,
  year,
  departments,
  types,
  employees,
  quotaRows,
}: {
  user: U;
  isSelf: boolean;
  year: number;
  departments: string[];
  types: TypeLite[];
  employees: EmployeeLite[];
  quotaRows: { typeId: string; name: string; allocated: number; used: number }[];
}) {
  const depts = user.department && !departments.includes(user.department) ? [user.department, ...departments] : departments;
  return (
    <div className="flex flex-wrap gap-3">
      <Dialog
        wide
        title="Edit Profile"
        trigger={(
          <button type="button" className="btn-secondary">
            <Icon name="edit" className="text-base" /> Edit Profile
          </button>
        )}
      >
        <ActionForm action={updateEmployee} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="field-label">Full name</span>
              <input name="name" defaultValue={user.name} required className="field" />
            </label>
            <label className="block space-y-1">
              <span className="field-label">Work email</span>
              <input name="email" type="email" defaultValue={user.email} required className="field" />
            </label>
            <label className="block space-y-1">
              <span className="field-label">Job title</span>
              <input name="jobTitle" defaultValue={user.jobTitle} className="field" />
            </label>
            <label className="block space-y-1">
              <span className="field-label">Department</span>
              <select name="department" defaultValue={user.department} className="field">
                <option value="">—</option>
                {depts.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="field-label">Location</span>
              <input name="location" defaultValue={user.location} className="field" />
            </label>
            <label className="block space-y-1">
              <span className="field-label">Phone</span>
              <input name="phone" defaultValue={user.phone} className="field" />
            </label>
            <label className="block space-y-1">
              <span className="field-label">Birthday</span>
              <input name="birthday" type="date" defaultValue={user.birthday} className="field" />
            </label>
            <label className="block space-y-1">
              <span className="field-label">Role</span>
              <select name="role" defaultValue={user.role} className="field">
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end">
            <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
          </div>
        </ActionForm>
      </Dialog>

      <QuotaDialog
        employee={{ id: user.id, name: user.name }}
        year={year}
        rows={quotaRows}
        trigger={(
          <button type="button" className="btn-secondary">
            <Icon name="tune" className="text-base" /> Edit {year} Quotas
          </button>
        )}
      />

      <RecordLeaveDialog
        types={types}
        employees={employees.some((e) => e.id === user.id) ? employees : [{ id: user.id, name: user.name }, ...employees]}
        employeeId={user.id}
        trigger={(
          <button type="button" className="btn-secondary">
            <Icon name="add_task" className="text-base" /> Record Leave
          </button>
        )}
      />

      <Dialog
        title="Reset Password"
        description={`Set a new temporary password for ${user.name}.`}
        trigger={(
          <button type="button" className="btn-secondary">
            <Icon name="key" className="text-base" /> Reset Password
          </button>
        )}
      >
        <ActionForm action={resetPassword} resetOnSuccess className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <input name="password" minLength={8} required className="field" placeholder="New temporary password (min 8 characters)" autoComplete="new-password" />
          <label className="flex items-center gap-2 text-body-sm">
            <input type="checkbox" name="sendEmail" defaultChecked className="accent-primary w-4 h-4" /> Email the new sign-in details to {user.email}
          </label>
          <div className="flex justify-end">
            <SubmitButton pendingText="Saving…">Reset password</SubmitButton>
          </div>
        </ActionForm>
      </Dialog>

      {!isSelf && (
        <>
          <ActionForm
            action={setEmployeeStatus}
            confirm={user.status === "ACTIVE" ? `Deactivate ${user.name}? They will no longer be able to sign in.` : `Reactivate ${user.name}?`}
          >
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="status" value={user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
            <SubmitButton className={user.status === "ACTIVE" ? "btn-danger" : "btn-secondary"}>
              <Icon name={user.status === "ACTIVE" ? "person_off" : "person_add"} className="text-base" />
              {user.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
            </SubmitButton>
          </ActionForm>
          <ActionForm
            action={deleteEmployee}
            redirectTo="/admin"
            confirm={`Permanently delete ${user.name} and ALL of their leave history? This cannot be undone. Consider deactivating instead.`}
          >
            <input type="hidden" name="id" value={user.id} />
            <SubmitButton className="btn px-4 py-2.5 text-error hover:bg-error-container/40">
              <Icon name="delete_forever" className="text-base" /> Delete permanently
            </SubmitButton>
          </ActionForm>
        </>
      )}
    </div>
  );
}
