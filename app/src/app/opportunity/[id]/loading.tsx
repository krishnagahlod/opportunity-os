export default function OpportunityDetailLoading() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        {/* Back link skeleton */}
        <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />

        {/* Hero header */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-2 animate-pulse rounded-full bg-muted/50" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-muted/50" />
          </div>
          <div className="h-8 w-4/5 animate-pulse rounded-lg bg-muted/70" />
          <div className="flex items-center gap-3 pt-1">
            <div className="size-7 animate-pulse rounded-full bg-muted/60" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted/40" />
          </div>
        </div>

        {/* Action bar skeleton */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-muted/60" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted/60" />
          <div className="h-9 w-20 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-muted/70 sm:ml-auto" />
        </div>

        {/* Score breakdown skeleton */}
        <div className="mt-8 rounded-2xl border border-border/40 bg-card/40 p-5">
          <div className="h-4 w-36 animate-pulse rounded bg-muted/60" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/30" />
            ))}
          </div>
        </div>

        {/* Facts strip skeleton */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-border/40 bg-card/30" />
          ))}
        </div>

        {/* Details paragraph skeleton */}
        <div className="mt-8 space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted/30" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-muted/30" />
        </div>
      </main>
    </div>
  );
}
