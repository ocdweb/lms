"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  trigger: ReactNode;
  label: string;
  className?: string;
  triggerClassName?: string;
  children: ReactNode;
};

/** <details> menu that closes on navigation, outside click, Escape, or picking an item. */
export function DropdownMenu({ trigger, label, className = "", triggerClassName = "", children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [path]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      const el = ref.current;
      if (e.key === "Escape" && el?.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className={`relative ${className}`}>
      <summary className={`list-none cursor-pointer ${triggerClassName}`} aria-label={label}>
        {trigger}
      </summary>
      <div
        className="absolute right-0 top-12 w-64 card shadow-float p-2 z-50"
        // Close after choosing an item, including a link to the page you're already on
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button") && ref.current) ref.current.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}
