"use client";

import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Icon } from "@/components/Icon";
import { login } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={login} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block space-y-2">
        <span className="field-label">Work email</span>
        <input name="email" type="email" autoComplete="email" required className="field" placeholder="you@legacymedia.com" />
      </label>
      <label className="block space-y-2">
        <span className="field-label">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="field" />
      </label>
      <SubmitButton className="btn-primary w-full py-3.5" pendingText="Signing in…">
        Sign in <Icon name="arrow_forward" className="text-lg text-secondary-fixed" />
      </SubmitButton>
    </ActionForm>
  );
}
