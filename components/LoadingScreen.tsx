"use client";

import { useState, useEffect } from "react";

const STEPS = [
  "Reading every word. Yes, all of them.",
  "Looking for the story behind the decisions",
  "Putting it in front of a tough crowd",
  "Poking holes in the logic",
  "Writing up the verdict — almost there",
];

const ICONS = [
  {
    paths: [
      "M3.5 20.5C4.33 21.33 5.67 21.33 6.5 20.5L19.5 7.5C20.33 6.67 20.33 5.33 19.5 4.5C18.67 3.67 17.33 3.67 16.5 4.5L3.5 17.5C2.67 18.33 2.67 19.67 3.5 20.5Z",
      "M18.01 8.99L15.01 5.99",
      "M8.5 2.44L10 2L9.56 3.5L10 5L8.5 4.56L7 5L7.44 3.5L7 2L8.5 2.44Z",
      "M4.5 8.44L6 8L5.56 9.5L6 11L4.5 10.56L3 11L3.44 9.5L3 8L4.5 8.44Z",
      "M19.5 13.44L21 13L20.56 14.5L21 16L19.5 15.56L18 16L18.44 14.5L18 13L19.5 13.44Z",
    ],
  },
  {
    paths: [
      "M21.81 3.94C20.27 7.78 16.41 13 13.18 15.59L11.21 17.17C10.96 17.35 10.71 17.51 10.43 17.62C10.43 17.44 10.42 17.24 10.39 17.05C10.28 16.21 9.9 15.43 9.23 14.76C8.55 14.08 7.72 13.68 6.87 13.57C6.67 13.56 6.47 13.54 6.27 13.56C6.38 13.25 6.55 12.96 6.76 12.72L8.32 10.75C10.9 7.52 16.14 3.64 19.97 2.11C20.56 1.89 21.13 2.05 21.49 2.42C21.87 2.79 22.05 3.36 21.81 3.94Z",
      "M10.43 17.62C10.43 18.72 10.01 19.77 9.22 20.57C8.61 21.18 7.78 21.6 6.79 21.73L4.33 22C2.99 22.15 1.84 21.01 2 19.65L2.27 17.19C2.51 15 4.34 13.6 6.28 13.56C6.48 13.55 6.69 13.56 6.88 13.57C7.73 13.68 8.56 14.07 9.24 14.76C9.91 15.43 10.29 16.21 10.4 17.05C10.41 17.24 10.43 17.43 10.43 17.62Z",
      "M14.24 14.47C14.24 11.86 12.12 9.74 9.51 9.74",
    ],
  },
  {
    paths: [
      "M19.79 7.27L16.76 4.24C15.61 3.09 14.04 3.15 13.27 4.38L11.58 7.05L16.98 12.45L19.65 10.76C20.8 10.03 20.87 8.35 19.79 7.27Z",
      "M11.58 7.05L7.65 6.81C5.46 6.68 4.69 7.35 4.45 9.44L3.47 17.76C3.26 19.51 4.53 20.77 6.27 20.56L14.59 19.58C16.68 19.33 17.44 18.57 17.22 16.38L16.99 12.45",
      "M4.61 19.42L7.64 16.38",
    ],
  },
];

const VARIANTS = [
  {
    heading: "In the hands of a very opinionated AI senior designer",
    subtext: "Give them 30 seconds — the feedback is real, even if they aren't",
  },
  {
    heading: "Sit tight. Your portfolio is in the hot seat.",
    subtext: "A very opinionated AI senior designer is reading it now — about 30 seconds",
  },
  {
    heading: "Your portfolio just walked into the room",
    subtext: "A very opinionated AI senior designer who's seen everything is reading it now — 30 seconds",
  },
];

interface LoadingScreenProps {
  onCancel: () => void;
}

