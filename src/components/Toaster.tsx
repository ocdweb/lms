"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Toast = { id: number; message: string; tone: "ok" | "error" };

export function toast(message: string, tone: Toast["tone"] = "ok") {
  window.dispatchEvent(new CustomEvent("lms:toast", { detail: { message, tone } }));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems((xs) => [...xs, { id, message, tone }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
    };
    window.addEventListener("lms:toast", onToast);
    return () => window.removeEventListener("lms:toast", onToast);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto z-[60] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="bg-primary text-on-primary px-5 py-3.5 rounded-xl shadow-float flex items-center gap-3 text-label-md max-w-md">
          <Icon name={t.tone === "ok" ? "task_alt" : "error"} className={t.tone === "ok" ? "text-secondary-fixed" : "text-error-container"} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
