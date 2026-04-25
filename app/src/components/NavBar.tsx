import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavBar({
  email,
  isAdmin = false,
}: {
  email: string | null | undefined;
  isAdmin?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Opportunity <span className="text-muted-foreground">OS</span>
            </span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            <NavLink href="/">Feed</NavLink>
            <NavLink href="/saved">Saved</NavLink>
            <NavLink href="/applications">Applications</NavLink>
            {isAdmin && <NavLink href="/admin">Admin</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="hidden text-xs text-muted-foreground transition hover:text-foreground sm:inline"
            title="Settings"
          >
            {email}
          </Link>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
