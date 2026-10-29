import Link from "next/link";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 shrink-0" aria-label="Legacy Media Leave — home">
      <span className="w-9 h-9 rounded-lg bg-primary text-secondary-fixed flex items-center justify-center text-label-lg tracking-tight">
        LM
      </span>
      <span className="leading-tight">
        <span className="block text-label-lg text-on-surface">Legacy Media</span>
        <span className="block text-label-sm text-secondary uppercase tracking-widest">Leave</span>
      </span>
    </Link>
  );
}
