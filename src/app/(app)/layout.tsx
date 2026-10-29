import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <AppHeader user={user} />
      <main className="w-full pt-20 min-h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-10">{children}</div>
      </main>
      <AppFooter />
    </>
  );
}
