export default function UsersLoading() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-8 w-24 bg-background-subtle rounded animate-pulse" />
        <div className="h-4 w-56 bg-background-subtle rounded animate-pulse mt-1.5" />
      </div>
      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="h-9 w-64 bg-background-subtle rounded-lg animate-pulse" />
        <div className="h-9 w-36 bg-background-subtle rounded-lg animate-pulse" />
      </div>
      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-background-subtle grid grid-cols-6 gap-4">
          {["User", "Role", "Status", "Joined", "Orders", "Actions"].map((h) => (
            <div key={h} className="h-3 bg-background rounded animate-pulse" />
          ))}
        </div>
        {Array(8).fill(null).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-border last:border-0 grid grid-cols-6 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-background-subtle animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-background-subtle rounded animate-pulse" />
                <div className="h-3 bg-background-subtle rounded animate-pulse w-3/4" />
              </div>
            </div>
            {Array(4).fill(null).map((__, j) => (
              <div key={j} className="h-5 w-16 bg-background-subtle rounded-full animate-pulse" />
            ))}
            <div className="flex gap-1 justify-end">
              <div className="h-7 w-20 bg-background-subtle rounded animate-pulse" />
              <div className="h-7 w-16 bg-background-subtle rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
