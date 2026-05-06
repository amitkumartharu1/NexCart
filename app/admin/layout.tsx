import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/admin/dashboard");
  const role = session.user.role;
  if (!["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(role)) {
    redirect("/");
  }
  return (
    <AdminShell role={role} user={session.user}>
      {children}
    </AdminShell>
  );
}
