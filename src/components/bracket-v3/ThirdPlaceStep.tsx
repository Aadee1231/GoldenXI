"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { getTeamsByGroup } from "@/src/lib/supabase/queries/group-picks-client";
import { saveThirdPlacePicks, getThirdPlacePicks } from "@/src/lib/supabase/queries/third-place-picks-client";
import { createClient } from "@/src/lib/supabase/client";
import TeamFlag from "@/src/components/ui/TeamFlag";
import type { Team, GroupRankingInput } from "@/src/types";

type ThirdPlaceStepProps = {
  groupRankings: GroupRankingInput[];
  selectedTeamIds: string[];
  onChange: (teamIds: string[]) => void;
  onRegisterSave: (callback: () => Promise<void>) => void;
  onRegisterAutoPick: (callback: () => void) => void;
};

export default function ThirdPlaceStep({
  groupRankings,
  selectedTeamIds,
  onChange,
  onRegisterSave,
  onRegisterAutoPick,
}: ThirdPlaceStepProps) {
  const [thirdPlaceTeams, setThirdPlaceTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [bracketId, setBracketId] = useState<string | null>(null);

  useEffect(() => {
    if (groupRankings.length > 0) {
      loadData();
    }
  }, [groupRankings]);

  useEffect(() => {
    onRegisterSave(handleSave);
    onRegisterAutoPick(handleAutoPick);
    // thirdPlaceTeams is included so auto-pick works from a clean, untouched
    // state as soon as the eligible third-place teams have loaded.
  }, [selectedTeamIds, thirdPlaceTeams, bracketId]);

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
      .select("id")
      .eq("user_id", user.id)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (brackets && brackets.length > 0) {
      setBracketId(brackets[0].id);

      const { data: existingPicks } = await getThirdPlacePicks(brackets[0].id);
      if (existingPicks && existingPicks.length > 0) {
        onChange(existingPicks.map((p) => p.team_id));
      }
    }

    const thirdPlaceRankings = groupRankings.filter((r) => r.position === 3);

    const { data: teamsData } = await getTeamsByGroup(tournamentId);

    if (teamsData) {
      const teams: Team[] = [];
      thirdPlaceRankings.forEach((ranking) => {
        const groupTeams = teamsData[ranking.group_label] || [];
        const team = groupTeams.find((t) => t.id === ranking.team_id);
        if (team) {
          teams.push(team);
        }
      });

      teams.sort((a, b) => (a.group_label || "").localeCompare(b.group_label || ""));
      setThirdPlaceTeams(teams);
    }

    setLoading(false);
  };

  const toggleTeam = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      onChange(selectedTeamIds.filter((id) => id !== teamId));
    } else {
      if (selectedTeamIds.length < 8) {
        onChange([...selectedTeamIds, teamId]);
      }
    }
  };

  const handleSave = async () => {
    if (!bracketId) return;
    await saveThirdPlacePicks(bracketId, selectedTeamIds);
  };

  const handleAutoPick = () => {
    if (thirdPlaceTeams.length < 8) return;

    // Select exactly 8 eligible third-place teams deterministically (by group
    // order), so auto-pick always produces a valid, reproducible selection.
    const picks = thirdPlaceTeams.slice(0, 8).map((t) => t.id);
    onChange(picks);
  };

  const canContinue = selectedTeamIds.length === 8;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading third-place teams...</div>
      </div>
    );
  }

  if (thirdPlaceTeams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">
          Please complete all group rankings first to see third-place teams.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-400 mb-4">
          In the real World Cup 2026 format, the best eight third-place teams advance to the Round
          of 32. For GoldenXI, pick the eight you think will move on.
        </p>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-400">Selected: </span>
            <span
              className={`font-semibold ${
                canContinue ? "text-green-400" : "text-yellow-400"
              }`}
            >
              {selectedTeamIds.length} / 8
            </span>
          </div>
        </div>

        {!canContinue && selectedTeamIds.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <p className="text-sm text-yellow-400">
              Select {8 - selectedTeamIds.length} more team{8 - selectedTeamIds.length !== 1 ? "s" : ""} to continue
            </p>
          </div>
        )}

        {canContinue && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
            <p className="text-sm text-green-400">
              ✓ All 8 teams selected! You can proceed to the knockout bracket.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {thirdPlaceTeams.map((team) => {
          const isSelected = selectedTeamIds.includes(team.id);
          const canSelect = isSelected || selectedTeamIds.length < 8;

          return (
            <button
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              disabled={!canSelect}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? "bg-green-900/30 border-green-600 shadow-lg shadow-green-900/20"
                  : canSelect
                  ? "bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750"
                  : "bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex-shrink-0">
                {isSelected ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-600" />
                )}
              </div>

              <TeamFlag
                name={team.name}
                code={team.code}
                flag_emoji={team.flag_emoji}
                flag_code={team.flag_code}
                size="lg"
              />

              <div className="flex-1 text-left">
                <div className="font-semibold text-white">{team.name}</div>
                <div className="text-xs text-gray-400">
                  Group {team.group_label} • {team.code}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
