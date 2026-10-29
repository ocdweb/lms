"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

const DialogCtx = createContext<{ close: () => void } | null>(null);
export const useDialog = () => useContext(DialogCtx);

/** Native <dialog> modal styled per the design system (rounded-2xl panel, blurred backdrop). */
export function Dialog({
  trigger,
  title,
  description,
  children,
  wide = false,
}: {
  /** Clicking anything inside the trigger opens the dialog. */
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  return (
    <>
      <span className="contents" onClick={() => ref.current?.showModal()}>
        {trigger}
      </span>
      <dialog
        ref={ref}
        className={`w-[calc(100%-2rem)] ${wide ? "max-w-2xl" : "max-w-xl"} rounded-2xl bg-surface-container-lowest p-0 shadow-float text-left`}
        onClick={(e) => e.target === ref.current && close()}
      >
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-headline-md text-on-surface">{title}</h3>
              {description && <p className="text-body-sm text-on-surface-variant mt-1">{description}</p>}
            </div>
            <button type="button" onClick={close} className="icon-btn" aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <DialogCtx.Provider value={{ close }}>{children}</DialogCtx.Provider>
        </div>
      </dialog>
    </>
  );
}
