import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/Icon";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // A signed-in user skips the form; a stale cookie for a removed user falls through to it
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary text-on-primary p-12">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/legacy-media-logo-white.png" alt="Legacy Media" className="h-9 w-auto" />
          <span className="h-6 w-px bg-on-primary-container" aria-hidden />
          <span className="text-label-sm uppercase tracking-widest text-secondary-fixed-dim">Leave</span>
        </div>
        <div className="relative z-10 max-w-md space-y-6">
          <span className="text-label-sm uppercase tracking-widest text-secondary-fixed-dim">Mindful Wellbeing</span>
          <p className="text-headline-lg">“Taking deliberate rest restores your finest focus.”</p>
          <ul className="space-y-3 text-body-sm text-inverse-primary">
            <li className="flex items-center gap-2"><Icon name="beach_access" className="text-secondary-fixed-dim text-lg" /> Book annual, casual, sick, birthday and Eid leave</li>
            <li className="flex items-center gap-2"><Icon name="mark_email_read" className="text-secondary-fixed-dim text-lg" /> Instant email updates on every decision</li>
            <li className="flex items-center gap-2"><Icon name="calendar_month" className="text-secondary-fixed-dim text-lg" /> Approved leave synced to Google Calendar</li>
          </ul>
        </div>
        <div className="text-label-sm text-on-primary-container">© {new Date().getFullYear()} Legacy Media</div>
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-secondary/40 blur-3xl pointer-events-none" />
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/legacy-media-logo-dark.png" alt="Legacy Media" className="h-8 w-auto lg:hidden" />
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low text-secondary text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              LEAVE PORTAL
            </div>
            <h1 className="text-headline-xl-mobile sm:text-headline-xl">Welcome back.</h1>
            <p className="text-body-md text-on-surface-variant">Sign in with your Legacy Media account to manage your time off.</p>
          </div>
          <div className="card p-6 sm:p-8">
            <LoginForm next={next} />
          </div>
          <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
            <Icon name="help" className="text-base text-secondary" />
            Forgot your password? Ask your Admin to reset it.
          </p>
        </div>
      </section>
    </main>
  );
}
