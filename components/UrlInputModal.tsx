"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Loading step config (unchanged) ────────────────────────────────────────

const LOADING_STEPS = [
  "Reading your page",
  "Analyzing content",
  "Checking hiring signal",
  "Evaluating dimensions",
  "Generating your report",
];

const STEP_MS = 5000;

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalStep = "url" | "designer_type" | "seniority" | "loading";

interface UrlInputModalProps {
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
}

// ─── Icons (Tabler-style, 18 × 18) ───────────────────────────────────────────

function IconMobile({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 17h2" />
    </svg>
  );
}

function IconPalette({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z" />
      <path d="M8.5 11h.01M12 9h.01M15.5 11h.01M12 15h.01" />
    </svg>
  );
}

function IconChartBar({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <path d="M7 20V12" />
      <path d="M12 20V8" />
      <path d="M17 20V4" />
    </svg>
  );
}

function IconCircles({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="3" />
      <circle cx="17" cy="7" r="3" />
      <circle cx="7" cy="17" r="3" />
      <circle cx="17" cy="17" r="3" />
    </svg>
  );
}

function IconSeedling({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a6 6 0 0 0-6-6H3v.5A6 6 0 0 0 9 11h3" />
      <path d="M12 10a6 6 0 0 1 6-6h3v.5A6 6 0 0 1 15 11h-3" />
      <path d="M12 21V10" />
    </svg>
  );
}

function IconTrendingUp({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l4-8 4 4 4-6 4 4" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

function IconStar({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2l3.086 6.253 6.9 1.002-4.993 4.867 1.179 6.873z" />
    </svg>
  );
}

function IconRepeat({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12V9a3 3 0 0 1 3-3h13m0 0-3 3m3-3-3-3" />
      <path d="M20 12v3a3 3 0 0 1-3 3H4m0 0 3 3m-3-3 3-3" />
    </svg>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ filled }: { filled: number }) {
  return (
    <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "20px",
            height: "4px",
            borderRadius: "2px",
            background: i < filled ? "#2563EB" : "#E2E8F0",
          }}
        />
      ))}
    </div>
  );
}

// ─── Pill card ────────────────────────────────────────────────────────────────

interface PillCardProps {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

function PillCard({ label, subtitle, icon, selected, onClick }: PillCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: "10px",
        padding: "16px 16px",
        cursor: "pointer",
        border: selected ? "2px solid #2563EB" : "1px solid #E2E8F0",
        background: selected ? "#EFF6FF" : "#FFFFFF",
        transition: "border-color 150ms, background 150ms",
      }}
    >
      <div style={{ display: "block", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: selected ? "#2563EB" : "#0F172A", marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "12px", color: selected ? "rgba(37,99,235,0.7)" : "#94A3B8" }}>
        {subtitle}
      </div>
    </div>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────

function primaryButtonStyle(enabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: enabled ? "#2563EB" : "#DBEAFE",
    color: enabled ? "#FFFFFF" : "#93C5FD",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    cursor: enabled ? "pointer" : "not-allowed",
    marginBottom: "12px",
  };
}

const skipButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  fontSize: "13px",
  color: "#475569",
  background: "none",
  border: "none",
  cursor: "pointer",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function UrlInputModal({ onClose, onSubmit }: UrlInputModalProps) {
  const [step, setStep]                       = useState<ModalStep>("url");
  const [url, setUrl]                         = useState("");
  const [designerType, setDesignerType]       = useState<string | null>(null);
  const [seniority, setSeniority]             = useState<string | null>(null);
  const [savedDesignerType, setSavedDesignerType] = useState<string | null>(null);
  const [savedSeniority, setSavedSeniority]   = useState<string | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [currentStep, setCurrentStep]         = useState(0);
  const [apiDone, setApiDone]                 = useState(false);

  // Fetch saved profile on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("designer_type, seniority")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.designer_type) setSavedDesignerType(data.designer_type);
          if (data?.seniority) setSavedSeniority(data.seniority);
        });
    });
  }, []);

  // Advance loading steps while analyzing
  useEffect(() => {
    if (step !== "loading") return;
    const timers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setCurrentStep(i + 1), (i + 1) * STEP_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // When API finishes: skip to all done, close after 500ms
  useEffect(() => {
    if (!apiDone) return;
    setCurrentStep(5);
    const timer = setTimeout(onClose, 500);
    return () => clearTimeout(timer);
  }, [apiDone, onClose]);

  async function saveProfile(dt: string, sn: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, designer_type: dt, seniority: sn });
    setSavedDesignerType(dt);
    setSavedSeniority(sn);
  }

  async function runAnalysis() {
    setStep("loading");
    setCurrentStep(0);
    setApiDone(false);
    setError(null);
    try {
      await onSubmit(url.trim());
      setApiDone(true);
    } catch {
      setStep("url");
      setError("Analysis failed — please check the URL and try again.");
    }
  }

  function handleUrlNext() {
    if (!url.trim()) return;
    if (savedDesignerType && savedSeniority) {
      runAnalysis();
    } else if (!savedDesignerType) {
      setStep("designer_type");
    } else {
      setStep("seniority");
    }
  }

  // ─── Loading screen (unchanged) ───────────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center w-full" style={{ maxWidth: "360px" }}>
          <p className="font-mono text-[18px] font-bold tracking-[-0.3px] text-[#0F172A] mb-8">Proof</p>
          <h1 className="text-[26px] font-semibold text-[#0F172A] mb-2" style={{ letterSpacing: "-0.5px" }}>
            Analyzing your portfolio
          </h1>
          <p className="text-[13px] text-[#94A3B8] mb-10">This takes about 30 seconds</p>
          <div className="inline-block text-left">
            {LOADING_STEPS.map((s, i) => {
              const done   = currentStep > i;
              const active = currentStep === i;
              return (
                <div key={s} className="flex items-center gap-3 mb-4">
                  {done && (
                    <svg className="w-5 h-5 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {active && (
                    <div className="w-5 h-5 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin flex-shrink-0" />
                  )}
                  {!done && !active && (
                    <div className="w-5 h-5 rounded-full border-2 border-[#E2E8F0] flex-shrink-0" />
                  )}
                  <span className={`text-[14px] ${active ? "font-medium text-[#0F172A]" : "text-[#94A3B8]"}`}>
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Modal overlay + card ─────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          background: "#FFFFFF",
          width: "480px",
          maxWidth: "90vw",
        }}
      >

        {/* ── Step 1: URL ───────────────────────────────────────────────── */}
        {step === "url" && (
          <>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "24px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.5px", marginBottom: "8px" }}>
              Where&apos;s your page?
            </h2>
            <p style={{ fontSize: "14px", color: "#94A3B8", lineHeight: "1.6", marginBottom: "24px" }}>
              One page, one deep read. Paste any URL from your portfolio — a case study, homepage, or about page. Proof analyzes one page at a time so the feedback is specific, not generic.
            </p>

            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUrlNext(); }}
              placeholder="https://yourpage.com"
              autoFocus
              className="w-full border border-[#E2E8F0] rounded-lg px-4 py-3 text-[14px] text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#2563EB] transition-colors duration-150"
              style={{ marginBottom: "8px" }}
            />
            <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "24px" }}>
              Works with Framer, Webflow, Notion, read.cv, and most portfolio sites
            </p>

            {error && (
              <p style={{ fontSize: "13px", color: "#DC2626", marginBottom: "16px" }}>{error}</p>
            )}

            <button
              disabled={!url.trim()}
              onClick={handleUrlNext}
              style={primaryButtonStyle(!!url.trim())}
            >
              Analyze this page →
            </button>

            <button onClick={onClose} style={skipButtonStyle}>
              Cancel
            </button>

            {savedDesignerType && (
              <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "16px", marginTop: "16px", textAlign: "center" }}>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Reviewing as a {savedDesignerType}{savedSeniority ? ` · ${savedSeniority}` : ""} ·{" "}
                </span>
                <button
                  onClick={() => { setSavedDesignerType(null); setSavedSeniority(null); }}
                  style={{ fontSize: "12px", color: "#2563EB", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Change
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Designer type ─────────────────────────────────────── */}
        {step === "designer_type" && (
          <>
            <ProgressDots filled={2} />
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px", marginBottom: "6px" }}>
              What kind of designer are you?
            </h2>
            <p style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "20px" }}>
              This helps us give you the most relevant feedback.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              {([
                { label: "Product / UX",  subtitle: "Apps, systems, experiences",   Icon: IconMobile    },
                { label: "Brand / Visual", subtitle: "Identity, campaigns, craft",   Icon: IconPalette   },
                { label: "UX Researcher",  subtitle: "Insights, methods, synthesis", Icon: IconChartBar  },
                { label: "Generalist",     subtitle: "A bit of everything",          Icon: IconCircles   },
              ] as const).map(({ label, subtitle, Icon }) => (
                <PillCard
                  key={label}
                  label={label}
                  subtitle={subtitle}
                  icon={<Icon color={designerType === label ? "#2563EB" : "#94A3B8"} />}
                  selected={designerType === label}
                  onClick={() => setDesignerType(label)}
                />
              ))}
            </div>

            <button
              disabled={!designerType}
              onClick={() => { if (designerType) setStep("seniority"); }}
              style={primaryButtonStyle(!!designerType)}
            >
              Next →
            </button>
            <button
              onClick={() => { setDesignerType("Product / UX"); setStep("seniority"); }}
              style={skipButtonStyle}
            >
              Skip for now
            </button>
          </>
        )}

        {/* ── Step 3: Seniority ─────────────────────────────────────────── */}
        {step === "seniority" && (
          <>
            <ProgressDots filled={3} />
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px", marginBottom: "6px" }}>
              Where are you in your career?
            </h2>
            <p style={{ fontSize: "14px", color: "#94A3B8", marginBottom: "20px" }}>
              We&apos;ll calibrate the feedback to what matters most at your level.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              {([
                { label: "Junior",    subtitle: "Looking for my first role",    Icon: IconSeedling    },
                { label: "Mid-level", subtitle: "Ready for a step up",          Icon: IconTrendingUp  },
                { label: "Senior",    subtitle: "Aiming for lead or staff",     Icon: IconStar        },
                { label: "Switching", subtitle: "Coming from another field",    Icon: IconRepeat      },
              ] as const).map(({ label, subtitle, Icon }) => (
                <PillCard
                  key={label}
                  label={label}
                  subtitle={subtitle}
                  icon={<Icon color={seniority === label ? "#2563EB" : "#94A3B8"} />}
                  selected={seniority === label}
                  onClick={() => setSeniority(label)}
                />
              ))}
            </div>

            <button
              disabled={!seniority}
              onClick={async () => {
                if (!seniority) return;
                const dt = designerType || savedDesignerType || "Product / UX";
                await saveProfile(dt, seniority);
                runAnalysis();
              }}
              style={primaryButtonStyle(!!seniority)}
            >
              Start analyzing →
            </button>
            <button
              onClick={async () => {
                const dt = designerType || savedDesignerType || "Product / UX";
                await saveProfile(dt, "Mid-level");
                runAnalysis();
              }}
              style={skipButtonStyle}
            >
              Skip for now
            </button>
          </>
        )}

      </div>
    </div>
  );
}
