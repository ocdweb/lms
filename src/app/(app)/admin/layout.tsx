import { requireAdmin } from "@/lib/auth";
import { AdminTabs } from "./AdminTabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminTabs />
      {children}
    </>
  );
}
