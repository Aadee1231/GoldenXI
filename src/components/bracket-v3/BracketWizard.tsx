"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
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

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = async () => {
    await triggerSave();
    
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
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = STEPS[prevIndex].id;
      setCurrentStep(prevStep);
      setWizardState((prev) => ({ ...prev, currentStep: prevStep }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGroupRankingsChange = (rankings: GroupRankingInput[]) => {
    setWizardState((prev) => ({ ...prev, groupRankings: rankings }));
  };

  const handleThirdPlacePicksChange = (teamIds: string[]) => {
    setWizardState((prev) => ({ ...prev, thirdPlacePicks: teamIds }));
  };

  const handleKnockoutPicksChange = (picks: Record<string, string | null>) => {
    setWizardState((prev) => ({ ...prev, knockoutPicks: picks }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Build Your Bracket
        </h1>
        <p className="text-gray-400">World Cup 2026 - 48 Teams</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      isActive
                        ? "bg-yellow-400 text-black"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  <div
                    className={`mt-2 text-xs md:text-sm font-medium transition-colors ${
                      isActive ? "text-yellow-400" : isCompleted ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    <span className="hidden md:inline">{step.label}</span>
                    <span className="md:hidden">{step.shortLabel}</span>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      isCompleted ? "bg-green-600" : "bg-gray-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {STEPS.find((s) => s.id === currentStep)?.label}
          </h2>
          {currentStep !== "review" && (
            <button
              onClick={handleAutoPick}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Auto-Pick
            </button>
          )}
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
          />
        )}
        {currentStep === "review" && (
          <ReviewBracketStep wizardState={wizardState} onRegisterSave={registerSaveCallback} />
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
