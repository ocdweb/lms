import { calendarConfigured, emailConfigured } from "@/lib/config";
import { Icon } from "./Icon";

export function AppFooter() {
  const parts = [
    emailConfigured() ? "Email notifications connected" : "Email notifications in log mode",
    calendarConfigured() ? "Google Calendar synced" : "Google Calendar not connected",
  ];
  return (
    <footer className="w-full bg-surface-container-low border-t border-surface-container-high py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex items-center gap-2 text-on-surface-variant text-body-sm">
          <Icon name="shield" className="text-base text-secondary" />
          <span>Legacy Media Leave • {parts.join(" • ")}</span>
        </div>
        <div className="text-label-sm text-on-surface-variant">© {new Date().getFullYear()} Legacy Media. Leave Management Portal.</div>
      </div>
    </footer>
  );
}
