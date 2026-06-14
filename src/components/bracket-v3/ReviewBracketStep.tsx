"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, CheckCircle2, AlertCircle, Edit, RotateCcw } from "lucide-react";
import { validateBracketComplete, lockBracket, unlockBracket } from "@/src/lib/supabase/queries/brackets-client";
import { getTeamsByGroup } from "@/src/lib/supabase/queries/group-picks-client";
import { createClient } from "@/src/lib/supabase/client";
import TeamFlag from "@/src/components/ui/TeamFlag";
import type { BracketWizardState, Team } from "@/src/types";

type ReviewBracketStepProps = {
  wizardState: BracketWizardState;
  onRegisterSave: (callback: () => Promise<void>) => void;
  onNavigate?: (step: "groups" | "third-place" | "knockout") => void;
};

export default function ReviewBracketStep({ wizardState, onRegisterSave, onNavigate }: ReviewBracketStepProps) {
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    counts: {
      groupPicks: number;
      thirdPlacePicks: number;
      knockoutPicks: number;
      total: number;
    };
  } | null>(null);
  const [bracketId, setBracketId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [champion, setChampion] = useState<Team | null>(null);
  const [finalist, setFinalist] = useState<Team | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    onRegisterSave(async () => {});
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tournaments } = await supabase
      .from("tournaments")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    if (!tournaments || tournaments.length === 0) {
      setLoading(false);
      return;
    }

    const tournamentId = tournaments[0].id;

    const { data: brackets } = await supabase
      .from("brackets")
      .select("*")
      .eq("user_id", user.id)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (brackets && brackets.length > 0) {
      const bracket = brackets[0];
      setBracketId(bracket.id);
      setIsLocked(bracket.is_locked || false);

      const validationResult = await validateBracketComplete(bracket.id);
      setValidation(validationResult);

      const { data: knockoutMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("round", "final")
        .limit(1);

      if (knockoutMatches && knockoutMatches.length > 0) {
        const finalMatch = knockoutMatches[0];
        const { data: picks } = await supabase
          .from("bracket_picks")
          .select("*")
          .eq("bracket_id", bracket.id)
          .eq("match_id", finalMatch.id)
          .limit(1);

        if (picks && picks.length > 0) {
          const championId = picks[0].picked_team_id;

          // Get semifinal picks first to determine the runner-up
          const { data: sfMatches } = await supabase
            .from("matches")
            .select("*")
            .eq("tournament_id", tournamentId)
            .eq("round", "sf");

          let finalistId: string | null = null;

          if (sfMatches && sfMatches.length > 0) {
            const { data: sfPicks } = await supabase
              .from("bracket_picks")
              .select("*")
              .eq("bracket_id", bracket.id)
              .in(
                "match_id",
                sfMatches.map((m) => m.id)
              );

            if (sfPicks && sfPicks.length === 2) {
              const sf1Winner = sfPicks[0].picked_team_id;
              const sf2Winner = sfPicks[1].picked_team_id;

              // The runner-up is the semifinal winner who is NOT the champion
              finalistId = championId === sf1Winner ? sf2Winner : sf1Winner;
            }
          }

          // Now fetch team data for both champion and finalist
          const { data: teamsData } = await getTeamsByGroup(tournamentId);
          if (teamsData) {
            if (championId) {
              let foundChampion: Team | null = null;
              Object.values(teamsData).forEach((groupTeams) => {
                const team = groupTeams.find((t) => t.id === championId);
                if (team) foundChampion = team;
              });
              setChampion(foundChampion);
            }

            if (finalistId) {
              let foundFinalist: Team | null = null;
              Object.values(teamsData).forEach((groupTeams) => {
                const team = groupTeams.find((t) => t.id === finalistId);
                if (team) foundFinalist = team;
              });
              setFinalist(foundFinalist);
            }
          }
        }
      }
    }

    setLoading(false);
  };

  const handleLock = async () => {
    if (!bracketId) return;

    setActionLoading(true);
    setMessage("");

    const result = await lockBracket(bracketId);

    if (result.success) {
      setIsLocked(true);
      setMessage("✓ Bracket locked successfully!");
    } else {
      setMessage(`✗ ${result.error}`);
    }

    setActionLoading(false);
  };

  const handleUnlock = async () => {
    if (!bracketId) return;

    setActionLoading(true);
    setMessage("");

    const result = await unlockBracket(bracketId);

    if (result.success) {
      setIsLocked(false);
      setMessage("✓ Bracket unlocked. You can now edit your picks.");
    } else {
      setMessage(`✗ ${result.error}`);
    }

    setActionLoading(false);
  };

  const handleReset = async () => {
    if (!bracketId) return;

    setActionLoading(true);
    const supabase = createClient();

    await supabase.from("bracket_group_picks").delete().eq("bracket_id", bracketId);
    await supabase.from("bracket_third_place_picks").delete().eq("bracket_id", bracketId);
    await supabase.from("bracket_picks").delete().eq("bracket_id", bracketId);

    setShowResetConfirm(false);
    setMessage("✓ Bracket reset successfully. Redirecting...");
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading bracket summary...</div>
      </div>
    );
  }

  const isComplete = validation?.valid || false;
  const groupsComplete = validation?.counts.groupPicks === 48;
  const thirdPlaceComplete = validation?.counts.thirdPlacePicks === 8;
  const knockoutComplete = validation?.counts.knockoutPicks === 31;

  return (
    <div className="pb-safe">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Review Your Bracket</h2>
        <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
          Review your selections and lock your bracket when ready.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div
          className={`p-3 sm:p-4 rounded-lg border-2 ${
            groupsComplete
              ? "bg-green-900/20 border-green-600"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {groupsComplete ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            )}
            <h3 className="font-semibold text-white text-sm sm:text-base">Group Rankings</h3>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {validation?.counts.groupPicks || 0} / 48
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400">12 groups × 4 positions</div>
        </div>

        <div
          className={`p-3 sm:p-4 rounded-lg border-2 ${
            thirdPlaceComplete
              ? "bg-green-900/20 border-green-600"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {thirdPlaceComplete ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            )}
            <h3 className="font-semibold text-white text-sm sm:text-base">Third-Place Picks</h3>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {validation?.counts.thirdPlacePicks || 0} / 8
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400">Advancing teams</div>
        </div>

        <div
          className={`p-3 sm:p-4 rounded-lg border-2 ${
            knockoutComplete
              ? "bg-green-900/20 border-green-600"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {knockoutComplete ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            )}
            <h3 className="font-semibold text-white text-sm sm:text-base">Knockout Picks</h3>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {validation?.counts.knockoutPicks || 0} / 31
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400">R32 through Final</div>
        </div>
      </div>

      {!isLocked && (
        <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate?.("groups")}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            Edit Bracket
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-900/30 text-red-400 rounded-lg font-medium hover:bg-red-900/50 transition-colors border border-red-600/30 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Bracket
          </button>
        </div>
      )}

      {champion && (
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-2 border-yellow-600 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-yellow-400 mb-3 sm:mb-4">🏆 Your Champion</h3>
          <div className="flex items-center gap-3 sm:gap-4">
            <TeamFlag
              name={champion.name}
              code={champion.code}
              flag_emoji={champion.flag_emoji}
              flag_code={champion.flag_code}
              size="lg"
            />
            <div>
              <div className="text-xl sm:text-3xl font-bold text-white">{champion.name}</div>
              <div className="text-gray-400 text-sm">{champion.code}</div>
            </div>
          </div>
          {finalist && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-yellow-600/30">
              <div className="text-xs sm:text-sm text-gray-400 mb-2">Runner-up:</div>
              <div className="flex items-center gap-2 sm:gap-3">
                <TeamFlag
                  name={finalist.name}
                  code={finalist.code}
                  flag_emoji={finalist.flag_emoji}
                  flag_code={finalist.flag_code}
                  size="md"
                />
                <div className="text-base sm:text-xl font-semibold text-white">{finalist.name}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isComplete && validation && validation.errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <h3 className="font-semibold text-red-400 mb-2 text-sm sm:text-base">Incomplete Bracket</h3>
          <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {isComplete && !isLocked && (
        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-green-400 text-xs sm:text-sm">
            ✓ Your bracket is complete! You can lock it now to finalize your picks.
          </p>
        </div>
      )}

      {isLocked && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-blue-400 text-xs sm:text-sm">
            🔒 Your bracket is locked. No further changes can be made until you unlock it.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`mb-4 sm:mb-6 p-2.5 sm:p-3 rounded-lg ${
            message.startsWith("✓")
              ? "bg-green-900/20 border border-green-600/30 text-green-400"
              : "bg-red-900/20 border border-red-600/30 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 pb-safe">
        {!isLocked ? (
          <button
            onClick={handleLock}
            disabled={!isComplete || actionLoading}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px]"
          >
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            {actionLoading ? "Locking..." : "Lock Bracket"}
          </button>
        ) : (
          <button
            onClick={handleUnlock}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px]"
          >
            <Unlock className="w-4 h-4 sm:w-5 sm:h-5" />
            {actionLoading ? "Unlocking..." : "Unlock Bracket"}
          </button>
        )}
      </div>

      <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500">
        By submitting a bracket, your display name and picks may appear publicly on the leaderboard.
      </p>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 rounded-lg border border-red-600/30 p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Reset Bracket?</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              This will delete all your picks (group rankings, third-place selections, and knockout picks). This action cannot be undone.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={actionLoading}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={actionLoading}
                className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
              >
                {actionLoading ? "Resetting..." : "Reset Bracket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
