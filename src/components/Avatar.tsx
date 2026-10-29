export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

const TONES = ["bg-secondary-container/50 text-on-secondary-container", "bg-primary text-on-primary", "bg-surface-container-high text-on-surface"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const tone = TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  const dims = size === "sm" ? "w-8 h-8 text-label-sm" : size === "lg" ? "w-14 h-14 text-headline-sm" : "w-10 h-10 text-label-md";
  return <div className={`${dims} ${tone} rounded-full flex items-center justify-center shrink-0 font-semibold`}>{initials(name)}</div>;
}
