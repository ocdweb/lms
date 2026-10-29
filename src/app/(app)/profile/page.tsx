import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { formatLong } from "@/lib/dates";
import { changePassword } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Avatar } from "@/components/Avatar";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const rows: [string, string][] = [
    ["Email", user.email],
    ["Job title", user.jobTitle ?? "—"],
    ["Department", user.department ?? "—"],
    ["Location", user.location ?? "—"],
    ["Birthday", user.birthday ? formatLong(user.birthday) : "Not on file"],
    ["Joined", formatLong(user.joinedAt)],
    ["Role", user.role === "ADMIN" ? "Administrator" : "Employee"],
  ];
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-5">
        <Avatar name={user.name} size="lg" />
        <div>
          <span className="eyebrow">My Profile</span>
          <h1 className="text-headline-lg-mobile sm:text-headline-lg">{user.name}</h1>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="card p-6 space-y-3">
          <h2 className="text-headline-sm">Employment details</h2>
          <p className="text-body-sm text-on-surface-variant">Managed by your Admin. Ask them if anything needs updating.</p>
          <dl className="divide-y divide-surface-container">
            {rows.map(([k, v]) => (
              <div key={k} className="py-3 flex justify-between gap-4">
                <dt className="text-body-sm text-on-surface-variant">{k}</dt>
                <dd className="text-label-lg text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card p-6 space-y-4">
          <h2 className="text-headline-sm">Change password</h2>
          <ActionForm action={changePassword} resetOnSuccess className="space-y-4">
            <label className="block space-y-1.5">
              <span className="field-label">Current password</span>
              <input name="current" type="password" required className="field" autoComplete="current-password" />
            </label>
            <label className="block space-y-1.5">
              <span className="field-label">New password</span>
              <input name="next" type="password" required minLength={8} className="field" autoComplete="new-password" />
            </label>
            <label className="block space-y-1.5">
              <span className="field-label">Confirm new password</span>
              <input name="confirm" type="password" required minLength={8} className="field" autoComplete="new-password" />
            </label>
            <SubmitButton pendingText="Saving…">Update password</SubmitButton>
          </ActionForm>
        </section>
      </div>
    </div>
  );
}
