"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Shuffle, Lock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { validateBracketComplete } from "@/src/lib/supabase/queries/brackets-client";
import GroupStageStep from "./GroupStageStep";
import ThirdPlaceStep from "./ThirdPlaceStep";
import KnockoutBracketStep from "./KnockoutBracketStep";
import ReviewBracketStep from "./ReviewBracketStep";
import type { GroupRankingInput, BracketWizardState } from "@/src/types";

type WizardStep = "groups" | "third-place" | "knockout" | "review";

const STEPS: { id: WizardStep; label: string; shortLabel: string }[] = [
  { id: "groups", label: "Group Stage", shortLabel: "Groups" },
  { id: "third-place", label: "Third-Place Picks", shortLabel: "3rd Place" },
  { id: "knockout", label: "Knockout Bracket", shortLabel: "Knockout" },
  { id: "review", label: "Review & Lock", shortLabel: "Review" },
];

export default function BracketWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("groups");
  const [wizardState, setWizardState] = useState<BracketWizardState>({
    groupRankings: [],
    thirdPlacePicks: [],
    knockoutPicks: {},
    currentStep: "groups",
  });
  const [isLoadingInitialStep, setIsLoadingInitialStep] = useState(true);
  const [submissionsClosed, setSubmissionsClosed] = useState(false);
  const [knockoutRound, setKnockoutRound] = useState<"r32" | "r16" | "qf" | "sf" | "final">("r32");
  const [knockoutRoundComplete, setKnockoutRoundComplete] = useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  useEffect(() => {
    determineInitialStep();
  }, []);

  const determineInitialStep = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      setIsLoadingInitialStep(false);
      return;
    }

    const { data: tournaments } = await supabase
      .from("tournaments")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    if (!tournaments || tournaments.length === 0) {
      setIsLoadingInitialStep(false);
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

    if (!brackets || brackets.length === 0) {
      setSubmissionsClosed(true);
      setIsLoadingInitialStep(false);
      return;
    }

    const bracket = brackets[0];
    
    // TASK 1: Load all saved data
    const { data: savedGroupPicks } = await supabase
      .from("bracket_group_picks")
      .select("*")
      .eq("bracket_id", bracket.id)
      .order("group_label", { ascending: true })
      .order("position", { ascending: true });

    const { data: savedThirdPlacePicks } = await supabase
      .from("bracket_third_place_picks")
      .select("team_id")
      .eq("bracket_id", bracket.id);

    const { data: savedKnockoutPicks } = await supabase
      .from("bracket_picks")
      .select("*")
      .eq("bracket_id", bracket.id);

    // Hydrate wizardState with actual saved data
    const groupRankings: GroupRankingInput[] = savedGroupPicks
      ? savedGroupPicks.map((p) => ({
          group_label: p.group_label,
          team_id: p.team_id,
          position: p.position,
        }))
      : [];

    const thirdPlacePicks: string[] = savedThirdPlacePicks
      ? savedThirdPlacePicks.map((p) => p.team_id)
      : [];

    const knockoutPicks: Record<string, string | null> = {};
    if (savedKnockoutPicks) {
      savedKnockoutPicks.forEach((pick) => {
        knockoutPicks[pick.match_id] = pick.picked_team_id;
      });
    }

    // TASK 2: Determine initial step based on actual data
    let initialStep: WizardStep = "groups";

    const groupsComplete = groupRankings.length >= 48;
    const thirdPlaceComplete = thirdPlacePicks.length >= 8;
    const knockoutComplete = Object.keys(knockoutPicks).length >= 31;

    if (bracket.is_locked) {
      // Locked brackets always open at Review
      initialStep = "review";
    } else if (knockoutComplete) {
      // All picks complete, go to Review
      initialStep = "review";
    } else if (!groupsComplete) {
      // Groups incomplete, start there
      initialStep = "groups";
    } else if (!thirdPlaceComplete) {
      // Groups done but third-place incomplete
      initialStep = "third-place";
    } else if (!knockoutComplete) {
      // Groups and third-place done, but knockout incomplete
      initialStep = "knockout";
      // Set initial knockout round to first incomplete round
      const r32Complete = Object.keys(knockoutPicks).filter(k => k.includes('r32')).length >= 16;
      const r16Complete = Object.keys(knockoutPicks).filter(k => k.includes('r16')).length >= 8;
      const qfComplete = Object.keys(knockoutPicks).filter(k => k.includes('qf')).length >= 4;
      const sfComplete = Object.keys(knockoutPicks).filter(k => k.includes('sf')).length >= 2;
      
      if (!r32Complete) setKnockoutRound("r32");
      else if (!r16Complete) setKnockoutRound("r16");
      else if (!qfComplete) setKnockoutRound("qf");
      else if (!sfComplete) setKnockoutRound("sf");
      else setKnockoutRound("final");
    } else {
      // Fallback to review
      initialStep = "review";
    }

    setWizardState({
      groupRankings,
      thirdPlacePicks,
      knockoutPicks,
      currentStep: initialStep,
    });
    setCurrentStep(initialStep);
    setIsLoadingInitialStep(false);
  };

  const handleNext = async () => {
    await triggerSave();
    
    // TASK 4: Validate before advancing
    if (currentStep === "groups") {
      if (wizardState.groupRankings.length < 48) {
        alert("Please complete all group rankings (48 teams) before continuing.");
        return;
      }
    } else if (currentStep === "third-place") {
      if (wizardState.thirdPlacePicks.length < 8) {
        alert("Please select exactly 8 third-place teams before continuing.");
        return;
      }
    } else if (currentStep === "knockout") {
      const roundOrder: ("r32" | "r16" | "qf" | "sf" | "final")[] = ["r32", "r16", "qf", "sf", "final"];
      const currentRoundIndex = roundOrder.indexOf(knockoutRound);
      
      if (!knockoutRoundComplete) {
        alert(`Please complete all picks for ${roundOrder[currentRoundIndex].toUpperCase()} before continuing.`);
        return;
      }
      
      if (currentRoundIndex < roundOrder.length - 1) {
        const nextRound = roundOrder[currentRoundIndex + 1];
        setKnockoutRound(nextRound);
        return;
      }
    }
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      const nextStep = STEPS[nextIndex].id;
      setCurrentStep(nextStep);
      setWizardState((prev) => ({ ...prev, currentStep: nextStep }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const saveCallbackRef = useRef<(() => Promise<void>) | null>(null);

  const triggerSave = async () => {
    if (saveCallbackRef.current) {
      await saveCallbackRef.current();
    }
  };

  const registerSaveCallback = (callback: () => Promise<void>) => {
    saveCallbackRef.current = callback;
  };

  const handleAutoPick = () => {
    if (autoPickCallbackRef.current) {
      autoPickCallbackRef.current();
    }
  };

  const autoPickCallbackRef = useRef<(() => void) | null>(null);

  const registerAutoPickCallback = (callback: () => void) => {
    autoPickCallbackRef.current = callback;
  };

  const handleBack = () => {
    if (currentStep === "knockout") {
      const roundOrder: ("r32" | "r16" | "qf" | "sf" | "final")[] = ["r32", "r16", "qf", "sf", "final"];
      const currentRoundIndex = roundOrder.indexOf(knockoutRound);
      
      if (currentRoundIndex > 0) {
        const prevRound = roundOrder[currentRoundIndex - 1];
        setKnockoutRound(prevRound);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    
    // TASK 4: From Review, go back to Final round if knockout complete
    if (currentStep === "review") {
      setCurrentStep("knockout");
      setKnockoutRound("final");
      setWizardState((prev) => ({ ...prev, currentStep: "knockout" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = STEPS[prevIndex].id;
      setCurrentStep(prevStep);
      setWizardState((prev) => ({ ...prev, currentStep: prevStep }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGroupRankingsChange = (rankings: GroupRankingInput[]) => {
    // When group rankings change, clear downstream picks since qualified teams changed
    setWizardState((prev) => ({ 
      ...prev, 
      groupRankings: rankings,
      thirdPlacePicks: [], // Clear third-place picks
      knockoutPicks: {} // Clear knockout picks
    }));
  };

  const handleThirdPlacePicksChange = (teamIds: string[]) => {
    // When third-place picks change, clear knockout picks since qualified teams changed
    setWizardState((prev) => ({ 
      ...prev, 
      thirdPlacePicks: teamIds,
      knockoutPicks: {} // Clear knockout picks
    }));
  };

  const handleKnockoutPicksChange = (picks: Record<string, string | null>) => {
    setWizardState((prev) => ({ ...prev, knockoutPicks: picks }));
  };

  const handleNavigate = (step: "groups" | "third-place" | "knockout") => {
    setCurrentStep(step);
    setWizardState((prev) => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKnockoutRoundChange = useCallback((round: "r32" | "r16" | "qf" | "sf" | "final", canAdvance: boolean) => {
    setKnockoutRound(round);
    setKnockoutRoundComplete(canAdvance);
  }, []);

  // Scroll to top when knockout round changes (Next button or tab click)
  useEffect(() => {
    if (currentStep === "knockout") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [knockoutRound, currentStep]);

  if (isLoadingInitialStep) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 pt-20 sm:pt-24">
        <div className="text-center py-12">
          <div className="text-gray-400">Loading your bracket...</div>
        </div>
      </div>
    );
  }

  if (submissionsClosed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 pt-24 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
            <Lock className="w-10 h-10 text-yellow-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Bracket Submissions Closed</h1>
        <p className="text-gray-400 text-lg mb-8">
          The deadline to create a World Cup 2026 bracket has passed. No new brackets can be submitted.
        </p>
        <Link href="/leaderboard" className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
          View Leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pt-20 sm:pt-24 pb-8 sm:pb-32">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Build Your Bracket
            </h1>
            <p className="text-gray-400">World Cup 2026 - 48 Teams</p>
          </div>
          <Link
            href="/bracket/how-it-works"
            className="shrink-0 text-sm text-zinc-400 hover:text-yellow-400 transition-colors"
          >
            How bracket works →
          </Link>
        </div>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4 overflow-x-auto pb-2 sm:pb-0">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            // TASK 3: Determine if step is clickable
            let isClickable = false;
            let disabledMessage = "";

            if (step.id === "groups") {
              isClickable = true;
            } else if (step.id === "third-place") {
              isClickable = wizardState.groupRankings.length >= 48;
              disabledMessage = "Complete group rankings first";
            } else if (step.id === "knockout") {
              isClickable = wizardState.groupRankings.length >= 48 && wizardState.thirdPlacePicks.length >= 8;
              disabledMessage = wizardState.groupRankings.length < 48
                ? "Complete group rankings first"
                : "Complete third-place picks first";
            } else if (step.id === "review") {
              isClickable = wizardState.groupRankings.length >= 48 &&
                           wizardState.thirdPlacePicks.length >= 8 &&
                           Object.keys(wizardState.knockoutPicks).length >= 31;
              disabledMessage = "Complete all bracket picks first";
            }

            const handleStepClick = () => {
              if (!isClickable && !isActive) {
                alert(disabledMessage);
                return;
              }
              if (isClickable && !isActive) {
                setCurrentStep(step.id);
                setWizardState((prev) => ({ ...prev, currentStep: step.id }));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            };

            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <button
                    onClick={handleStepClick}
                    disabled={!isClickable && !isActive}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      isActive
                        ? "bg-yellow-400 text-black"
                        : isCompleted
                        ? "bg-green-600 text-white cursor-pointer hover:bg-green-500"
                        : isClickable
                        ? "bg-gray-700 text-gray-400 cursor-pointer hover:bg-gray-600"
                        : "bg-gray-800 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </button>
                  <div
                    className={`mt-1 sm:mt-2 text-[10px] sm:text-xs md:text-sm font-medium transition-colors ${
                      isActive ? "text-yellow-400" : isCompleted ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    {step.shortLabel}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-4 sm:w-8 md:flex-1 mx-1 sm:mx-2 transition-colors ${
                      isCompleted ? "bg-green-600" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {STEPS.find((s) => s.id === currentStep)?.label}
          </h2>
          <div className="flex items-center gap-3">
            {currentStep !== "review" && (
              <button
                onClick={handleAutoPick}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                <span className="hidden sm:inline">Auto-Pick</span>
              </button>
            )}
            {currentStepIndex < STEPS.length - 1 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {currentStep === "groups" && (
          <GroupStageStep
            rankings={wizardState.groupRankings}
            onChange={handleGroupRankingsChange}
            onRegisterSave={registerSaveCallback}
            onRegisterAutoPick={registerAutoPickCallback}
          />
        )}
        {currentStep === "third-place" && (
          <ThirdPlaceStep
            groupRankings={wizardState.groupRankings}
            selectedTeamIds={wizardState.thirdPlacePicks}
            onChange={handleThirdPlacePicksChange}
            onRegisterSave={registerSaveCallback}
            onRegisterAutoPick={registerAutoPickCallback}
          />
        )}
        {currentStep === "knockout" && (
          <KnockoutBracketStep
            groupRankings={wizardState.groupRankings}
            thirdPlacePicks={wizardState.thirdPlacePicks}
            picks={wizardState.knockoutPicks}
            onChange={handleKnockoutPicksChange}
            onRegisterSave={registerSaveCallback}
            onRegisterAutoPick={registerAutoPickCallback}
            onRoundChange={handleKnockoutRoundChange}
            initialRound={knockoutRound}
          />
        )}
        {currentStep === "review" && (
          <ReviewBracketStep 
            wizardState={wizardState} 
            onRegisterSave={registerSaveCallback}
            onNavigate={handleNavigate}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStepIndex === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            currentStepIndex === 0
              ? "bg-gray-800 text-gray-600 cursor-not-allowed"
              : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={currentStepIndex === STEPS.length - 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
            currentStepIndex === STEPS.length - 1
              ? "bg-gray-800 text-gray-600 cursor-not-allowed"
              : "bg-yellow-400 text-black hover:bg-yellow-500"
          }`}
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
