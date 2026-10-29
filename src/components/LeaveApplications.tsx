"use client";

import Link from "next/link";
import { useState } from "react";
import { cancelLeave } from "@/app/actions/leave";
import { ActionForm } from "./ActionForm";
import { Icon } from "./Icon";
import { StatusBadge } from "./StatusBadge";

export type LeaveRowData = {
  id: string;
  typeName: string;
  icon: string;
  status: string;
  range: string;
  days: string;
  appliedOn: string;
  past: boolean;
  upcoming: boolean;
  retrospective: boolean;
  emailNote: string;
  adminComment: string | null;
  recordedByAdmin: boolean;
};

const FILTERS = [
  ["all", "All"],
  ["PENDING", "Pending"],
  ["upcoming", "Upcoming"],
  ["APPROVED", "Approved"],
  ["REJECTED", "Rejected"],
  ["past", "Past"],
] as const;

export function LeaveApplications({ rows }: { rows: LeaveRowData[] }) {
  const [filter, setFilter] = useState<string>("all");
  const shown = rows.filter((r) =>
    filter === "all" ? true : filter === "upcoming" ? r.upcoming : filter === "past" ? r.past && r.status === "APPROVED" : r.status === filter,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="eyebrow block mb-1">Ledger History</span>
          <h2 className="text-headline-md text-on-surface">Leave Applications</h2>
        </div>
        <div className="pill-tabs">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`pill-tab ${filter === key ? "pill-tab-active" : ""}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {shown.length === 0 && (
          <div className="p-8 rounded-lg bg-surface text-center text-on-surface-variant text-body-sm">
            <Icon name="event_busy" className="text-3xl text-outline mb-2 block" />
            No leave applications here yet.
          </div>
        )}
        {shown.map((r) => (
          <div key={r.id} className="p-5 rounded-lg bg-surface hover:bg-surface-container-low transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-on-surface">
                <Icon name={r.icon} className="text-xl" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-label-lg text-on-surface">
                    {r.typeName}
                    {r.retrospective && <span className="text-on-surface-variant font-normal"> (post-dated)</span>}
                  </span>
                  <StatusBadge status={r.status} completed={r.past} />
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  {r.range} • <strong className="text-on-surface font-medium">{r.days}</strong>
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-label-sm text-on-surface-variant">
                  <Icon name={r.status === "PENDING" ? "outgoing_mail" : "mark_email_read"} className="text-[14px] text-secondary" />
                  <span>{r.emailNote}</span>
                  <span>•</span>
                  <span>{r.recordedByAdmin ? "Recorded by Admin" : "Applied"} {r.appliedOn}</span>
                </div>
                {r.adminComment && r.status !== "PENDING" && (
                  <p className="text-body-sm text-on-surface-variant italic pt-1">“{r.adminComment}”</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              {r.status === "PENDING" && (
                <ActionForm action={cancelLeave} confirm="Withdraw this leave request?">
                  <input type="hidden" name="id" value={r.id} />
                  <button className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-error-container text-error text-label-sm transition-colors shadow-sm">
                    Cancel Request
                  </button>
                </ActionForm>
              )}
              <Link href={`/leaves/${r.id}`} className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface text-label-sm hover:bg-surface-container transition-colors shadow-sm">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
