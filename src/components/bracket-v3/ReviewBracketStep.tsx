"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Share2, CheckCircle2, AlertCircle } from "lucide-react";
import { validateBracketComplete, lockBracket, unlockBracket } from "@/src/lib/supabase/queries/brackets-client";
import { getTeamsByGroup } from "@/src/lib/supabase/queries/group-picks-client";
import { createClient } from "@/src/lib/supabase/client";
import type { BracketWizardState, Team } from "@/src/types";

type ReviewBracketStepProps = {
  wizardState: BracketWizardState;
  onRegisterSave: (callback: () => Promise<void>) => void;
};

export default function ReviewBracketStep({ wizardState, onRegisterSave }: ReviewBracketStepProps) {
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

          const { data: teamsData } = await getTeamsByGroup(tournamentId);
          if (teamsData && championId) {
            let foundChampion: Team | null = null;
            Object.values(teamsData).forEach((groupTeams) => {
              const team = groupTeams.find((t) => t.id === championId);
              if (team) foundChampion = team;
            });
            setChampion(foundChampion);
          }
        }

        const { data: sfMatches } = await supabase
          .from("matches")
          .select("*")
          .eq("tournament_id", tournamentId)
          .eq("round", "sf");

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

            const finalistId = champion?.id === sf1Winner ? sf2Winner : sf1Winner;

            const { data: teamsData } = await getTeamsByGroup(tournamentId);
            if (teamsData && finalistId) {
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

  const handleShare = async () => {
    if (!bracketId) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (profile?.username) {
      const shareUrl = `${window.location.origin}/u/${profile.username}/bracket`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: "My GoldenXI Bracket",
            text: "Check out my World Cup 2026 bracket!",
            url: shareUrl,
          });
        } catch (err) {
          await navigator.clipboard.writeText(shareUrl);
          setMessage("✓ Link copied to clipboard!");
          setTimeout(() => setMessage(""), 3000);
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setMessage("✓ Link copied to clipboard!");
        setTimeout(() => setMessage(""), 3000);
      }
    }
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
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Review Your Bracket</h2>
        <p className="text-gray-400 mb-4">
          Review your selections and lock your bracket when ready.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg border-2 ${
            groupsComplete
              ? "bg-green-900/20 border-green-600"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {groupsComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
            <h3 className="font-semibold text-white">Group Rankings</h3>
          </div>
          <div className="text-2xl font-bold text-white">
            {validation?.counts.groupPicks || 0} / 48
          </div>
          <div className="text-xs text-gray-400">12 groups × 4 positions</div>
        </div>

        <div
          className={`p-4 rounded-lg border-2 ${
            thirdPlaceComplete
              ? "bg-green-900/20 border-green-600"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {thirdPlaceComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
            <h3 className="font-semibold text-white">Third-Place Picks</h3>
          </div>
          <div className="text-2xl font-bold text-white">
            {validation?.counts.thirdPlacePicks || 0} / 8
          </div>
          <div className="text-xs text-gray-400">Advancing teams</div>
        </div>

        <div
          className={`p-4 rounded-lg border-2 ${
            knockoutComplete
              ? "bg-green-900/20 border-green-600"
              : "bg-gray-800 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {knockoutComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
            <h3 className="font-semibold text-white">Knockout Picks</h3>
          </div>
          <div className="text-2xl font-bold text-white">
            {validation?.counts.knockoutPicks || 0} / 31
          </div>
          <div className="text-xs text-gray-400">R32 through Final</div>
        </div>
      </div>

      {champion && (
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-2 border-yellow-600 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">🏆 Your Champion</h3>
          <div className="flex items-center gap-4">
            <div className="text-6xl">{champion.flag_emoji || "🏴"}</div>
            <div>
              <div className="text-3xl font-bold text-white">{champion.name}</div>
              <div className="text-gray-400">{champion.code}</div>
            </div>
          </div>
          {finalist && (
            <div className="mt-4 pt-4 border-t border-yellow-600/30">
              <div className="text-sm text-gray-400 mb-2">Runner-up:</div>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{finalist.flag_emoji || "🏴"}</div>
                <div className="text-xl font-semibold text-white">{finalist.name}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isComplete && validation && validation.errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-400 mb-2">Incomplete Bracket</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {isComplete && !isLocked && (
        <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 mb-6">
          <p className="text-green-400">
            ✓ Your bracket is complete! You can lock it now to finalize your picks.
          </p>
        </div>
      )}

      {isLocked && (
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-6">
          <p className="text-blue-400">
            🔒 Your bracket is locked. No further changes can be made until you unlock it.
          </p>
        </div>
      )}

      {message && (
        <div
          className={`mb-6 p-3 rounded-lg ${
            message.startsWith("✓")
              ? "bg-green-900/20 border border-green-600/30 text-green-400"
              : "bg-red-900/20 border border-red-600/30 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!isLocked ? (
          <button
            onClick={handleLock}
            disabled={!isComplete || actionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-5 h-5" />
            {actionLoading ? "Locking..." : "Lock Bracket"}
          </button>
        ) : (
          <button
            onClick={handleUnlock}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Unlock className="w-5 h-5" />
            {actionLoading ? "Unlocking..." : "Unlock Bracket"}
          </button>
        )}

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Share Bracket
        </button>
      </div>
    </div>
  );
}
