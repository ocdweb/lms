import { Icon } from "./Icon";

const STYLES: Record<string, { label: string; icon: string; cls: string }> = {
  PENDING: { label: "Pending Admin", icon: "schedule", cls: "bg-secondary-container/40 text-on-secondary-container" },
  APPROVED: { label: "Approved", icon: "check_circle", cls: "bg-sage-tint text-sage" },
  COMPLETED: { label: "Completed", icon: "done_all", cls: "bg-surface-container text-on-surface-variant" },
  REJECTED: { label: "Rejected", icon: "cancel", cls: "bg-[#fbf2f1] text-[#9e3f36]" },
  CANCELLED: { label: "Cancelled", icon: "block", cls: "bg-surface-container text-on-surface-variant" },
};

export function StatusBadge({ status, completed = false }: { status: string; completed?: boolean }) {
  const s = STYLES[status === "APPROVED" && completed ? "COMPLETED" : status] ?? STYLES.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm whitespace-nowrap ${s.cls}`}>
      <Icon name={s.icon} className="text-[14px]" />
      {s.label}
    </span>
  );
}
