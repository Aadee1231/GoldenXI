/**
 * Build Official Knockout Bracket
 * 
 * Main function to generate the Round of 32 bracket using the official
 * 2026 FIFA World Cup template structure.
 */

import type { GroupRankingInput } from "@/src/types";
import type { GroupLabel } from "./knockout-template";
import { ROUND_OF_32_TEMPLATE } from "./knockout-template";
import { getThirdPlaceSlotAssignments } from "./third-place-mapping";
import type { ThirdPlaceAssignments } from "./third-place-mapping";
import {
  resolveBracketSlot,
  buildQualifiedTeams,
  getSlotDisplayLabel,
} from "./bracket-resolver";
import type { QualifiedTeam, TeamsDataByGroup } from "./bracket-resolver";

export type R32MatchDisplay = {
  matchNumber: number;
  round: "r32";
  slotA: string;
  slotB: string;
  homeTeam: QualifiedTeam | null;
  awayTeam: QualifiedTeam | null;
  date: string;
  displayDate: string;
  stadium: string;
  city: string;
  allowedThirdGroups?: GroupLabel[];
  templateDebug?: string; // For dev/debug mode
};

/**
 * Build the official Round of 32 bracket
 * 
 * @param groupRankings - Array of group ranking inputs (positions 1, 2, 3 for each group)
 * @param teamsData - Teams organized by group label
 * @param selectedThirdPlaceTeams - Array of team IDs for the 8 selected third-place teams
 * @returns Array of 16 Round of 32 matches with resolved teams
 */
export function buildOfficialRoundOf32(
  groupRankings: GroupRankingInput[],
  teamsData: TeamsDataByGroup,
  selectedThirdPlaceTeams: string[]
): {
  matches: R32MatchDisplay[];
  qualifiedTeams: QualifiedTeam[];
  thirdPlaceAssignments: ThirdPlaceAssignments;
  annexCMode: "ANNEX_C" | "FALLBACK";
  annexCKey: string;
} {
  // Validate inputs
  if (selectedThirdPlaceTeams.length !== 8) {
    throw new Error(
      `Expected 8 third-place teams, got ${selectedThirdPlaceTeams.length}`
    );
  }

  // Determine which groups the third-place teams are from
  const selectedThirdPlaceGroups: GroupLabel[] = [];
  selectedThirdPlaceTeams.forEach((teamId) => {
    const ranking = groupRankings.find(
      (r) => r.team_id === teamId && r.position === 3
    );
    if (ranking) {
      selectedThirdPlaceGroups.push(ranking.group_label as GroupLabel);
    }
  });

  if (selectedThirdPlaceGroups.length !== 8) {
    throw new Error(
      `Could not determine groups for all third-place teams. Found ${selectedThirdPlaceGroups.length} groups.`
    );
  }

  // Get official third-place slot assignments
  const { assignments: thirdPlaceAssignments, mode: annexCMode, key: annexCKey } = 
    getThirdPlaceSlotAssignments(selectedThirdPlaceGroups);

  // Development debugging
  if (process.env.NODE_ENV === "development") {
    console.log("\n========== GOLDENXI BRACKET DEBUG ==========");
    console.log("📊 Selected Third-Place Groups:", selectedThirdPlaceGroups);
    console.log("🔑 Annex C Key:", annexCKey);
    console.log("🎯 Annex C Mode:", annexCMode);
    console.log("📋 Annex C Assignments:", thirdPlaceAssignments);
    console.log("==========================================\n");
  }

  // Build qualified teams list
  const qualifiedTeams = buildQualifiedTeams(
    groupRankings,
    teamsData,
    selectedThirdPlaceGroups
  );

  // Build Round of 32 matches using official template
  const matches: R32MatchDisplay[] = ROUND_OF_32_TEMPLATE.map((template) => {
    const homeTeam = resolveBracketSlot(
      template.slotA,
      groupRankings,
      teamsData,
      thirdPlaceAssignments
    );

    const awayTeam = resolveBracketSlot(
      template.slotB,
      groupRankings,
      teamsData,
      thirdPlaceAssignments
    );

    // Build debug template string
    const slotALabel = getSlotDisplayLabel(template.slotA, thirdPlaceAssignments);
    const slotBLabel = getSlotDisplayLabel(template.slotB, thirdPlaceAssignments);
    const templateDebug = template.allowedThirdGroups
      ? `${slotALabel} vs ${slotBLabel} (allowed: ${template.allowedThirdGroups.join("/")})`
      : `${slotALabel} vs ${slotBLabel}`;

    return {
      matchNumber: template.matchNumber,
      round: "r32" as const,
      slotA: getSlotDisplayLabel(template.slotA, thirdPlaceAssignments),
      slotB: getSlotDisplayLabel(template.slotB, thirdPlaceAssignments),
      homeTeam,
      awayTeam,
      date: template.date,
      displayDate: template.displayDate,
      stadium: template.stadium,
      city: template.city,
      allowedThirdGroups: template.allowedThirdGroups,
      templateDebug,
    };
  });

  return {
    matches,
    qualifiedTeams,
    thirdPlaceAssignments,
    annexCMode,
    annexCKey,
  };
}

/**
 * Check if bracket needs regeneration based on changes
 * 
 * @param oldGroupRankings - Previous group rankings
 * @param newGroupRankings - New group rankings
 * @param oldThirdPlaceTeams - Previous third-place team IDs
 * @param newThirdPlaceTeams - New third-place team IDs
 * @returns Object indicating what needs to be regenerated
 */
export function checkBracketRegenerationNeeds(
  oldGroupRankings: GroupRankingInput[],
  newGroupRankings: GroupRankingInput[],
  oldThirdPlaceTeams: string[],
  newThirdPlaceTeams: string[]
): {
  needsR32Regeneration: boolean;
  needsDownstreamClear: boolean;
  reason?: string;
} {
  // Check if group rankings changed
  const groupRankingsChanged =
    JSON.stringify(oldGroupRankings.sort()) !== JSON.stringify(newGroupRankings.sort());

  // Check if third-place selections changed
  const thirdPlaceChanged =
    JSON.stringify(oldThirdPlaceTeams.sort()) !== JSON.stringify(newThirdPlaceTeams.sort());

  if (groupRankingsChanged) {
    return {
      needsR32Regeneration: true,
      needsDownstreamClear: true,
      reason: "Group rankings changed",
    };
  }

  if (thirdPlaceChanged) {
    return {
      needsR32Regeneration: true,
      needsDownstreamClear: true,
      reason: "Third-place selections changed",
    };
  }

  return {
    needsR32Regeneration: false,
    needsDownstreamClear: false,
  };
}
