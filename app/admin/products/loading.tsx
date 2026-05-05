export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 bg-background-subtle rounded animate-pulse" />
        <div className="h-9 w-32 bg-background-subtle rounded-lg animate-pulse" />
      </div>
      {/* Search + filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="h-9 w-64 bg-background-subtle rounded-lg animate-pulse" />
        <div className="h-9 w-36 bg-background-subtle rounded-lg animate-pulse" />
        <div className="h-9 w-28 bg-background-subtle rounded-lg animate-pulse" />
      </div>
      {/* Product grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array(12).fill(null).map((_, i) => (
          <div key={i} className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="aspect-square bg-background-subtle animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-background-subtle rounded animate-pulse" />
              <div className="h-3 w-20 bg-background-subtle rounded animate-pulse" />
              <div className="flex items-center justify-between mt-3">
                <div className="h-5 w-16 bg-background-subtle rounded animate-pulse" />
                <div className="h-7 w-16 bg-background-subtle rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
