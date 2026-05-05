export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="bg-background rounded-xl border border-border p-5 space-y-3">
            <div className="h-3.5 w-20 bg-background-subtle rounded animate-pulse" />
            <div className="h-7 w-28 bg-background-subtle rounded animate-pulse" />
            <div className="h-3 w-16 bg-background-subtle rounded animate-pulse" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array(2).fill(null).map((_, i) => (
          <div key={i} className="bg-background rounded-xl border border-border p-5">
            <div className="h-4 w-32 bg-background-subtle rounded animate-pulse mb-4" />
            <div className="h-48 bg-background-subtle rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-background rounded-xl border border-border p-5 space-y-3">
        <div className="h-4 w-24 bg-background-subtle rounded animate-pulse" />
        {Array(5).fill(null).map((_, i) => (
          <div key={i} className="h-12 bg-background-subtle rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
