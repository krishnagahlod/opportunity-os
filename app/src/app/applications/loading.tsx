export default function ApplicationsLoading() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-10">
        {/* Header skeleton */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-44 animate-pulse rounded-lg bg-muted/70" />
            <div className="h-4 w-72 animate-pulse rounded bg-muted/40" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-lg bg-muted/60" />
        </div>

        {/* Stats strip skeleton */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border/40 bg-card/40 p-4"
            />
          ))}
        </div>

        {/* Kanban Board skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["Applied", "Interviewing", "Offers", "Archived"].map((col) => (
            <div
              key={col}
              className="flex flex-col rounded-2xl border border-border/40 bg-muted/20 p-3"
            >
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
                <div className="size-5 animate-pulse rounded-full bg-muted/50" />
              </div>

              {/* Cards in column */}
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-xl border border-border/40 bg-card/60 p-3 shadow-sm"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
