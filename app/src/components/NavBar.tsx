import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NavBar({
  email,
  isAdmin = false,
}: {
  email: string | null | undefined;
  isAdmin?: boolean;
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Opportunity OS
          </Link>
          <nav className="hidden gap-4 text-sm text-muted-foreground sm:flex">
            <Link href="/" className="hover:text-foreground">
              Feed
            </Link>
            <Link href="/saved" className="hover:text-foreground">
              Saved
            </Link>
            <Link href="/applications" className="hover:text-foreground">
              Applications
            </Link>
            {isAdmin && (
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {email}
          </span>
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
