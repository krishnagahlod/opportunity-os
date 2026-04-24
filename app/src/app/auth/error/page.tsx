import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Sign-in failed</h1>
        <p className="text-muted-foreground">
          {message ?? "Something went wrong. Please try again."}
        </p>
        <Link href="/login" className={buttonVariants()}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
