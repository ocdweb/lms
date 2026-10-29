"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { useDialog } from "./Dialog";
import { toast } from "./Toaster";
import { Icon } from "./Icon";

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  redirectTo?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
};

/** Form bound to a server action: shows inline errors, toasts success and closes its parent dialog. */
export function ActionForm({ action, children, className, confirm, redirectTo, resetOnSuccess, onSuccess }: Props) {
  // Toast from inside the action so it still fires if this form unmounts when the page refreshes
  const [state, formAction] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result?.error) toast(result.error, "error");
    else if (result?.ok) toast(result.ok);
    return result;
  }, null);
  const dialog = useDialog();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      onSuccess?.();
      dialog?.close();
      if (resetOnSuccess) formRef.current?.reset();
      if (redirectTo) router.push(redirectTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {state?.error && <FormError message={state.error} />}
    </form>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div data-error-slot className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-[#fbf2f1] text-[#9e3f36] text-body-sm">
      <Icon name="error" className="text-base mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({ children, className = "btn-primary", pendingText }: { children: ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
