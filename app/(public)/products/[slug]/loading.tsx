export default function ProductLoading() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3.5 w-16 bg-muted rounded animate-pulse" />
            {i < 2 && <div className="h-3 w-3 bg-muted rounded animate-pulse" />}
          </div>
        ))}
      </div>

      {/* Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-2xl animate-pulse" />
          <div className="flex gap-2">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-5">
          <div className="h-3.5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-9 w-3/4 bg-muted rounded animate-pulse" />
          <div className="flex gap-2">
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="h-4 w-4 bg-muted rounded animate-pulse" />
            ))}
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />

          {/* Variants */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              {Array(3).fill(null).map((_, i) => (
                <div key={i} className="h-9 w-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Qty + CTA */}
          <div className="flex gap-3">
            <div className="h-11 w-28 bg-muted rounded-lg animate-pulse" />
            <div className="h-11 flex-1 bg-muted rounded-lg animate-pulse" />
            <div className="h-11 w-11 bg-muted rounded-lg animate-pulse" />
          </div>

          {/* Features */}
          <div className="space-y-2 pt-2">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3 pt-4">
        {Array(5).fill(null).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${85 - i * 5}%` }} />
        ))}
      </div>
    </div>
  );
}
