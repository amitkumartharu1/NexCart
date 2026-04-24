import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/dashboard/profile");
  return (
    <>
      <Navbar />
      <div className="container-wide pt-24 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          <DashboardSidebar user={session.user} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}
