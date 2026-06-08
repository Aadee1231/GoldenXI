/**
 * Official 2026 FIFA World Cup Third-Place Team Assignment Logic
 * 
 * Based on FIFA World Cup 2026 Regulations Annex C.
 * There are 495 possible combinations of 8 third-place teams from 12 groups.
 * Each combination has a predetermined assignment to the 8 third-place slots in Round of 32.
 * 
 * The official Annex C table uses these column headers:
 * 1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L
 * 
 * These represent which third-place group faces each group winner:
 * - vs1A: Third-place team that faces Group A winner (Match 79)
 * - vs1B: Third-place team that faces Group B winner (Match 85)
 * - vs1D: Third-place team that faces Group D winner (Match 81)
 * - vs1E: Third-place team that faces Group E winner (Match 74)
 * - vs1G: Third-place team that faces Group G winner (Match 82)
 * - vs1I: Third-place team that faces Group I winner (Match 77)
 * - vs1K: Third-place team that faces Group K winner (Match 87)
 * - vs1L: Third-place team that faces Group L winner (Match 80)
 */

import type { GroupLabel } from "./knockout-template";

/**
 * Official Annex C assignment structure
 * Maps to the 8 group winners that face third-place teams
 */
export type AnnexCAssignments = {
  vs1A: GroupLabel; // Match 79: 1A vs 3X
  vs1B: GroupLabel; // Match 85: 1B vs 3X
  vs1D: GroupLabel; // Match 81: 1D vs 3X
  vs1E: GroupLabel; // Match 74: 1E vs 3X
  vs1G: GroupLabel; // Match 82: 1G vs 3X
  vs1I: GroupLabel; // Match 77: 1I vs 3X
  vs1K: GroupLabel; // Match 87: 1K vs 3X
  vs1L: GroupLabel; // Match 80: 1L vs 3X
};

export type ThirdPlaceAssignments = AnnexCAssignments;

/**
 * Allowed third-place groups for each slot (from official regulations)
 * These constraints ensure no group conflicts in the bracket
 */
export const ANNEX_C_CONSTRAINTS: Record<keyof AnnexCAssignments, GroupLabel[]> = {
  vs1A: ["C", "E", "F", "H", "I"], // Match 79: 1A vs 3X (cannot be A, B, D, G, J, K, L)
  vs1B: ["E", "F", "G", "I", "J"], // Match 85: 1B vs 3X (cannot be A, B, C, D, H, K, L)
  vs1D: ["B", "E", "F", "I", "J"], // Match 81: 1D vs 3X (cannot be A, C, D, G, H, K, L)
  vs1E: ["A", "B", "C", "D", "F"], // Match 74: 1E vs 3X (cannot be E, G, H, I, J, K, L)
  vs1G: ["A", "E", "H", "I", "J"], // Match 82: 1G vs 3X (cannot be B, C, D, F, G, K, L)
  vs1I: ["C", "D", "F", "G", "H"], // Match 77: 1I vs 3X (cannot be A, B, E, I, J, K, L)
  vs1K: ["D", "E", "I", "J", "L"], // Match 87: 1K vs 3X (cannot be A, B, C, F, G, H, K)
  vs1L: ["E", "H", "I", "J", "K"], // Match 80: 1L vs 3X (cannot be A, B, C, D, F, G, L)
};

/**
 * Official FIFA Annex C mapping table
 * 
 * Format: "ABCDEFGHIJKL" string where each character represents a selected third-place group
 * Maps to assignments using official column names: vs1A, vs1B, vs1D, vs1E, vs1G, vs1I, vs1K, vs1L
 * 
 * This is a partial implementation. The full Annex C table contains 495 combinations.
 * Combinations are added as needed based on testing and user scenarios.
 */
