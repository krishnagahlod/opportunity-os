export default function SettingsLoading() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-2xl px-4 py-10">
        {/* Header skeleton */}
        <header className="mb-8 space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted/70" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted/40" />
        </header>

        {/* Banner skeleton */}
        <div className="mb-8 h-20 animate-pulse rounded-2xl border border-border/40 bg-muted/20" />

        {/* Form sections skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-card/40 p-6 space-y-4"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-muted/60" />
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted/40" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-muted/30" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-muted/40" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-muted/30" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
