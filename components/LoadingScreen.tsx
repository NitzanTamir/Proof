"use client";

import { useState, useEffect } from "react";

const STEPS = [
  "Reading your page",
  "Analyzing content",
  "Checking hiring signal",
  "Evaluating dimensions",
  "Generating your report",
];

const STEP_MS = 6000;

export default function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setCurrentStep(i), i * STEP_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center">
      <p className="font-mono text-[18px] font-bold tracking-[-0.3px] text-[#0F172A] mb-8">Proof</p>

      <h1 className="text-[28px] font-bold text-[#0F172A] mb-1">
        Analyzing your portfolio
      </h1>
      <p className="text-[#94A3B8] text-sm mb-10">
        This takes about 30 seconds
      </p>

      <div className="w-full max-w-xs space-y-4">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;

          return (
            <div key={step} className="flex items-center gap-3">
              {done && (
                <div className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              )}
              {active && (
                <div className="w-5 h-5 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin flex-shrink-0" />
              )}
              {!done && !active && (
                <div className="w-5 h-5 rounded-full border-2 border-[#E2E8F0] flex-shrink-0" />
              )}
              <span className={`text-sm ${
                done    ? "text-[#475569]" :
                active  ? "text-[#0F172A] font-medium" :
                          "text-[#94A3B8]"
              }`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
