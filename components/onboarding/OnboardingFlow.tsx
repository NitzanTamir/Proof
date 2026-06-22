"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Answers {
  portfolioUrl: string;
  role: string;
}

const TOTAL_STEPS = 4;

const LOADING_STEPS = [
  { label: "Reading your portfolio cover to cover", sub: "found 3 case studies" },
  { label: "Looking for the story behind the work", sub: null },
  { label: "Running it past an imaginary hiring panel", sub: null },
  { label: "Stress-testing your case study logic", sub: null },
  { label: "Almost there — compiling your results", sub: null },
];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    portfolioUrl: "",
    role: "",
  });
  const [loadingStep, setLoadingStep] = useState(0);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const supabase = createClient();

  void answers;

  const emailValid = email.includes("@");
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && !authLoading;

  async function handleGoogleSignIn() {
    setAuthError(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    console.log("[Proof] Google OAuth redirectTo:", redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      console.error("[Proof] Google OAuth error:", error.message);
      setAuthError(error.message);
    }
  }

  async function handleEmailSignUp() {
    setAuthError(null);
    if (!email.includes("@")) { setAuthError("Please enter a valid email address."); return; }
    if (password.length < 6) { setAuthError("Password must be at least 6 characters."); return; }
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    } else {
      setSignUpSuccess(true);
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    if (currentStep !== 3) { setLoadingStep(0); return; }
    const timers = [
      setTimeout(() => setLoadingStep(1), 2200),
      setTimeout(() => setLoadingStep(2), 4600),
      setTimeout(() => setLoadingStep(3), 7200),
      setTimeout(() => setLoadingStep(4), 10000),
      setTimeout(() => setLoadingStep(5), 12400),
      setTimeout(() => setCurrentStep(4), 13000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [currentStep]);

  function goBack() {
    if (currentStep === 4 && showAccountForm) {
      setShowAccountForm(false);
    } else if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }

  if (currentStep === 3) {
    const visibleCount = Math.min(loadingStep + 2, 5);
    const allDone = loadingStep === 5;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(-45deg, #EFF6FF, #DBEAFE, #EFF6FF, #F0F9FF)", backgroundSize: "400% 400%", animation: "gradientShift 6s ease infinite" }}>
        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes stepPulse {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.15); }
          }
          @keyframes stepPop {
            0%   { transform: scale(0); }
            60%  { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes gradientShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>

<span className="font-mono text-[18px] font-bold text-[#0F172A] tracking-[-0.3px] mb-10">
          Proof
        </span>
        <h2 className="font-display text-[32px] font-bold text-[#0F172A] tracking-[-0.5px] mb-4 text-center">
          Analyzing your portfolio
        </h2>
        <p className="text-[15px] text-[#475569] text-center mb-[52px]">
          This takes about 30 seconds
        </p>

        <div className="flex flex-col items-start w-[320px] min-h-[220px]">
          {LOADING_STEPS.map((step, i) => {
            if (i >= visibleCount) return null;
            const done   = loadingStep > i;
            const active = loadingStep === i && loadingStep <= 4;
            return (
              <div
                key={i}
                className="flex items-center gap-4 h-[44px]"
                style={{ animation: "fadeSlideIn 350ms ease both" }}
              >
                {done && (
                  <div
                    className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center flex-shrink-0"
                    style={{ animation: "stepPop 0.4s ease both" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </div>
                )}
                {active && (
                  <div className="w-5 h-5 rounded-full border-2 border-[#2563EB] flex items-center justify-center flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full bg-[#2563EB]"
                      style={{ animation: "stepPulse 1.2s ease infinite" }}
                    />
                  </div>
                )}
                {!done && !active && (
                  <div className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] flex-shrink-0" />
                )}
                <div>
                  <p className={`text-[15px] m-0 ${active ? "font-medium" : "font-normal"} ${done ? "text-[#475569]" : active ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                    {step.label}
                  </p>
                  {done && step.sub && (
                    <p className="text-[12px] text-[#2563EB] m-0" style={{ animation: "fadeIn 0.3s ease 0.3s both" }}>
                      {step.sub}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {allDone && (
          <p className="text-[14px] text-[#475569] text-center mt-2" style={{ animation: "fadeIn 0.4s ease both" }}>
            Taking you to your results...
          </p>
        )}

        <button
          onClick={() => setCurrentStep(2)}
          className="mt-14 text-[13px] font-normal text-[#94A3B8] hover:text-[#475569] transition-colors duration-150 cursor-pointer"
          style={{ background: "transparent", border: "none", padding: 0, fontFamily: "Inter, sans-serif" }}
        >
          ← Cancel and go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFF6FF]">

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 h-[52px] bg-white border-b border-[#E2E8F0] z-50 flex items-center justify-between px-8">
        <span className="font-mono text-[18px] font-bold text-[#0F172A] tracking-[-0.3px]">
          Proof
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-[#475569]">Already have an account?</span>
          <Link href="/login" className="text-[13px] text-[#2563EB] font-medium no-underline">
            Sign in →
          </Link>
        </div>
      </header>

      {/* Body — offset for fixed top bar */}
      <div className="pt-[52px]">

        {/* Progress & navigation */}
        <div className="max-w-[650px] mx-auto mt-10 flex items-center relative">
          {/* Back */}
          <div className="absolute left-0">
            {currentStep > 1 && (
              <button
                onClick={goBack}
                className="text-[13px] font-medium text-[#2563EB] bg-transparent border-none cursor-pointer p-0"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Step counter — centered */}
          <div className="flex-1 text-center">
            <span className="text-[13px] font-semibold text-[#2563EB]">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="max-w-[650px] mx-auto mt-6 bg-white rounded-2xl p-10 border border-[#E2E8F0]">
          {currentStep === 1 && (
            <div className="flex flex-col gap-6">

              {/* Group 1: eyebrow + heading + subtext */}
              <div>
                <p className="text-[12px] font-medium text-[#94A3B8] mb-2">
                  Your Portfolio
                </p>
                <h1 className="font-display text-[32px] font-bold text-[#0F172A] tracking-[-0.5px] mb-2">
                  Where&apos;s your portfolio?
                </h1>
                <p className="text-[14px] text-[#475569]">
                  Paste your URL and Proof will read your case studies directly.
                </p>
              </div>

              {/* Group 2: input + helper text */}
              <div>
                <input
                  type="url"
                  placeholder="https://yourportfolio.com"
                  value={answers.portfolioUrl}
                  onChange={(e) => setAnswers((a) => ({ ...a, portfolioUrl: e.target.value }))}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                  className="w-full border border-[#E2E8F0] rounded-lg py-3 px-4 text-[14px] text-[#0F172A] outline-none transition-colors duration-150 mb-2"
                />
                <p className="text-[12px] text-[#94A3B8]">
                  Works with read.cv, Notion, Framer, and personal sites
                </p>
              </div>

              {/* Info box */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg py-3 px-4 flex gap-1 items-start">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-px">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <p className="text-[14px] text-[#2563EB] leading-[1.5]">
                  The more complete your portfolio, the more specific your feedback will get. Proof reads every case study it can find.
                </p>
              </div>

              {/* CTA */}
              <button
                disabled={!answers.portfolioUrl.trim()}
                onClick={() => setCurrentStep(2)}
                className={`w-full bg-[#2563EB] text-white rounded-lg py-3 px-6 text-[13px] font-semibold border-none ${answers.portfolioUrl.trim() ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-50"}`}
              >
                Continue →
              </button>

            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col">
              <p className="text-[12px] font-medium text-[#94A3B8] mb-2">
                Your Goal
              </p>
              <h2 className="font-display text-[32px] font-bold text-[#0F172A] tracking-[-0.5px] mb-2">
                What&apos;s the role you&apos;re targeting?
              </h2>
              <p className="text-[14px] text-[#475569] mb-6">
                This changes how Proof weights hiring signal vs craft feedback.
              </p>

              {/* Option cards */}
              <div className="flex flex-col gap-3">
                {([
                  {
                    value: "junior",
                    title: "Junior Designer",
                    subtitle: "0-3 years experience",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="7" r="4" />
                        <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                      </svg>
                    ),
                  },
                  {
                    value: "mid",
                    title: "Mid-level Product Designer",
                    subtitle: "3-5 years experience",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="8" height="11" rx="1" />
                        <rect x="13" y="3" width="8" height="5" rx="1" />
                        <rect x="13" y="11" width="8" height="10" rx="1" />
                        <rect x="3" y="17" width="8" height="4" rx="1" />
                      </svg>
                    ),
                  },
                  {
                    value: "senior",
                    title: "Senior Product Designer",
                    subtitle: "5-8 years experience",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6l8-3 8 3-8 3-8-3" />
                        <path d="M4 12l8 3 8-3" />
                        <path d="M4 18l8 3 8-3" />
                      </svg>
                    ),
                  },
                  {
                    value: "lead",
                    title: "Lead or Staff Designer",
                    subtitle: "8+ years experience",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="9" r="6" />
                        <path d="M7 14.5L5 21l7-3 7 3-2-6.5" />
                      </svg>
                    ),
                  },
                ] as const).map(({ value, title, subtitle, icon }) => {
                  const selected = answers.role === value;
                  return (
                    <div
                      key={value}
                      onClick={() => setAnswers((a) => ({ ...a, role: value }))}
                      className={`flex items-center gap-3 rounded-lg p-4 cursor-pointer transition-colors duration-150 border ${selected ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white"}`}
                      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = "#2563EB"; }}
                      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = "#E2E8F0"; }}
                    >
                      <span className={`flex flex-shrink-0 ${selected ? "text-[#2563EB]" : "text-[#475569]"}`}>
                        {icon}
                      </span>
                      <div className="flex flex-col">
                        <span className={`text-[14px] ${selected ? "font-bold text-[#2563EB]" : "font-semibold text-[#0F172A]"}`}>{title}</span>
                        <span className={`text-[13px] ${selected ? "text-[#93C5FD]" : "text-[#94A3B8]"}`}>{subtitle}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <button
                disabled={!answers.role}
                onClick={() => setCurrentStep(3)}
                className={`mt-6 w-full bg-[#2563EB] text-white rounded-lg py-3 px-6 text-[13px] font-semibold border-none ${answers.role ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-50"}`}
              >
                Start analyzing →
              </button>

              {/* Skip */}
              <button
                onClick={() => setCurrentStep(3)}
                className="mt-3 w-full bg-transparent border-none text-[13px] text-[#2563EB] cursor-pointer text-center"
              >
                Skip — I&apos;ll add this later
              </button>
            </div>
          )}

          {currentStep === 4 && !showAccountForm && (
            <div className="flex flex-col">

              {/* Eyebrow */}
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#475569", marginBottom: "16px" }}>
                Your biggest opportunity
              </p>

              {/* Blue insight card */}
              <div style={{ background: "#EFF6FF", borderRadius: "12px", padding: "20px 24px", textAlign: "center", marginBottom: "24px" }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "80px", fontWeight: 700, color: "#2563EB", lineHeight: 1, display: "inline-block" }}>
                  3
                </span>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#2563EB", opacity: 0.8, marginTop: "2px", marginBottom: "8px" }}>
                  case studies affected
                </p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "15px", fontWeight: 600, color: "#0F172A", margin: 0, lineHeight: "1.4" }}>
                  Case studies missing trade-off visibility
                </p>
              </div>

              {/* What this means */}
              <div style={{ marginTop: "24px", marginBottom: "24px" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#2563EB", marginBottom: "8px" }}>
                  What this means
                </p>
                <p style={{ fontSize: "14px", color: "#0F172A", lineHeight: "1.6" }}>
                  Your case studies show what you built, not why. Senior hiring managers evaluate judgment — without trade-off visibility, your work gets filtered before a phone screen.
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "#E2E8F0", marginBottom: "20px" }} />

              {/* More findings row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <p style={{ fontSize: "13px", color: "#475569" }}>
                  8 more findings in your full analysis
                </p>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#DC2626" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EA580C" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16A34A" }} />
                </div>
              </div>

              {/* Ghost rows + lock overlay */}
              <div style={{ position: "relative" }}>
                {[{ dot: "#DC2626" }, { dot: "#EA580C" }, { dot: "#16A34A" }].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px 16px", border: "1px solid #E2E8F0", borderRadius: "8px",
                      filter: "blur(3px)", opacity: 0.45, pointerEvents: "none",
                      marginBottom: i < 2 ? "8px" : 0,
                    }}
                  >
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: row.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, height: "10px", background: "#E2E8F0", borderRadius: "4px" }} />
                    <div style={{ width: "60px", height: "10px", background: "#E2E8F0", borderRadius: "4px" }} />
                  </div>
                ))}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "7px 16px", fontSize: "12px", fontWeight: 500, color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Unlock with a free account
                  </div>
                </div>
              </div>

              {/* Free to start */}
              <p style={{ fontSize: "12px", color: "#94A3B8", textAlign: "center", marginTop: "24px", marginBottom: "12px" }}>
                Free to start · No credit card needed
              </p>

              {/* CTA */}
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg py-3 px-6 text-[14px] font-semibold border-none cursor-pointer transition-colors duration-150"
                >
                  Save your results and see the full analysis →
                </button>
              </div>

            </div>
          )}

          {currentStep === 4 && showAccountForm && signUpSuccess && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-10 h-10 rounded-full bg-[#16A34A] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <p className="text-[14px] text-[#0F172A] text-center leading-[1.6]">
                Check your email — we sent a confirmation link to <strong>{email}</strong>
              </p>
            </div>
          )}

          {currentStep === 4 && showAccountForm && !signUpSuccess && (
            <div className="flex flex-col gap-6">

              {/* Eyebrow + heading + subtext */}
              <div>
                <p className="text-[12px] font-medium text-[#94A3B8] mb-2">
                  Save Your Analysis
                </p>
                <h2 className="font-display text-[32px] font-bold text-[#0F172A] tracking-[-0.5px] mb-2">
                  Create a free account to access your full results
                </h2>
                <p className="text-[14px] text-[#475569]">
                  Your analysis found 3 critical gaps. Create an account to see all 9 findings and start fixing them before your next interview.
                </p>
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-white border border-[#E2E8F0] rounded-lg py-3 px-5 text-[14px] font-medium text-[#0F172A] cursor-pointer flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Or divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <span className="text-[13px] text-[#94A3B8]">or</span>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                  className="w-full border border-[#E2E8F0] rounded-lg py-3 px-4 text-[14px] text-[#0F172A] outline-none transition-colors duration-150"
                />
                {email && !emailValid && (
                  <p className="text-[13px] text-[#DC2626] mt-1">Please enter a valid email address.</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                    className="w-full border border-[#E2E8F0] rounded-lg py-3 pr-[48px] pl-4 text-[14px] text-[#0F172A] outline-none transition-colors duration-150"
                  />
                  <button
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[#94A3B8] p-0 flex items-center"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {password && !passwordValid && (
                  <p className="text-[13px] text-[#DC2626] mt-1">Password must be at least 6 characters.</p>
                )}
              </div>

              {/* Create account CTA */}
              <button
                onClick={handleEmailSignUp}
                disabled={!canSubmit}
                className={`w-full bg-[#2563EB] text-white rounded-lg py-3 px-6 text-[14px] font-semibold border-none ${canSubmit ? "cursor-pointer" : "cursor-not-allowed"} ${authLoading ? "opacity-[0.7]" : canSubmit ? "opacity-100" : "opacity-50"}`}
              >
                {authLoading ? "Creating account..." : "Create account and see my results →"}
              </button>

              {authError && (
                <p className="text-[13px] text-[#DC2626] text-center">{authError}</p>
              )}

              {/* Legal */}
              <p className="text-[12px] text-[#94A3B8] text-center leading-[1.5]">
                By continuing you agree to our{" "}
                <Link href="/terms" className="text-[#2563EB] no-underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-[#2563EB] no-underline">Privacy Policy</Link>
              </p>

              {/* Sign in */}
              <p className="text-[13px] text-center">
                <span className="text-[#475569]">Already have an account? </span>
                <Link href="/login" className="text-[#2563EB] no-underline font-medium">Sign in →</Link>
              </p>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
