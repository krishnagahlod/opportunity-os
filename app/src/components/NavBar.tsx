"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings as SettingsIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NavBar({
  email,
  isAdmin = false,
}: {
  email: string | null | undefined;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-5 sm:gap-7">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Opportunity <span className="text-muted-foreground">OS</span>
            </span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            <NavLink href="/" pathname={pathname}>Feed</NavLink>
            <NavLink href="/saved" pathname={pathname}>Saved</NavLink>
            <NavLink href="/applications" pathname={pathname}>Applications</NavLink>
            <NavLink href="/submit" pathname={pathname}>Submit</NavLink>
            {isAdmin && (
              <NavLink href="/admin" pathname={pathname}>Admin</NavLink>
            )}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Desktop: email links to settings; Mobile: tiny Settings icon button */}
          <Link
            href="/settings"
            className="hidden max-w-[160px] truncate text-xs text-muted-foreground transition hover:text-foreground sm:inline"
            title="Settings"
          >
            {email}
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground sm:hidden"
          >
            <SettingsIcon className="size-4" />
          </Link>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>
      {/* Mobile-only secondary nav row — top-level links visible without a hamburger */}
      <nav className="flex gap-1 overflow-x-auto border-t border-border/60 px-3 py-1.5 sm:hidden">
        <NavLink href="/" pathname={pathname}>Feed</NavLink>
        <NavLink href="/saved" pathname={pathname}>Saved</NavLink>
        <NavLink href="/applications" pathname={pathname}>Apps</NavLink>
        <NavLink href="/submit" pathname={pathname}>Submit</NavLink>
        {isAdmin && (
          <NavLink href="/admin" pathname={pathname}>Admin</NavLink>
        )}
      </nav>
    </header>
  );
}

function NavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string | null;
  children: React.ReactNode;
}) {
  // Active when path equals href (root) or starts with href (sub-routes)
  const isActive =
    href === "/" ? pathname === "/" : (pathname ?? "").startsWith(href);
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
