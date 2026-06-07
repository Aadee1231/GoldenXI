import { createClient } from "@/src/lib/supabase/server";

export default async function TestRPCPage() {
  const supabase = await createClient();

  // Get active tournament
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("is_active", true)
    .limit(1);

  const tournamentId = tournaments?.[0]?.id;

  // Test the RPC function
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_public_bracket", {
    username_param: "adimchheda",
    tournament_id_param: tournamentId,
  });

  // Also get profile directly
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", "adimchheda")
    .single();

  // Get bracket directly
  const { data: bracket } = await supabase
    .from("brackets")
    .select("*")
    .eq("user_id", profile?.id)
    .eq("tournament_id", tournamentId)
    .limit(1);

  return (
    <div className="min-h-screen bg-[#080808] p-8 text-white">
      <h1 className="mb-8 text-3xl font-bold text-yellow-400">Test RPC Function</h1>
      
      <div className="space-y-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Tournament Info</h2>
          <pre className="overflow-auto text-sm">
            {JSON.stringify(tournaments, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Profile (Direct Query)</h2>
          <pre className="overflow-auto text-sm">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Bracket (Direct Query)</h2>
          <pre className="overflow-auto text-sm">
            {JSON.stringify(bracket, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">RPC Result (get_public_bracket)</h2>
          {rpcError ? (
            <div>
              <p className="mb-2 text-red-400">Error:</p>
              <pre className="overflow-auto text-sm text-red-300">
                {JSON.stringify(rpcError, null, 2)}
              </pre>
            </div>
          ) : (
            <pre className="overflow-auto text-sm">
              {JSON.stringify(rpcData, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">Analysis</h2>
          <ul className="space-y-2 text-sm">
            <li className={profile?.public_bracket ? "text-green-400" : "text-red-400"}>
              public_bracket: {String(profile?.public_bracket)}
            </li>
            <li className={rpcData && rpcData.length > 0 ? "text-green-400" : "text-red-400"}>
              RPC returned data: {rpcData && rpcData.length > 0 ? "YES" : "NO"}
            </li>
            <li className={!rpcError ? "text-green-400" : "text-red-400"}>
              RPC error: {rpcError ? "YES" : "NO"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