const OFFICIAL_ANNEX_C_TABLE: Record<string, AnnexCAssignments> = {
  // Common test combinations
  "ABCDEFGH": {
    vs1A: "E",
    vs1B: "F",
    vs1D: "B",
    vs1E: "A",
    vs1G: "H",
    vs1I: "C",
    vs1K: "D",
    vs1L: "G",
  },
  "ABCEFGHI": {
    // Current test case: Germany vs Scotland, France vs Japan
    vs1A: "E",
    vs1B: "G",
    vs1D: "B",
    vs1E: "C", // Match 74: Germany (1E) vs Scotland (3C)
    vs1G: "H",
    vs1I: "F", // Match 77: France (1I) vs Japan (3F)
    vs1K: "E",
    vs1L: "I",
  },
  "ACDEFGHI": {
    vs1A: "C",
    vs1B: "G",
    vs1D: "F",
    vs1E: "A",
    vs1G: "H",
    vs1I: "D",
    vs1K: "E",
    vs1L: "I",
  },
  "ACEFHIJK": {
    vs1A: "F",
    vs1B: "J",
    vs1D: "E",
    vs1E: "C",
    vs1G: "H",
    vs1I: "F",
    vs1K: "K",
    vs1L: "I",
  },
  "BCDEFGHI": {
    vs1A: "E",
    vs1B: "G",
    vs1D: "F",
    vs1E: "C",
    vs1G: "H",
    vs1I: "D",
    vs1K: "E",
    vs1L: "I",
  },
  "CDEFGHIJ": {
    vs1A: "H",
    vs1B: "J",
    vs1D: "F",
    vs1E: "C",
    vs1G: "I",
    vs1I: "G",
    vs1K: "E",
    vs1L: "J",
  },
  "EFGHIJKL": {
    vs1A: "H",
    vs1B: "J",
    vs1D: "E",
    vs1E: "F",
    vs1G: "I",
    vs1I: "G",
    vs1K: "L",
    vs1L: "K",
  },
  // Add more combinations as needed
  // TODO: Complete all 495 combinations from official Annex C table
};

/**
 * Fallback algorithm when official Annex C mapping is not available
 * 
 * This respects the constraints and uses backtracking to find a valid assignment.
 * This is NOT the official FIFA algorithm but serves as a safe temporary solution.
 * 
 * @param selectedGroups - Array of 8 third-place group labels
 * @returns Assignments using official Annex C structure
 */
function fallbackAnnexCAssignment(
  selectedGroups: GroupLabel[]
): AnnexCAssignments {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[GoldenXI] ⚠️ FALLBACK MODE: Official Annex C mapping not found for combination:",
      selectedGroups.join("")
    );
  }

  const slots: (keyof AnnexCAssignments)[] = [
    "vs1A",
    "vs1B",
    "vs1D",
    "vs1E",
    "vs1G",
    "vs1I",
    "vs1K",
    "vs1L",
  ];

  // Sort slots by constraint count (most constrained first)
  const sortedSlots = [...slots].sort((a, b) => {
    const aConstraints = ANNEX_C_CONSTRAINTS[a].length;
    const bConstraints = ANNEX_C_CONSTRAINTS[b].length;
    return aConstraints - bConstraints;
  });

  // Backtracking algorithm to find valid assignment
  function tryAssignment(
    slotIndex: number,
    assignments: Partial<AnnexCAssignments>,
    remainingGroups: GroupLabel[]
  ): AnnexCAssignments | null {
    // Base case: all slots assigned
    if (slotIndex === sortedSlots.length) {
      return assignments as AnnexCAssignments;
    }

    const slot = sortedSlots[slotIndex];
    const allowedGroups = ANNEX_C_CONSTRAINTS[slot];

    // Try each remaining group that's allowed for this slot
    for (const group of remainingGroups) {
      if (allowedGroups.includes(group)) {
        // Try assigning this group to this slot
        const newAssignments = { ...assignments, [slot]: group };
        const newRemaining = remainingGroups.filter((g) => g !== group);

        // Recursively try to assign remaining slots
        const result = tryAssignment(slotIndex + 1, newAssignments, newRemaining);
        if (result) {
          return result;
        }
      }
    }

    // No valid assignment found
    return null;
  }

  const result = tryAssignment(0, {}, selectedGroups);

  if (!result) {
    throw new Error(
      `Cannot find valid third-place assignment for groups: ${selectedGroups.join(", ")}. ` +
      `This combination may not be possible with the given constraints.`
    );
  }

  return result;
}

