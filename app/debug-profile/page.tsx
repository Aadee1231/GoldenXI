import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DebugProfilePage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/auth");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  return (
    <div className="min-h-screen bg-[#080808] p-8 text-white">
      <h1 className="mb-8 text-3xl font-bold text-yellow-400">Debug Profile Info</h1>
      
      <div className="space-y-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Profile Data</h2>
          {profileError ? (
            <p className="text-red-400">Error: {profileError.message}</p>
          ) : (
            <pre className="overflow-auto text-sm">
              {JSON.stringify(profile, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Bracket Data</h2>
          {bracketError ? (
            <p className="text-red-400">Error: {bracketError.message}</p>
          ) : (
            <pre className="overflow-auto text-sm">
              {JSON.stringify(bracket, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Expected Share URL</h2>
          {profile?.username ? (
            <p className="text-green-400">
              https://goldenxi.vercel.app/u/{profile.username}/bracket
            </p>
          ) : (
            <p className="text-red-400">No username set!</p>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Checklist</h2>
          <ul className="space-y-2">
            <li className={profile?.username ? "text-green-400" : "text-red-400"}>
              ✓ Username exists: {profile?.username || "NO"}
            </li>
            <li className={profile?.public_bracket !== undefined ? "text-green-400" : "text-red-400"}>
              ✓ public_bracket column exists: {profile?.public_bracket !== undefined ? "YES" : "NO"}
            </li>
            <li className={profile?.public_bracket ? "text-green-400" : "text-yellow-400"}>
              ✓ public_bracket enabled: {profile?.public_bracket ? "YES" : "NO"}
            </li>
            <li className={bracket && bracket.length > 0 ? "text-green-400" : "text-red-400"}>
              ✓ Bracket exists: {bracket && bracket.length > 0 ? "YES" : "NO"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
