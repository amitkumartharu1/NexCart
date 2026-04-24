import { AdminUsersTable } from "@/components/admin/users/UsersTable";

export const metadata = { title: "Users — Admin | NexCart" };

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Manage customer accounts and staff
        </p>
      </div>
      <AdminUsersTable />
    </div>
  );
}
