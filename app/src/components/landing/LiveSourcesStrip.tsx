import { Layers } from "lucide-react";

export function LiveSourcesStrip() {
  const sources = [
    "Greenhouse API",
    "Lever",
    "Y Combinator Jobs",
    "Ashby",
    "Workday",
    "Hacker News",
    "Internshala",
    "Unstop",
    "Devpost",
    "Wellfound",
    "MLH Hackathons",
  ];

  return (
    <section className="border-y border-border/70 bg-card/40 py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ingesting from 50+ Career Networks
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono font-medium text-foreground/80">
            {sources.map((src) => (
              <span
                key={src}
                className="hover:text-primary transition-colors cursor-default"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
