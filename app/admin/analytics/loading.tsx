export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 bg-background-subtle rounded animate-pulse" />
        <div className="h-9 w-36 bg-background-subtle rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="bg-background rounded-xl border border-border p-5 space-y-3">
            <div className="h-3.5 w-24 bg-background-subtle rounded animate-pulse" />
            <div className="h-8 w-20 bg-background-subtle rounded animate-pulse" />
            <div className="h-3 w-28 bg-background-subtle rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="bg-background rounded-xl border border-border p-5">
            <div className="h-4 w-36 bg-background-subtle rounded animate-pulse mb-4" />
            <div className="h-56 bg-background-subtle rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
