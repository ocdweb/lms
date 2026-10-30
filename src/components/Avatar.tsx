export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** URL of a user's profile photo, or null when they haven't uploaded one. */
export const avatarUrl = (u: { id: string; avatarUpdatedAt?: Date | null }) =>
  u.avatarUpdatedAt ? `/api/avatar/${u.id}?v=${u.avatarUpdatedAt.getTime()}` : null;

const TONES = ["bg-secondary-container/50 text-on-secondary-container", "bg-primary text-on-primary", "bg-surface-container-high text-on-surface"];
const DIMS = {
  xs: "w-4 h-4 text-[8px]",
  sm: "w-8 h-8 text-label-sm",
  md: "w-10 h-10 text-label-md",
  lg: "w-14 h-14 text-headline-sm",
  xl: "w-24 h-24 text-headline-lg",
};

export function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: keyof typeof DIMS }) {
  const dims = DIMS[size];
  if (src) return <img src={src} alt={name} className={`${dims} rounded-full object-cover shrink-0 bg-surface-container`} />;
  const tone = TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  return <div className={`${dims} ${tone} rounded-full flex items-center justify-center shrink-0 font-semibold`}>{initials(name)}</div>;
}
