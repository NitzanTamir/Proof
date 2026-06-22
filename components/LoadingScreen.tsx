"use client";

import { useState, useEffect } from "react";

const STEPS = [
  "Reading your portfolio cover to cover",
  "Looking for the story behind the work",
  "Running it past an imaginary hiring panel",
  "Stress-testing your case study logic",
  "Almost there — compiling your results",
];

interface LoadingScreenProps {
  onCancel: () => void;
}

export default function LoadingScreen({ onCancel }: LoadingScreenProps) {
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setLoadingStep(1), 2000),
      setTimeout(() => setLoadingStep(2), 4200),
      setTimeout(() => setLoadingStep(3), 6600),
      setTimeout(() => setLoadingStep(4), 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const visibleCount = Math.min(loadingStep + 2, 5);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(-45deg, #EFF6FF, #DBEAFE, #EFF6FF, #F0F9FF)",
        backgroundSize: "400% 400%",
        animation: "gradientShift 6s ease infinite",
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.2); opacity: 0.6; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "18px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px", marginBottom: "40px" }}>
        Proof
      </span>

      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "38px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.8px", textAlign: "center", margin: "0 0 16px 0" }}>
        Analyzing your portfolio
      </h1>

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#475569", textAlign: "center", margin: "0 0 52px 0" }}>
        This takes about 30 seconds
      </p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "320px", minHeight: "220px" }}>
        {STEPS.map((step, i) => {
          if (i >= visibleCount) return null;
          const done   = loadingStep > i;
          const active = loadingStep === i;
          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "16px", height: "44px", animation: "fadeSlideIn 350ms ease both" }}
            >
              {done && (
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </div>
              )}
              {active && (
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563EB", animation: "pulse 1.2s ease infinite" }} />
                </div>
              )}
              {!done && !active && (
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #CBD5E1", flexShrink: 0 }} />
              )}
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", fontWeight: active ? 500 : 400, color: done ? "#475569" : active ? "#0F172A" : "#94A3B8", margin: 0 }}>
                {step}
              </p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onCancel}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#1D4ED8")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#2563EB")}
        style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", padding: 0, color: "#2563EB", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", marginTop: "56px", transition: "color 150ms ease" }}
      >
        ← Cancel and go back
      </button>
    </div>
  );
}