export default function LoadingScreen({ onCancel }: LoadingScreenProps) {
  const [variant] = useState(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [iconIndex, setIconIndex]     = useState(0);
  const [drawnPaths, setDrawnPaths]   = useState(0);
  const [fading, setFading]           = useState(false);

  useEffect(() => {
    console.log("LoadingScreen mounted");
    const timers = [
      setTimeout(() => setLoadingStep(1), 2000),
      setTimeout(() => setLoadingStep(2), 4200),
      setTimeout(() => setLoadingStep(3), 6600),
      setTimeout(() => setLoadingStep(4), 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const pathCount = ICONS[iconIndex].paths.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < pathCount; i++) {
      timers.push(setTimeout(() => setDrawnPaths(i + 1), (i + 1) * 150));
    }

    const fadeStart = pathCount * 150 + 2000;
    timers.push(setTimeout(() => setFading(true), fadeStart));
    timers.push(
      setTimeout(() => {
        setIconIndex((prev) => (prev + 1) % 3);
        setDrawnPaths(0);
        setFading(false);
      }, fadeStart + 300)
    );

    return () => timers.forEach(clearTimeout);
  }, [iconIndex]);

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
        background: "#EFF6FF",
        overflow: "hidden",
      }}
    >
      {/* Orb 1 */}
      <div style={{ position: "absolute", pointerEvents: "none", borderRadius: "50%", width: "500px", height: "500px", top: "-150px", left: "-150px", background: "radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 65%)", filter: "blur(70px)", animation: "gradientOrb1 9s ease-in-out infinite" }} />
      {/* Orb 2 */}
      <div style={{ position: "absolute", pointerEvents: "none", borderRadius: "50%", width: "450px", height: "450px", bottom: "-100px", right: "-100px", background: "radial-gradient(circle, rgba(147,197,253,0.5) 0%, transparent 65%)", filter: "blur(70px)", animation: "gradientOrb2 11s ease-in-out infinite" }} />
      {/* Orb 3 */}
      <div style={{ position: "absolute", pointerEvents: "none", borderRadius: "50%", width: "380px", height: "380px", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(219,234,254,0.7) 0%, transparent 65%)", filter: "blur(70px)", animation: "gradientOrb3 8s ease-in-out infinite" }} />
      {/* Orb 4 */}
      <div style={{ position: "absolute", pointerEvents: "none", borderRadius: "50%", width: "300px", height: "300px", bottom: "10%", left: "5%", background: "radial-gradient(circle, rgba(96,165,250,0.35) 0%, transparent 65%)", filter: "blur(70px)", animation: "gradientOrb4 13s ease-in-out infinite" }} />

      <div style={{ position: "relative", zIndex: 1, width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", opacity: fading ? 0 : 1, transition: "opacity 300ms ease" }}>
        <svg
          key={iconIndex}
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94A3B8"
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICONS[iconIndex].paths.map((d, i) => (
            <path
              key={i}
              d={d}
              style={
                drawnPaths > i
                  ? { strokeDasharray: 300, animation: "drawPath 400ms ease forwards" }
                  : { strokeDasharray: 300, strokeDashoffset: 300, opacity: 0 }
              }
            />
          ))}
        </svg>
      </div>

      <h1 style={{ position: "relative", zIndex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "38px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.8px", textAlign: "center", margin: "0 0 12px 0" }}>
        {variant.heading}
      </h1>

      <p style={{ position: "relative", zIndex: 1, fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: 500, color: "#0F172A", textAlign: "center", margin: "0 0 48px 0" }}>
        {variant.subtext}
      </p>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", width: "360px", minHeight: "220px" }}>
        {STEPS.map((step, i) => {
          if (i >= visibleCount) return null;
          const done   = loadingStep > i;
          const active = loadingStep === i;
          return (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "16px", height: "36px", animation: "fadeSlideIn 350ms ease both" }}
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
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", fontWeight: active ? 600 : 400, color: done ? "#475569" : active ? "#0F172A" : "#334155", margin: 0 }}>
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
        style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", padding: 0, color: "#2563EB", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", marginTop: "56px", transition: "color 150ms ease" }}
      >
        Cancel and go back
      </button>
    </div>
  );
}
