"use client";

import { useEffect, useState } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Log {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/logs");
    const data = await res.json().catch(() => ({}));
    setLogs(data.logs ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-foreground-muted mt-1">System activity and security events</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground-muted hover:text-foreground transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array(8).fill(null).map((_,i) => <div key={i} className="h-10 bg-background-subtle rounded-xl animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-foreground-muted"><Shield size={32} className="mx-auto mb-3 opacity-30" /><p>No audit logs found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-background-subtle">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">IP</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Time</th>
              </tr></thead>
              <tbody>{logs.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono font-medium bg-background-subtle border border-border px-2 py-0.5 rounded">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted text-xs">{l.user?.name ?? l.user?.email ?? "System"}</td>
                  <td className="px-4 py-3 text-foreground-muted text-xs">{l.entityType ?? "—"}{l.entityId ? ` #${l.entityId.slice(0,8)}` : ""}</td>
                  <td className="px-4 py-3 text-foreground-muted text-xs font-mono">{l.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-foreground-muted text-xs">{formatDateTime(l.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
