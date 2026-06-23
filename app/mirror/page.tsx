"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAddressed, toggleAddressed } from "@/lib/addressed";
import Layout from "@/components/Layout";
import LoadingScreen from "@/components/LoadingScreen";
import UrlInputModal from "@/components/UrlInputModal";
import type { AuditRow, AuditFlag } from "@/lib/types";

// ─── helpers ───────────────────────────────────────────────────────────────

function tabLabel(audit: AuditRow): string {
  const t = audit.result?.title;
  if (t) return t;
  try { return new URL(audit.url).hostname.replace(/^www\./, ""); }
  catch { return audit.url.slice(0, 20); }
}

function severityBadgeClass(s: string) {
  if (s === "Critical") return "bg-[#DC2626] text-white";
  if (s === "Improve")  return "bg-[#D97706] text-white";
  return "bg-[#94A3B8] text-white";
}


function severityTag(severity: string) {
  if (severity === "Critical") return { backgroundColor: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" };
  if (severity === "Improve")  return { backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" };
  return { backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" };
}

function detailBorderClass(s: string) {
  if (s === "Critical") return "border-2 border-[#DC2626]";
  if (s === "Improve")  return "border-2 border-[#D97706]";
  return "border border-[#E2E8F0]";
}


function severityTitleColor(s: string) {
  if (s === "Critical") return "#B91C1C";
  if (s === "Improve")  return "#B45309";
  return "#475569";
}

function formatHours(minutes: number): string {
  if (minutes >= 60) return `~${(minutes / 60).toFixed(1)} hrs total`;
  return `~${minutes} min total`;
}

// ─── sub-components ─────────────────────────────────────────────────────────

interface FlagRowProps {
  flag: AuditFlag;
  globalIndex: number;
  isSelected: boolean;
  isAddressed: boolean;
  isDismissing: boolean;
  onClick: () => void;
}

function FlagRow({ flag, globalIndex, isSelected, isDismissing, onClick }: FlagRowProps) {
  return (
    <div
      onClick={onClick}
      style={isDismissing ? { animation: "flagDismiss 250ms ease-in forwards" } : undefined}
      className={`flex items-center gap-2 rounded-lg px-4 py-4 mb-3 cursor-pointer transition-colors ${
        isSelected
          ? "border-[1.5px] border-[#2563EB] bg-[#EFF6FF]"
          : "border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${severityBadgeClass(flag.severity)}`}>
        {globalIndex + 1}
      </div>
      <span className="text-[14px] font-medium text-[#0F172A] flex-1 min-w-0 truncate overflow-hidden">
        {flag.title}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <span className="text-[13px] text-[#94A3B8] whitespace-nowrap">~{flag.time_estimate_minutes}m</span>
        <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap", ...severityTag(flag.severity) }}>
          {flag.type}
        </span>
        <svg className="w-4 h-4 text-[#94A3B8] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  );
}

function ReviewerCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
          <svg className="w-[14px] h-[14px] text-[#94A3B8]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "15px", fontWeight: 600, color: "#0F172A" }}>Senior Product Designer</p>
          <p className="text-[12px] text-[#94A3B8]">8+ years · Both sides of hiring</p>
        </div>
      </div>
      <div className="mt-2 mb-4 flex flex-wrap gap-[4px]">
        {["Portfolio reviews", "Hiring panels", "Design mentorship"].map((tag) => (
          <span key={tag} style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap", border: "1px solid #DBEAFE", backgroundColor: "#EFF6FF", color: "#2563EB" }}>
            {tag}
          </span>
        ))}
      </div>
      <div className="pt-4 border-t border-[#E2E8F0]">
        <p className="text-[14px] text-[#475569]" style={{ lineHeight: "1.6" }}>
          I read this the way a design lead would before deciding whether to pass your portfolio to the hiring manager.
        </p>
      </div>
    </div>
  );
}

function fixToBullets(fix: unknown): string[] {
  if (!fix) return [];

  if (Array.isArray(fix)) {
    return fix
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : typeof item === "object" && item !== null
          ? (item as Record<string, unknown>).text as string ||
            (item as Record<string, unknown>).action as string ||
            String(item)
          : String(item)
      )
      .filter(Boolean);
  }

  if (typeof fix === "string") {
    return fix
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof fix === "object" && fix !== null) {
    const obj = fix as Record<string, unknown>;
    const arr = obj.bullets || obj.steps || obj.items || obj.actions || [];
    if (Array.isArray(arr)) {
      return arr.map(String).filter(Boolean);
    }
  }

  return [];
}

interface DetailCardProps {
  flag: AuditFlag;
  isAddressed: boolean;
  onToggle: () => void;
}

function DetailCard({ flag, isAddressed, onToggle }: DetailCardProps) {
  const bullets = fixToBullets(flag.fix);

  return (
    <div className={`bg-white rounded-xl p-6 ${detailBorderClass(flag.severity)}`}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <p
          className={`min-w-0 ${isAddressed ? "line-through opacity-40" : ""}`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", fontWeight: 700, color: severityTitleColor(flag.severity), letterSpacing: "-0.3px", lineHeight: "1.4" }}
        >
          {flag.title}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[13px] text-[#94A3B8] whitespace-nowrap">~{flag.time_estimate_minutes} min</span>
          <span className="flex-shrink-0" style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap", ...severityTag(flag.severity) }}>
            {flag.type}
          </span>
        </div>
      </div>

      {/* Observation */}
      <div className="mb-5">
        <p className="text-[14px] text-[#475569]" style={{ lineHeight: "1.65" }}>
          {flag.explanation}
        </p>
      </div>

      {/* How to fix */}
      <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "16px", marginBottom: "16px" }}>
        <div className="flex items-center gap-[4px] mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5z" />
            <path d="M13.5 6.5l4 4" />
          </svg>
          <p className="text-[12px] font-semibold text-[#475569]">How to fix</p>
        </div>
        <div className="flex flex-col">
          {bullets.map((bullet, i) => (
            <div key={i} className={`flex items-start gap-1${i < bullets.length - 1 ? " mb-3" : ""}`}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A", flexShrink: 0, marginTop: "2px" }}>
                →
              </span>
              <p className="text-[14px] text-[#475569]" style={{ lineHeight: "1.6" }}>
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>

      {isAddressed ? (
        <button
          onClick={onToggle}
          style={{ width: "160px" }}
          className="border border-[#E2E8F0] bg-white text-[#94A3B8] rounded-lg py-[10px] px-4 text-[13px] font-semibold hover:bg-[#F8FAFC] transition-colors"
        >
          Mark as not fixed
        </button>
      ) : (
        <button
          onClick={onToggle}
          style={{ display: "inline-block", padding: "12px 24px", width: "160px" }}
          className="bg-[#2563EB] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1D4ED8] transition-colors"
        >
          I&apos;ve fixed this
        </button>
      )}

    </div>
  );
}

// ─── main content (needs Suspense for useSearchParams) ───────────────────────

function MirrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userEmail, setUserEmail]             = useState<string | undefined>();
  const [audits, setAudits]                   = useState<AuditRow[]>([]);
  const [booting, setBooting]                 = useState(true);
  const [selectedId, setSelectedId]           = useState<string | null>(null);
  const [selectedFlagIdx, setSelectedFlagIdx] = useState<number>(0);
  const [addressed, setAddressed]             = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen]             = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos]           = useState<{ top: number; left: number } | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [dismissingIdx, setDismissingIdx]     = useState<number | null>(null);
  const [restoringIdx, setRestoringIdx]       = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing]         = useState(false);
  const dismissTimer                          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreTimer                          = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverRef                            = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email ?? undefined);
      supabase
        .from("audits")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          const rows = (data as AuditRow[]) ?? [];
          setAudits(rows);
          const paramId = searchParams.get("id");
          if (paramId && rows.some((r) => r.id === paramId)) {
            setSelectedId(paramId);
          } else if (rows.length > 0) {
            setSelectedId(rows[0].id);
          }
          setBooting(false);
        });
    });
  }, [router, searchParams]);

  useEffect(() => () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    if (restoreTimer.current) clearTimeout(restoreTimer.current);
  }, []);

  useEffect(() => {
    if (!confirmDeleteId) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setConfirmDeleteId(null); setPopoverPos(null); }
    }
    function onMouseDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setConfirmDeleteId(null);
        setPopoverPos(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [confirmDeleteId]);

  async function handleAnalyze(url: string) {
    console.log("handleAnalyze called, setting isAnalyzing true");
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const { audit } = (await res.json()) as { audit: AuditRow };
      const supabase = createClient();
      const { data } = await supabase.from("audits").select("*").order("created_at", { ascending: false });
      setAudits((data as AuditRow[]) ?? []);
      setSelectedId(audit.id);
      setSelectedFlagIdx(0);
    } finally {
      console.log("analysis complete, setting isAnalyzing false");
      setTimeout(() => setIsAnalyzing(false), 800);
    }
  }

  async function handleDelete(auditId: string) {
    setDeletingId(auditId);
    const supabase = createClient();
    await supabase.from("audits").delete().eq("id", auditId);
    const remaining = audits.filter((a) => a.id !== auditId);
    setAudits(remaining);
    setConfirmDeleteId(null);
    setPopoverPos(null);
    setDeletingId(null);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
      setSelectedFlagIdx(0);
    } else {
      setSelectedId(null);
      setSelectedFlagIdx(0);
    }
  }

  useEffect(() => {
    if (selectedId) setAddressed(getAddressed(selectedId));
  }, [selectedId]);

  function flagKey(idx: number) { return String(idx); }

  if (booting) return null;

  const audit    = audits.find((a) => a.id === selectedId) ?? null;
  const flags    = audit?.result?.flags ?? [];
  const critical = flags.filter((f) => f.severity === "Critical");
  const improve  = flags.filter((f) => f.severity === "Improve");
  const polish   = flags.filter((f) => f.severity === "Polish");
  const ordered  = [...critical, ...improve, ...polish];

  const isAddressed  = (idx: number) => addressed.has(flagKey(idx));
  const totalMin     = flags.reduce((s, f) => s + (f.time_estimate_minutes ?? 0), 0);
  const lastChecked  = audit
    ? new Date(audit.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const rawSummary = audit?.result?.summary as unknown;
  if (audit) console.log("[Proof] audit.result.summary:", JSON.stringify(audit.result?.summary, null, 2));

  let summaryHeadline: string | undefined;
  let summaryBody: string | undefined;

  if (!rawSummary) {
    // Case D: null/undefined — card will be hidden
  } else if (typeof rawSummary === "string") {
    // Case A: plain string — split by sentence boundaries
    const sentences = (rawSummary as string).split(/\.\s+/);
    summaryHeadline = sentences[0].endsWith(".") ? sentences[0] : sentences[0] + ".";
    summaryBody = sentences.length > 1 ? sentences.slice(1).join(". ") : undefined;
  } else {
    // Case B/C: object
    type SummaryObj = { headline?: string; body?: string; text?: string; description?: string; detail?: string; content?: string };
    const obj = rawSummary as SummaryObj;
    const bodyField = obj.body ?? obj.text ?? obj.description ?? obj.detail ?? obj.content;
    if (obj.headline && bodyField) {
      // Case B: both headline and a body field exist
      summaryHeadline = obj.headline;
      summaryBody = bodyField;
    } else {
      // Case C: only one field — show as body only
      summaryBody = obj.headline ?? bodyField;
    }
  }

  // Whichever flag is selected — no auto-redirect so addressed flags can be shown in the panel
  const selectedFlag       = ordered[selectedFlagIdx] ?? null;
  // True when the flag is addressed AND not mid-dismiss-animation (so button state stays correct during the animation)
  const selectedIsAddressed = isAddressed(selectedFlagIdx) && dismissingIdx !== selectedFlagIdx;

  function handleDismiss() {
    const idx = selectedFlagIdx;
    const next = toggleAddressed(selectedId ?? "", flagKey(idx));
    setAddressed(next);
    setDismissingIdx(idx);

    dismissTimer.current = setTimeout(() => {
      setDismissingIdx(null);
      const nextIdx = ordered.findIndex((_, i) => i !== idx && !next.has(flagKey(i)));
      setSelectedFlagIdx(nextIdx !== -1 ? nextIdx : idx);
    }, 250);
  }

  function handleRestore(idx: number) {
    setRestoringIdx(idx);
    restoreTimer.current = setTimeout(() => {
      const next = toggleAddressed(selectedId ?? "", flagKey(idx));
      setAddressed(next);
      setRestoringIdx(null);
      setSelectedFlagIdx(idx);
    }, 250);
  }

  function FlagSection({ label, labelClass, sectionFlags, startIndex }: {
    label: string;
    labelClass: string;
    sectionFlags: AuditFlag[];
    startIndex: number;
  }) {
    if (sectionFlags.length === 0) return null;

    const hasVisible = sectionFlags.some((_, i) => {
      const gi = startIndex + i;
      return !isAddressed(gi) || dismissingIdx === gi;
    });
    if (!hasVisible) return null;

    return (
      <div className="mb-6">
        <p className={`text-[13px] font-semibold mb-2 ${labelClass}`}>{label}</p>
        {sectionFlags.map((flag, i) => {
          const gi = startIndex + i;
          if (isAddressed(gi) && dismissingIdx !== gi) return null;
          return (
            <FlagRow
              key={gi}
              flag={flag}
              globalIndex={gi}
              isSelected={selectedFlagIdx === gi}
              isAddressed={isAddressed(gi)}
              isDismissing={dismissingIdx === gi}
              onClick={() => { if (!(isAddressed(gi) && dismissingIdx !== gi)) setSelectedFlagIdx(gi); }}
            />
          );
        })}
      </div>
    );
  }

  const hasAddressedFlags = ordered.some((_, i) => isAddressed(i));

  return (
    <>
      <Layout userEmail={userEmail}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-start justify-between px-8 pt-8 pb-3">
            <div>
              <h1 className="font-display text-[26px] font-bold text-[#0F172A] leading-tight" style={{ letterSpacing: "-0.5px" }}>
                The Mirror
              </h1>
              <p className="text-[13px] text-[#94A3B8] mt-1">
                How a senior designer reads your portfolio
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastChecked && (
                <span className="text-[13px] text-[#94A3B8]">Last checked {lastChecked}</span>
              )}
              <button
                onClick={() => setModalOpen(true)}
                className="bg-[#2563EB] text-white px-6 py-3 rounded-lg text-[14px] font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                Check another page
              </button>
            </div>
          </div>

          {audits.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-[14px] text-[#94A3B8] mb-4">No pages analyzed yet</p>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-[#2563EB] text-white px-6 py-3 rounded-lg text-[14px] font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                Run your first check
              </button>
            </div>
          ) : (
            <>
              {/* Tabs — scrollable, no truncation */}
              <div
                className="flex-shrink-0 border-b border-[#E2E8F0] mb-4 flex overflow-x-auto px-8"
                style={{ scrollbarWidth: "none" }}
              >
                {audits.map((a) => {
                  const isSelected = a.id === selectedId;
                  return (
                    <div
                      key={a.id}
                      className={`group relative flex items-center flex-shrink-0 border-b-[3px] -mb-px transition-colors hover:bg-[#F8FAFC] rounded-t ${
                        isSelected ? "border-[#2563EB]" : "border-transparent"
                      }`}
                    >
                      <button
                        onClick={() => { setSelectedId(a.id); setSelectedFlagIdx(0); }}
                        className={`px-4 py-3 text-[14px] whitespace-nowrap transition-colors ${
                          isSelected ? "text-[#2563EB] font-semibold" : "text-[#94A3B8]"
                        }`}
                      >
                        {tabLabel(a)}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPopoverPos({ top: rect.bottom + 8, left: rect.left - 80 });
                          setConfirmDeleteId(a.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mr-3"
                        style={{ fontSize: "14px", color: "#94A3B8", background: "transparent", border: "none", cursor: "pointer", padding: "0 0 0 4px", lineHeight: 1, flexShrink: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              {audit && (
                <div className="flex-1 min-h-0 grid grid-cols-3 gap-6 overflow-hidden px-8 pb-8" style={{ gridTemplateRows: "1fr" }}>
                  {/* LEFT — summary + flags */}
                  <div className="col-span-2 min-w-0 overflow-y-auto">

                    {/* Summary card */}
                    {(summaryHeadline || summaryBody) && (
                      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-4">
                        {summaryHeadline && (
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "18px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px", lineHeight: "1.3", marginBottom: "8px" }}>
                            {summaryHeadline}
                          </p>
                        )}
                        {summaryBody && (
                          <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.65" }}>
                            {summaryBody}
                          </p>
                        )}
                        {audit.result.strengths && audit.result.strengths.length > 0 && (
                          <div style={{ borderTop: "1px solid #F1F5F9", marginTop: "20px", paddingTop: "16px" }}>
                            {audit.result.strengths.map((s, i) => {
                              return (
                                <div key={i} style={{ background: "#F8FAFC", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: i < audit.result.strengths!.length - 1 ? "12px" : 0 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M9 12l2 2 4-4" />
                                  </svg>
                                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A", margin: 0 }}>{s.label}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* What to work on card */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-[15px] font-semibold text-[#0F172A]">Here&apos;s what to work on</h2>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] text-[#94A3B8]">{formatHours(totalMin)}</span>
                          <span className="text-[13px] text-[#94A3B8]">Sorted by urgency</span>
                        </div>
                      </div>

                      {ordered.length === 0 ? (
                        <p className="text-[14px] text-[#94A3B8] text-center py-8">No flags found</p>
                      ) : (
                        <>
                          <FlagSection label="Critical" labelClass="text-[#DC2626]" sectionFlags={critical} startIndex={0} />
                          <FlagSection label="Improve"  labelClass="text-[#D97706]" sectionFlags={improve}  startIndex={critical.length} />
                          <FlagSection label="Polish"   labelClass="text-[#475569]" sectionFlags={polish}   startIndex={critical.length + improve.length} />

                          {/* Addressed section */}
                          {hasAddressedFlags && (
                            <div className="mt-6">
                              <div className="flex items-center gap-[4px] mb-2">
                                <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[14px] font-semibold text-[#16A34A]">Addressed</p>
                              </div>
                              {ordered.map((flag, gi) => {
                                if (!isAddressed(gi)) return null;
                                return (
                                  <div
                                    key={gi}
                                    onClick={() => setSelectedFlagIdx(gi)}
                                    style={{
                                      animation: restoringIdx === gi
                                        ? "flagDismiss 250ms ease-in forwards"
                                        : "fadeInUp 200ms ease-out 50ms both",
                                    }}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-4 mb-3 cursor-pointer border bg-[#F8FAFC] transition-colors ${
                                      selectedFlagIdx === gi
                                        ? "border-[#2563EB]"
                                        : "border-[#E2E8F0] hover:bg-[#F1F5F9]"
                                    }`}
                                  >
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold bg-[#16A34A] text-white">
                                      {gi + 1}
                                    </div>
                                    <span className="text-[14px] font-medium flex-1 min-w-0 truncate overflow-hidden text-[#94A3B8] line-through">
                                      {flag.title}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                      <span className="text-[13px] text-[#94A3B8] whitespace-nowrap">~{flag.time_estimate_minutes}m</span>
                                      <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap", backgroundColor: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" }}>
                                        {flag.type}
                                      </span>
                                      <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* RIGHT — reviewer + detail */}
                  <div className="col-span-1 min-w-0 overflow-y-auto flex flex-col gap-4">
                    <ReviewerCard />
                    {selectedFlag && (
                      <DetailCard
                        flag={selectedFlag}

                        isAddressed={selectedIsAddressed}
                        onToggle={selectedIsAddressed
                          ? () => handleRestore(selectedFlagIdx)
                          : handleDismiss}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>

      {confirmDeleteId && popoverPos && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: popoverPos.top,
            left: popoverPos.left,
            zIndex: 1000,
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "20px",
            width: "240px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: "#0F172A", marginBottom: "6px" }}>
            Delete this audit?
          </div>
          <div style={{ fontSize: "14px", color: "#475569", lineHeight: "1.5", marginBottom: "16px" }}>
            Your feedback will be gone. You can always analyze it again.
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => { setConfirmDeleteId(null); setPopoverPos(null); }}
              style={{ flex: 1, border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#475569", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: "500" as const, cursor: "pointer" }}
            >
              Keep it
            </button>
            <button
              onClick={() => handleDelete(confirmDeleteId)}
              disabled={deletingId === confirmDeleteId}
              style={{ flex: 1, border: "none", background: "#DC2626", color: "white", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: "600" as const, cursor: "pointer", opacity: deletingId === confirmDeleteId ? 0.5 : 1 }}
            >
              Delete
            </button>
          </div>
        </div>,
        document.body
      )}

      {modalOpen && (
        <UrlInputModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleAnalyze}
        />
      )}

      {isAnalyzing && (
        <LoadingScreen onCancel={() => setIsAnalyzing(false)} />
      )}

    </>
  );
}

export default function MirrorPage() {
  return (
    <Suspense>
      <MirrorContent />
    </Suspense>
  );
}
