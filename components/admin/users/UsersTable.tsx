"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  ShieldCheck,
  ShieldOff,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGER"
  | "STAFF"
  | "CUSTOMER";

type UserStatus = "ACTIVE" | "SUSPENDED";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  image: string | null;
  _count: { orders: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_STYLES: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-red-500/10 text-red-600 dark:text-red-400",
  ADMIN: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  MANAGER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  STAFF: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  CUSTOMER: "bg-gray-500/10 text-gray-500 dark:text-gray-400",
};

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
  CUSTOMER: "Customer",
};

const USER_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "STAFF",
  "CUSTOMER",
];

const LIMIT = 20;

export function AdminUsersTable() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
    });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json().catch(() => ({}));
      setUsers(data.users ?? []);
      setPagination(
        data.pagination ?? { page, limit: LIMIT, total: 0, totalPages: 1 }
      );
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    if (newRole === user.role) return;
    const confirmed = confirm(
      `Change ${user.name ?? user.email ?? "this user"}'s role to ${ROLE_LABELS[newRole]}?`
    );
    if (!confirmed) return;
    setActionLoading(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
      await fetchUsers();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus: UserStatus =
      user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const label = newStatus === "SUSPENDED" ? "suspend" : "activate";
    const confirmed = confirm(
      `Are you sure you want to ${label} ${user.name ?? user.email ?? "this user"}?`
    );
    if (!confirmed) return;

    setActionLoading(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(
        `User ${newStatus === "ACTIVE" ? "activated" : "suspended"}`
      );
      await fetchUsers();
    } catch {
      toast.error(`Failed to ${label} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success(`${deleteTarget.name ?? deleteTarget.email ?? "User"} has been deleted`);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string | null, email: string | null): string => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "??";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
        >
          <option value="">All Roles</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Joined
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Orders
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8)
                  .fill(null)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-background-subtle animate-pulse flex-shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-28 bg-background-subtle rounded animate-pulse" />
                            <div className="h-3 w-36 bg-background-subtle rounded animate-pulse" />
                          </div>
                        </div>
                      </td>
                      {Array(4)
                        .fill(null)
                        .map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-background-subtle rounded animate-pulse" />
                          </td>
                        ))}
                      <td className="px-4 py-3">
                        <div className="h-7 w-16 ml-auto bg-background-subtle rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-foreground-muted">
                      <Users size={32} className="opacity-30" />
                      <p>No users found</p>
                      {(search || roleFilter) && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setRoleFilter("");
                            setPage(1);
                          }}
                          className="text-primary text-sm hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-background-subtle/50 transition-colors"
                  >
                    {/* Name / Email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-border flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt={user.name ?? "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-primary">
                              {getInitials(user.name, user.email)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">
                            {user.name ?? "—"}
                          </p>
                          <p className="text-xs text-foreground-muted line-clamp-1">
                            {user.email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={actionLoading === user.id}
                        onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
                          ROLE_STYLES[user.role] ?? "bg-background-subtle text-foreground-muted"
                        )}
                      >
                        {USER_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          user.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        )}
                      >
                        {user.status === "ACTIVE" ? "Active" : "Suspended"}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-foreground-muted text-xs whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3 text-foreground-muted">
                      {user._count.orders}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Suspend / Activate */}
                        <button
                          onClick={() => handleStatusToggle(user)}
                          disabled={actionLoading === user.id}
                          title={user.status === "ACTIVE" ? "Suspend user" : "Activate user"}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50",
                            user.status === "ACTIVE"
                              ? "text-foreground-muted hover:text-amber-500 hover:bg-amber-500/10"
                              : "text-foreground-muted hover:text-emerald-500 hover:bg-emerald-500/10"
                          )}
                        >
                          {user.status === "ACTIVE" ? (
                            <><ShieldOff size={13} /><span>Suspend</span></>
                          ) : (
                            <><ShieldCheck size={13} /><span>Activate</span></>
                          )}
                        </button>

                        {/* Delete — hidden for SUPER_ADMIN targets and self */}
                        {user.role !== "SUPER_ADMIN" && user.id !== session?.user?.id && (
                          <button
                            onClick={() => setDeleteTarget(user)}
                            disabled={actionLoading === user.id}
                            title="Delete user"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-foreground-muted">
              Showing{" "}
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}{" "}
              of {pagination.total} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm text-foreground-muted px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages || loading}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Delete User</h3>
                <p className="text-xs text-foreground-muted mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="rounded-lg bg-background-subtle border border-border p-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                  {getInitials(deleteTarget.name, deleteTarget.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {deleteTarget.name ?? "—"}
                  </p>
                  <p className="text-xs text-foreground-muted truncate">
                    {deleteTarget.email ?? "—"}
                  </p>
                </div>
                <span className={cn(
                  "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                  ROLE_STYLES[deleteTarget.role]
                )}>
                  {ROLE_LABELS[deleteTarget.role]}
                </span>
              </div>
            </div>

            <p className="text-sm text-foreground-muted">
              Permanently deletes this account and all associated data — reviews,
              addresses, wishlist, and cart. Orders will be anonymised and kept for records.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-background-subtle transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Trash2 size={13} />
                {deleting ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
