export default function OrdersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-background-subtle rounded animate-pulse" />
        <div className="h-9 w-28 bg-background-subtle rounded animate-pulse" />
      </div>
      {/* Filter bar */}
      <div className="flex gap-3">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-background-subtle rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-background-subtle flex gap-4">
          {Array(7).fill(null).map((_, i) => (
            <div key={i} className="h-3 bg-background rounded animate-pulse flex-1" />
          ))}
        </div>
        {Array(10).fill(null).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-border last:border-0 flex gap-4 items-center">
            {Array(7).fill(null).map((__, j) => (
              <div key={j} className="h-4 bg-background-subtle rounded animate-pulse flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
