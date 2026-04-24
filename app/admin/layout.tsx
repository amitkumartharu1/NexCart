import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/admin/dashboard");
  const role = session.user.role;
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(role)) {
    redirect("/");
  }
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 bg-background-subtle">
          {children}
        </main>
      </div>
    </div>
  );
}
