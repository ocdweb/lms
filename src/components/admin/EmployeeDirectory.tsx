"use client";

import Link from "next/link";
import { useState } from "react";
import { setEmployeeStatus } from "@/app/actions/admin";
import { ActionForm } from "../ActionForm";
import { Icon } from "../Icon";
import { Avatar } from "../Avatar";
import { QuotaDialog, RecordLeaveDialog, type EmployeeLite, type TypeLite } from "./EmployeeDialogs";

export type DirectoryRow = {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  role: string;
  status: string;
  onLeave: boolean;
  annual: { remaining: number; allocated: number } | null;
  chips: string[];
  quotaRows: { typeId: string; name: string; allocated: number; used: number }[];
};

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function EmployeeDirectory({ rows, types, employees, year }: { rows: DirectoryRow[]; types: TypeLite[]; employees: EmployeeLite[]; year: number }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "active" | "leave" | "inactive">("all");
  const counts = {
    all: rows.length,
    active: rows.filter((r) => r.status === "ACTIVE").length,
    leave: rows.filter((r) => r.onLeave).length,
    inactive: rows.filter((r) => r.status !== "ACTIVE").length,
  };
  const needle = q.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (tab === "all" || (tab === "active" && r.status === "ACTIVE") || (tab === "leave" && r.onLeave) || (tab === "inactive" && r.status !== "ACTIVE")) &&
      (!needle || [r.name, r.email, r.jobTitle, r.department].some((v) => v?.toLowerCase().includes(needle))),
  );

  return (
    <section className="space-y-4" id="directory">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-headline-md text-on-surface">Employee Directory &amp; Quota Registry</h2>
          <p className="text-body-sm text-on-surface-variant">Balance management, entitlement limits and on-demand adjustments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, title or team…"
              className="w-full sm:w-72 pl-10 pr-4 py-2 rounded-lg bg-surface-container-lowest shadow-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-[rgba(201,161,87,0.25)]"
            />
          </label>
          <div className="pill-tabs">
            {(
              [
                ["all", "All"],
                ["active", "Active"],
                ["leave", "On Leave"],
                ["inactive", "Inactive"],
              ] as const
            ).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setTab(key)} className={`pill-tab ${tab === key ? "pill-tab-active" : ""}`}>
                {label} ({counts[key]})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[960px]">
            <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">Employee Profile</th>
                <th className="py-4 px-4">Department • Hub</th>
                <th className="py-4 px-4">Annual Quota</th>
                <th className="py-4 px-4">Other Balances</th>
                <th className="py-4 px-4">Work Status</th>
                <th className="py-4 px-6 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-sm">
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-on-surface-variant">No employees match.</td>
                </tr>
              )}
              {shown.map((r) => {
                const pct = r.annual && r.annual.allocated ? Math.round((r.annual.remaining / r.annual.allocated) * 100) : 0;
                return (
                  <tr key={r.id} className={`hover:bg-surface-container-low/60 transition-colors ${r.status !== "ACTIVE" ? "opacity-60" : ""}`}>
                    <td className="py-4 px-6">
                      <Link href={`/admin/employees/${r.id}`} className="flex items-center gap-3 group">
                        <Avatar name={r.name} src={r.avatar} />
                        <div>
                          <div className="text-label-lg text-on-surface group-hover:underline">
                            {r.name}
                            {r.role === "ADMIN" && <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-on-primary text-[10px] align-middle">ADMIN</span>}
                          </div>
                          <div className="text-on-surface-variant">{r.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-label-md text-on-surface">{r.department ?? "—"}</div>
                      <div className="text-on-surface-variant">{[r.jobTitle, r.location].filter(Boolean).join(" • ") || "—"}</div>
                    </td>
                    <td className="py-4 px-4">
                      {r.annual ? (
                        <div className="space-y-1 w-32">
                          <div className="flex items-center justify-between text-label-sm">
                            <span>
                              {fmt(r.annual.remaining)} / {fmt(r.annual.allocated)} left
                            </span>
                            <span className="text-secondary">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                            <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 text-on-surface-variant">
                        {r.chips.map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded bg-surface-container text-label-sm whitespace-nowrap">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-label-sm inline-flex items-center gap-1.5 whitespace-nowrap ${
                          r.status !== "ACTIVE" ? "bg-[#fbf2f1] text-[#9e3f36]" : r.onLeave ? "bg-secondary-container/50 text-on-secondary-container" : "bg-surface-container-highest text-on-surface"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${r.status !== "ACTIVE" ? "bg-[#9e3f36]" : r.onLeave ? "bg-secondary" : "bg-on-surface"}`} />
                        {r.status !== "ACTIVE" ? "Inactive" : r.onLeave ? "On Leave" : "Active"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <QuotaDialog
                          employee={{ id: r.id, name: r.name }}
                          year={year}
                          rows={r.quotaRows}
                          trigger={(
                            <button type="button" className="icon-btn" title="Adjust leave quotas">
                              <Icon name="tune" className="text-lg" />
                            </button>
                          )}
                        />
                        <RecordLeaveDialog
                          types={types}
                          employees={employees}
                          employeeId={r.id}
                          trigger={(
                            <button type="button" className="icon-btn" title="Record leave">
                              <Icon name="add_task" className="text-lg" />
                            </button>
                          )}
                        />
                        <ActionForm
                          action={setEmployeeStatus}
                          confirm={r.status === "ACTIVE" ? `Deactivate ${r.name}? They will no longer be able to sign in.` : `Reactivate ${r.name}?`}
                        >
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value={r.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
                          <button
                            type="submit"
                            className={`p-2 rounded-lg transition-colors ${r.status === "ACTIVE" ? "text-error hover:bg-error-container/40" : "text-sage hover:bg-sage-tint"}`}
                            title={r.status === "ACTIVE" ? "Deactivate employee" : "Reactivate employee"}
                          >
                            <Icon name={r.status === "ACTIVE" ? "person_remove" : "person_add"} className="text-lg" />
                          </button>
                        </ActionForm>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
