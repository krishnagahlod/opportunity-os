export default function FeedLoading() {
  return (
    <div className="min-h-screen">
      {/* Top filter / search skeleton */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search bar skeleton */}
            <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-muted/60" />
            {/* View switcher & filters */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-24 animate-pulse rounded-lg bg-muted/50" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-muted/50" />
            </div>
          </div>
          {/* Category pills skeleton */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-20 shrink-0 animate-pulse rounded-full bg-muted/40"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main card grid skeleton */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-56 flex-col justify-between rounded-[1.25rem] border border-border/40 bg-card/40 p-4 backdrop-blur-sm"
            >
              {/* Card top */}
              <div className="flex items-start gap-3">
                <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted/70" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted/40" />
                </div>
              </div>

              {/* Card body snippet */}
              <div className="space-y-1.5 py-3">
                <div className="h-3 w-full animate-pulse rounded bg-muted/30" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted/30" />
              </div>

              {/* Card footer */}
              <div className="flex items-center justify-between border-t border-border/30 pt-3">
                <div className="h-5 w-16 animate-pulse rounded bg-muted/50" />
                <div className="h-5 w-20 animate-pulse rounded bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
