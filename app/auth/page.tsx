import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import AuthForm from "@/src/components/auth/AuthForm";

type SearchParams = Promise<{ tab?: string; error?: string; message?: string; redirect?: string }>;

export default async function AuthPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const redirectTo = params.redirect ?? null;

  if (user) {
    redirect(redirectTo || "/");
  }

  const tab = params.tab ?? "login";
  const error = params.error ?? null;
  const message = params.message ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-white">
            Welcome to{" "}
            <span className="text-yellow-400">GoldenXI</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in or create an account to build your bracket
          </p>
        </div>
        <AuthForm defaultTab={tab} error={error} message={message} redirect={redirectTo} />
      </div>
    </div>
  );
}
