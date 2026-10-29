import Link from "next/link";

export function Logo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 shrink-0" aria-label="Legacy Media Leave — home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/legacy-media-logo-dark.png" alt="Legacy Media" className="h-7 sm:h-8 w-auto" />
      <span className="hidden sm:block h-6 w-px bg-outline-variant" aria-hidden />
      <span className="hidden sm:block text-label-sm text-secondary uppercase tracking-widest">Leave</span>
    </Link>
  );
}
