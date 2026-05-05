export default function BillingLoading() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* POS panel skeleton */}
      <div className="xl:col-span-2 space-y-4">
        <div className="bg-background rounded-xl border border-border p-5 space-y-4">
          <div className="h-5 w-32 bg-background-subtle rounded animate-pulse" />
          <div className="h-10 bg-background-subtle rounded-lg animate-pulse" />
          <div className="space-y-2">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="h-14 bg-background-subtle rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 bg-background-subtle rounded animate-pulse" />
                <div className="h-4 w-24 bg-background-subtle rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-11 bg-background-subtle rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Bills history skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-28 bg-background-subtle rounded animate-pulse" />
        {Array(6).fill(null).map((_, i) => (
          <div key={i} className="bg-background rounded-xl border border-border p-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-background-subtle rounded animate-pulse" />
              <div className="h-4 w-16 bg-background-subtle rounded animate-pulse" />
            </div>
            <div className="h-3 w-32 bg-background-subtle rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
