/**
 * Bracket Slot Resolver
 * 
 * Helper functions to resolve bracket slots from group rankings and third-place assignments.
 * Converts slot codes like "1A", "2B", "3C" into actual team data.
 */

import type { Team, GroupRankingInput } from "@/src/types";
import type { BracketSlot, GroupLabel } from "./knockout-template";
import type { ThirdPlaceAssignments } from "./third-place-mapping";

export type QualifiedTeam = Team & { 
  seed: string;
  slotLabel: string; // e.g., "1A", "2B", "3C"
};

export type TeamsDataByGroup = Record<string, Team[]>;

/**
 * Get a team by group position from group rankings
 * 
 * @param groupRankings - Array of group ranking inputs
 * @param teamsData - Teams organized by group
 * @param groupLabel - The group label (A-L)
 * @param position - Position in group (1, 2, or 3)
 * @returns The qualified team with seed information, or null if not found
 */
export function getTeamByGroupPosition(
  groupRankings: GroupRankingInput[],
  teamsData: TeamsDataByGroup,
  groupLabel: GroupLabel,
  position: 1 | 2 | 3
): QualifiedTeam | null {
  const ranking = groupRankings.find(
    (r) => r.group_label === groupLabel && r.position === position
  );

  if (!ranking) {
    return null;
  }

  const groupTeams = teamsData[groupLabel] || [];
  const team = groupTeams.find((t) => t.id === ranking.team_id);

  if (!team) {
    return null;
  }

  return {
    ...team,
    seed: `${groupLabel}${position}`,
    slotLabel: `${position}${groupLabel}`,
  };
}

/**
 * Get a third-place team by group label
 * 
 * @param groupRankings - Array of group ranking inputs
 * @param teamsData - Teams organized by group
 * @param groupLabel - The group label (A-L)
 * @returns The qualified team with seed information, or null if not found
 */
export function getThirdPlaceTeamByGroup(
  groupRankings: GroupRankingInput[],
  teamsData: TeamsDataByGroup,
  groupLabel: GroupLabel
): QualifiedTeam | null {
  return getTeamByGroupPosition(groupRankings, teamsData, groupLabel, 3);
}

/**
 * Resolve a bracket slot to an actual team
 * 
 * @param slotCode - The slot code (e.g., "1A", "2B", "3_vs_1E")
 * @param groupRankings - Array of group ranking inputs
 * @param teamsData - Teams organized by group
 * @param thirdPlaceAssignments - Mapping of third-place slots to groups
 * @returns The qualified team, or null if not found
 */
export function resolveBracketSlot(
  slotCode: BracketSlot | string,
  groupRankings: GroupRankingInput[],
  teamsData: TeamsDataByGroup,
  thirdPlaceAssignments: ThirdPlaceAssignments
): QualifiedTeam | null {
  // Handle third-place slots (new format: "3_vs_1E" maps to assignments.vs1E)
  if (slotCode.startsWith("3_vs_1")) {
    const groupWinner = slotCode.replace("3_vs_", ""); // "3_vs_1E" -> "1E"
    const annexCKey = `vs${groupWinner}` as keyof ThirdPlaceAssignments; // "vs1E"
    const groupLabel = thirdPlaceAssignments[annexCKey];
    
    if (!groupLabel) {
      console.error(`No group assigned to ${slotCode} (Annex C key: ${annexCKey})`);
      return null;
    }
    
    return getThirdPlaceTeamByGroup(groupRankings, teamsData, groupLabel);
  }

  // Handle regular position slots (e.g., "1A", "2B")
  const match = slotCode.match(/^([12])([A-L])$/);
  if (!match) {
    console.error(`Invalid slot code: ${slotCode}`);
    return null;
  }

  const position = parseInt(match[1]) as 1 | 2;
  const groupLabel = match[2] as GroupLabel;

  return getTeamByGroupPosition(groupRankings, teamsData, groupLabel, position);
}

/**
 * Build all qualified teams from group rankings and third-place selections
 * 
 * @param groupRankings - Array of group ranking inputs
 * @param teamsData - Teams organized by group
 * @param selectedThirdPlaceGroups - Array of group labels for third-place teams
 * @returns Array of all 32 qualified teams with seed information
 */
export function buildQualifiedTeams(
  groupRankings: GroupRankingInput[],
  teamsData: TeamsDataByGroup,
  selectedThirdPlaceGroups: GroupLabel[]
): QualifiedTeam[] {
  const qualified: QualifiedTeam[] = [];

  // Add first-place teams
  const firstPlaceTeams = groupRankings
    .filter((r) => r.position === 1)
    .map((r) => {
      const groupTeams = teamsData[r.group_label] || [];
      const team = groupTeams.find((t) => t.id === r.team_id);
      return team
        ? {
            ...team,
            seed: `${r.group_label}1`,
            slotLabel: `1${r.group_label}`,
          }
        : null;
    })
    .filter((t): t is QualifiedTeam => t !== null);

  // Add second-place teams
  const secondPlaceTeams = groupRankings
    .filter((r) => r.position === 2)
    .map((r) => {
      const groupTeams = teamsData[r.group_label] || [];
      const team = groupTeams.find((t) => t.id === r.team_id);
      return team
        ? {
            ...team,
            seed: `${r.group_label}2`,
            slotLabel: `2${r.group_label}`,
          }
        : null;
    })
    .filter((t): t is QualifiedTeam => t !== null);

  // Add third-place teams
  const thirdPlaceTeams: QualifiedTeam[] = [];
  selectedThirdPlaceGroups.forEach((groupLabel) => {
    const ranking = groupRankings.find(
      (r) => r.group_label === groupLabel && r.position === 3
    );
    if (ranking) {
      const groupTeams = teamsData[groupLabel] || [];
      const team = groupTeams.find((t) => t.id === ranking.team_id);
      if (team) {
        thirdPlaceTeams.push({
          ...team,
          seed: `${groupLabel}3`,
          slotLabel: `3${groupLabel}`,
        });
      }
    }
  });

  qualified.push(...firstPlaceTeams, ...secondPlaceTeams, ...thirdPlaceTeams);
  return qualified;
}

/**
 * Get display label for a bracket slot
 * 
 * @param slotCode - The slot code
 * @param thirdPlaceAssignments - Mapping of third-place slots to groups (optional)
 * @returns Human-readable label
 */
export function getSlotDisplayLabel(
  slotCode: BracketSlot | string,
  thirdPlaceAssignments?: ThirdPlaceAssignments
): string {
  // Handle third-place slots (new format: "3_vs_1E")
  if (slotCode.startsWith("3_vs_1")) {
    if (thirdPlaceAssignments) {
      const groupWinner = slotCode.replace("3_vs_", ""); // "3_vs_1E" -> "1E"
      const annexCKey = `vs${groupWinner}` as keyof ThirdPlaceAssignments; // "vs1E"
      const groupLabel = thirdPlaceAssignments[annexCKey];
      return groupLabel ? `3${groupLabel}` : slotCode;
    }
    return slotCode.replace("3_vs_", "3rd vs ");
  }

  // Handle regular position slots
  const match = slotCode.match(/^([12])([A-L])$/);
  if (match) {
    return slotCode;
  }

  return slotCode;
}
