export default function ShopLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="flex gap-6">
        {/* Sidebar filters */}
        <div className="hidden lg:block w-56 shrink-0 space-y-4">
          {Array(4).fill(null).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              {Array(4).fill(null).map((__, j) => (
                <div key={j} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
        {/* Product grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(16).fill(null).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="h-5 w-16 bg-muted rounded animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
