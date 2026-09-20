export default function SavedLoading() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-10">
        {/* Header skeleton */}
        <div className="mb-6 space-y-2">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-muted/70" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted/40" />
        </div>

        {/* Saved cards grid skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-52 flex-col justify-between rounded-[1.25rem] border border-border/40 bg-card/40 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted/70" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted/40" />
                </div>
              </div>
              <div className="space-y-1.5 py-3">
                <div className="h-3 w-full animate-pulse rounded bg-muted/30" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted/30" />
              </div>
              <div className="flex items-center justify-between border-t border-border/30 pt-3">
                <div className="h-4 w-16 animate-pulse rounded bg-muted/50" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