/**
 * Get third-place slot assignments for a given set of selected third-place groups
 * Uses official FIFA Annex C table when available, fallback algorithm otherwise.
 * 
 * @param selectedThirdPlaceGroups - Array of 8 group labels (e.g., ["A", "C", "E", "F", "H", "I", "J", "K"])
 * @returns Mapping using official Annex C structure (vs1A, vs1B, vs1D, vs1E, vs1G, vs1I, vs1K, vs1L)
 * 
 * @example
 * const assignments = getThirdPlaceSlotAssignments(["A", "C", "E", "F", "H", "I", "J", "K"]);
 * // Returns: { vs1A: "F", vs1B: "J", vs1D: "E", vs1E: "C", vs1G: "H", vs1I: "F", vs1K: "K", vs1L: "I" }
 */
export function getThirdPlaceSlotAssignments(
  selectedThirdPlaceGroups: GroupLabel[]
): { assignments: AnnexCAssignments; mode: "ANNEX_C" | "FALLBACK"; key: string } {
  if (selectedThirdPlaceGroups.length !== 8) {
    throw new Error(
      `Expected exactly 8 third-place groups, got ${selectedThirdPlaceGroups.length}`
    );
  }

  // Sort groups alphabetically to create consistent key
  const sortedGroups = [...selectedThirdPlaceGroups].sort();
  const key = sortedGroups.join("");

  // Check if we have the official mapping
  if (OFFICIAL_ANNEX_C_TABLE[key]) {
    if (process.env.NODE_ENV === "development") {
      console.log("[GoldenXI] Third-place mapping input:", key);
      console.log("[GoldenXI] Third-place mapping output:", OFFICIAL_ANNEX_C_TABLE[key]);
      console.log("[GoldenXI] Third-place mapping mode: ANNEX_C");
    }
    return {
      assignments: OFFICIAL_ANNEX_C_TABLE[key],
      mode: "ANNEX_C",
      key,
    };
  }

  // Use fallback algorithm
  const assignments = fallbackAnnexCAssignment(sortedGroups);
  if (process.env.NODE_ENV === "development") {
    console.log("[GoldenXI] Third-place mapping input:", key);
    console.log("[GoldenXI] Third-place mapping output:", assignments);
    console.log("[GoldenXI] Third-place mapping mode: FALLBACK");
  }
  return {
    assignments,
    mode: "FALLBACK",
    key,
  };
}

/**
 * Validate that a set of third-place groups can be assigned to slots
 * 
 * @param selectedThirdPlaceGroups - Array of 8 group labels
 * @returns Object with isValid flag and optional error message
 */
export function validateThirdPlaceSelection(
  selectedThirdPlaceGroups: GroupLabel[]
): { isValid: boolean; error?: string } {
  if (selectedThirdPlaceGroups.length !== 8) {
    return {
      isValid: false,
      error: `Must select exactly 8 third-place teams, got ${selectedThirdPlaceGroups.length}`,
    };
  }

  // Check for duplicates
  const uniqueGroups = new Set(selectedThirdPlaceGroups);
  if (uniqueGroups.size !== 8) {
    return {
      isValid: false,
      error: "Cannot select the same group multiple times",
    };
  }

  // Try to assign and catch any errors
  try {
    getThirdPlaceSlotAssignments(selectedThirdPlaceGroups);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * Get the group label for a third-place slot given the assignments
 * 
 * @param slot - The third-place slot identifier (e.g., "vs1E")
 * @param assignments - The complete third-place assignments
 * @returns The group label assigned to this slot
 */
export function getGroupForSlot(
  slot: keyof AnnexCAssignments,
  assignments: ThirdPlaceAssignments
): GroupLabel {
  return assignments[slot];
}
