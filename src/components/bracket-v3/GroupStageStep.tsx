"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { getTeamsByGroup } from "@/src/lib/supabase/queries/group-picks-client";
import { saveGroupRankings, getGroupRankings } from "@/src/lib/supabase/queries/group-picks-client";
import { createClient } from "@/src/lib/supabase/client";
import TeamFlag from "@/src/components/ui/TeamFlag";
import type { Team, GroupRankingInput } from "@/src/types";

const GROUP_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

type GroupCardProps = {
  groupLabel: string;
  teams: Team[];
  rankedTeams: Team[];
  onRankChange: (groupLabel: string, teams: Team[]) => void;
};

function GroupCard({ groupLabel, teams, rankedTeams, onRankChange }: GroupCardProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newRanked = [...rankedTeams];
    const [draggedTeam] = newRanked.splice(draggedIndex, 1);
    newRanked.splice(dropIndex, 0, draggedTeam);
    
    onRankChange(groupLabel, newRanked);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newRanked = [...rankedTeams];
    [newRanked[index - 1], newRanked[index]] = [newRanked[index], newRanked[index - 1]];
    onRankChange(groupLabel, newRanked);
  };

  const moveDown = (index: number) => {
    if (index === rankedTeams.length - 1) return;
    const newRanked = [...rankedTeams];
    [newRanked[index], newRanked[index + 1]] = [newRanked[index + 1], newRanked[index]];
    onRankChange(groupLabel, newRanked);
  };

  const isComplete = rankedTeams.length === 4;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Group {groupLabel}</h3>
        {isComplete && (
          <span className="text-xs font-semibold px-2 py-1 rounded bg-green-600 text-white">
            Complete
          </span>
        )}
      </div>

      <div className="space-y-2">
        {rankedTeams.map((team, index) => {
          const position = index + 1;
          let badge = "";
          let badgeColor = "";

          if (position === 1 || position === 2) {
            badge = "Qualified";
            badgeColor = "bg-green-600";
          } else if (position === 3) {
            badge = "3rd Place Pool";
            badgeColor = "bg-blue-600";
          } else {
            badge = "Eliminated";
            badgeColor = "bg-red-600";
          }

          return (
            <div
              key={team.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 bg-gray-900 rounded-lg p-3 border-2 transition-all sm:cursor-move ${
                draggedIndex === index
                  ? "opacity-50 border-yellow-400"
                  : dragOverIndex === index
                  ? "border-yellow-400"
                  : "border-gray-700"
              }`}
            >
              <div className="hidden sm:block text-gray-500 cursor-grab active:cursor-grabbing shrink-0">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded font-bold text-white">
                  {position}
                </div>
                <TeamFlag
                  name={team.name}
                  code={team.code}
                  flag_emoji={team.flag_emoji}
                  flag_code={team.flag_code}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{team.name}</div>
                  <div className="text-xs text-gray-400">{team.code}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor} text-white whitespace-nowrap shrink-0`}>
                  {badge}
                </span>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className={`p-1 rounded transition-colors ${
                    index === 0
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                  aria-label="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === rankedTeams.length - 1}
                  className={`p-1 rounded transition-colors ${
                    index === rankedTeams.length - 1
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                  aria-label="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type GroupStageStepProps = {
  rankings: GroupRankingInput[];
  onChange: (rankings: GroupRankingInput[]) => void;
  onRegisterSave: (callback: () => Promise<void>) => void;
  onRegisterAutoPick: (callback: () => void) => void;
};

export default function GroupStageStep({ rankings, onChange, onRegisterSave, onRegisterAutoPick }: GroupStageStepProps) {
  const [teamsByGroup, setTeamsByGroup] = useState<Record<string, Team[]>>({});
  const [rankedTeamsByGroup, setRankedTeamsByGroup] = useState<Record<string, Team[]>>({});
  const [loading, setLoading] = useState(true);
  const [bracketId, setBracketId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    onRegisterSave(handleSave);
    onRegisterAutoPick(handleAutoPick);
    // teamsByGroup is included so auto-pick works from a clean state as soon as
    // teams have loaded (before any manual reordering).
  }, [rankedTeamsByGroup, teamsByGroup, bracketId]);

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

    let userBracketId: string | null = null;
    const { data: brackets } = await supabase
      .from("brackets")
      .select("id")
      .eq("user_id", user.id)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (brackets && brackets.length > 0) {
      userBracketId = brackets[0].id;
      setBracketId(userBracketId);
    } else {
      const { data: newBracket } = await supabase
        .from("brackets")
        .insert({
          user_id: user.id,
          tournament_id: tournamentId,
          name: "My Bracket",
          status: "draft",
        })
        .select()
        .single();

      if (newBracket) {
        userBracketId = newBracket.id;
        setBracketId(userBracketId);
      }
    }

    const { data: teamsData } = await getTeamsByGroup(tournamentId);

    if (teamsData) {
      setTeamsByGroup(teamsData);

      if (userBracketId) {
        const { data: existingRankings } = await getGroupRankings(userBracketId);

        if (existingRankings && existingRankings.length > 0) {
          const ranked: Record<string, Team[]> = {};

          GROUP_LABELS.forEach((label) => {
            const groupRankings = existingRankings
              .filter((r) => r.group_label === label)
              .sort((a, b) => a.position - b.position);

            ranked[label] = groupRankings
              .map((r) => {
                const allTeams = teamsData[label] || [];
                return allTeams.find((t) => t.id === r.team_id);
              })
              .filter((t): t is Team => t !== undefined);
          });

          setRankedTeamsByGroup(ranked);

          const rankingsInput: GroupRankingInput[] = [];
          Object.entries(ranked).forEach(([label, teams]) => {
            teams.forEach((team, index) => {
              rankingsInput.push({
                group_label: label,
                team_id: team.id,
                position: index + 1,
              });
            });
          });
          onChange(rankingsInput);
        } else {
          const initialRanked: Record<string, Team[]> = {};
          GROUP_LABELS.forEach((label) => {
            initialRanked[label] = teamsData[label] || [];
          });
          setRankedTeamsByGroup(initialRanked);
        }
      } else {
        const initialRanked: Record<string, Team[]> = {};
        GROUP_LABELS.forEach((label) => {
          initialRanked[label] = teamsData[label] || [];
        });
        setRankedTeamsByGroup(initialRanked);
      }
    }

    setLoading(false);
  };

  const handleRankChange = (groupLabel: string, teams: Team[]) => {
    const updated = { ...rankedTeamsByGroup, [groupLabel]: teams };
    setRankedTeamsByGroup(updated);

    const rankingsInput: GroupRankingInput[] = [];
    Object.entries(updated).forEach(([label, groupTeams]) => {
      groupTeams.forEach((team, index) => {
        rankingsInput.push({
          group_label: label,
          team_id: team.id,
          position: index + 1,
        });
      });
    });

    onChange(rankingsInput);
  };

  const handleSave = async () => {
    if (!bracketId) return;

    const rankingsInput: GroupRankingInput[] = [];
    Object.entries(rankedTeamsByGroup).forEach(([label, teams]) => {
      teams.forEach((team, index) => {
        rankingsInput.push({
          group_label: label,
          team_id: team.id,
          position: index + 1,
        });
      });
    });

    await saveGroupRankings(bracketId, rankingsInput);
  };

  const handleAutoPick = () => {
    const randomized: Record<string, Team[]> = {};
    
    GROUP_LABELS.forEach((label) => {
      const teams = [...(teamsByGroup[label] || [])];
      for (let i = teams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teams[i], teams[j]] = [teams[j], teams[i]];
      }
      randomized[label] = teams;
    });

    setRankedTeamsByGroup(randomized);

    const rankingsInput: GroupRankingInput[] = [];
    Object.entries(randomized).forEach(([label, teams]) => {
      teams.forEach((team, index) => {
        rankingsInput.push({
          group_label: label,
          team_id: team.id,
          position: index + 1,
        });
      });
    });

    onChange(rankingsInput);
  };

  const completedGroups = GROUP_LABELS.filter(
    (label) => rankedTeamsByGroup[label]?.length === 4
  ).length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading teams...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-400 mb-4 text-sm">
          Rank the 4 teams in each group using the arrows. Top 2 qualify automatically; 3rd place enters the selection pool.
        </p>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-400">Progress: </span>
            <span className="font-semibold text-white">
              {completedGroups} / 12 groups completed
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GROUP_LABELS.map((label) => (
          <GroupCard
            key={label}
            groupLabel={label}
            teams={teamsByGroup[label] || []}
            rankedTeams={rankedTeamsByGroup[label] || []}
            onRankChange={handleRankChange}
          />
        ))}
      </div>
    </div>
  );
}
