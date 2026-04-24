import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Opportunity OS</h1>
          <p className="mt-2 text-muted-foreground">
            Your personal discovery engine for opportunities that matter.
          </p>
        </div>

        <LoginForm next={params.next} />

        {params.message && (
          <p className="mt-4 text-center text-sm text-emerald-600 dark:text-emerald-400">
            {params.message}
          </p>
        )}
        {params.error && (
          <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
            {params.error}
          </p>
        )}
      </div>
    </div>
  );
}
