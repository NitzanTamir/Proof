"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAddressed } from "@/lib/addressed";
import Layout from "@/components/Layout";
import UrlInputModal from "@/components/UrlInputModal";
import type { AuditRow, AuditFlag } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function daysAgo(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, Improve: 1, Polish: 2 };

const PAGE_TYPE_LABEL: Record<string, string> = {
  case_study: "Case study",
  homepage:   "Homepage",
  about:      "About",
  other:      "Other",
};

function getOrderedFlags(audit: AuditRow): AuditFlag[] {
  const flags = audit.result?.flags ?? [];
  return [
    ...flags.filter((f) => f.severity === "Critical"),
    ...flags.filter((f) => f.severity === "Improve"),
    ...flags.filter((f) => f.severity === "Polish"),
  ];
}

interface Stats {
  totalCritical: number;
  addressedCritical: number;
  toImprove: number;
  totalAddressed: number;
}

function computeStats(audits: AuditRow[]): Stats {
  let totalCritical = 0;
  let addressedCritical = 0;
  let toImprove = 0;
  let totalAddressed = 0;

  for (const audit of audits) {
    const flags    = audit.result?.flags ?? [];
    const critical = flags.filter((f) => f.severity === "Critical");
    const improve  = flags.filter((f) => f.severity === "Improve");
    const addressed = getAddressed(audit.id);

    totalCritical  += critical.length;
    toImprove      += improve.length;
    totalAddressed += addressed.size;

    for (let i = 0; i < critical.length; i++) {
      if (addressed.has(String(i))) addressedCritical++;
    }
  }

  return { totalCritical, addressedCritical, toImprove, totalAddressed };
}

function findNextMove(audits: AuditRow[]): { flag: AuditFlag; audit: AuditRow } | null {
  let best: { flag: AuditFlag; audit: AuditRow } | null = null;

  for (const audit of audits) {
    const ordered   = getOrderedFlags(audit);
    const addressed = getAddressed(audit.id);

    for (let i = 0; i < ordered.length; i++) {
      if (addressed.has(String(i))) continue;
      const flag = ordered[i];

      if (!best) { best = { flag, audit }; continue; }

      const bestSev = SEVERITY_ORDER[best.flag.severity] ?? 2;
      const thisSev = SEVERITY_ORDER[flag.severity] ?? 2;
      if (
        thisSev < bestSev ||
        (thisSev === bestSev && flag.time_estimate_minutes > best.flag.time_estimate_minutes)
      ) {
        best = { flag, audit };
      }
    }
  }

  return best;
}

function fixToBullets(fix: unknown): string[] {
  if (!fix) return [];
  if (Array.isArray(fix)) return fix.map((item) => (typeof item === "string" ? item.trim() : typeof item === "object" && item !== null ? ((item as Record<string, unknown>).text as string) || String(item) : String(item))).filter(Boolean);
  if (typeof fix === "string") return fix.trim().split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (typeof fix === "object" && fix !== null) { const arr = (fix as Record<string, unknown>).bullets || (fix as Record<string, unknown>).steps || []; if (Array.isArray(arr)) return arr.map(String).filter(Boolean); }
  return [];
}

function findSecondMove(audits: AuditRow[], skip: { flag: AuditFlag; audit: AuditRow } | null): { flag: AuditFlag; audit: AuditRow } | null {
  if (!skip) return null;
  let best: { flag: AuditFlag; audit: AuditRow } | null = null;
  for (const audit of audits) {
    const ordered   = getOrderedFlags(audit);
    const addressed = getAddressed(audit.id);
    for (let i = 0; i < ordered.length; i++) {
      if (addressed.has(String(i))) continue;
      const flag = ordered[i];
      if (audit.id === skip.audit.id && flag.title === skip.flag.title) continue;
      if (!best) { best = { flag, audit }; continue; }
      const bestSev = SEVERITY_ORDER[best.flag.severity] ?? 2;
      const thisSev = SEVERITY_ORDER[flag.severity] ?? 2;
      if (thisSev < bestSev || (thisSev === bestSev && (flag.time_estimate_minutes ?? 0) > (best.flag.time_estimate_minutes ?? 0))) best = { flag, audit };
    }
  }
  return best;
}

function getFixedFlags(audits: AuditRow[]): Array<{ flag: AuditFlag; audit: AuditRow }> {
  const result: Array<{ flag: AuditFlag; audit: AuditRow }> = [];

  for (const audit of audits) {
    const ordered   = getOrderedFlags(audit);
    const addressed = getAddressed(audit.id);
    for (let i = 0; i < ordered.length; i++) {
      if (addressed.has(String(i))) result.push({ flag: ordered[i], audit });
    }
  }

  return result.slice(0, 3);
}

function auditDotColor(audit: AuditRow): string {
  const flags = audit.result?.flags ?? [];
  if (flags.some((f) => f.severity === "Critical")) return "bg-[#DC2626]";
  if (flags.some((f) => f.severity === "Improve"))  return "bg-[#D97706]";
  return "bg-[#16A34A]";
}

function flagSummaryText(audit: AuditRow): string {
  const flags    = audit.result?.flags ?? [];
  const critical = flags.filter((f) => f.severity === "Critical").length;
  const improve  = flags.filter((f) => f.severity === "Improve").length;
  const parts: string[] = [];
  if (critical > 0) parts.push(`${critical} critical`);
  if (improve > 0)  parts.push(`${improve} improve`);
  return parts.length > 0 ? parts.join(", ") : "No flags";
}

function nextMoveBadgeClass(s: string) {
  if (s === "Critical") return "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]";
  if (s === "Improve")  return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  return "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]";
}

// ─── icons ───────────────────────────────────────────────────────────────────

function IconFile({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [audits, setAudits]       = useState<AuditRow[]>([]);
  const [booting, setBooting]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [stats, setStats]           = useState<Stats>({ totalCritical: 0, addressedCritical: 0, toImprove: 0, totalAddressed: 0 });
  const [nextMove, setNextMove]     = useState<{ flag: AuditFlag; audit: AuditRow } | null>(null);
  const [fixedFlags, setFixedFlags] = useState<Array<{ flag: AuditFlag; audit: AuditRow }>>([]);

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
          setBooting(false);
        });
    });
  }, [router]);

  useEffect(() => {
    if (audits.length === 0) return;
    setStats(computeStats(audits));
    setNextMove(findNextMove(audits));
    setFixedFlags(getFixedFlags(audits));
  }, [audits]);

  async function handleAnalyze(url: string) {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error("Analysis failed");
    const { audit } = (await res.json()) as { audit: AuditRow };
    router.push(`/mirror?id=${audit.id}`);
  }

  if (booting) return null;

  const { totalCritical, addressedCritical, toImprove, totalAddressed } = stats;
  const criticalRemaining = totalCritical - addressedCritical;
  const readinessPercent  = totalCritical === 0 ? 100 : Math.round((addressedCritical / totalCritical) * 100);
  const readinessText     = totalCritical === 0
    ? "No critical issues found"
    : `You've fixed ${addressedCritical} critical issue${addressedCritical !== 1 ? "s" : ""} — ${criticalRemaining} to go`;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const secondMove = findSecondMove(audits, nextMove);

  return (
    <>
      <Layout userEmail={userEmail}>
        <div className="h-full flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex-shrink-0 flex items-start justify-between px-8 pt-8 pb-6">
            <div>
              <h1 className="font-display text-[30px] font-bold text-[#0F172A] leading-tight" style={{ letterSpacing: "-0.5px" }}>
                Dashboard
              </h1>
              <p className="text-[13px] text-[#94A3B8] mt-1">{today}</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#2563EB] text-white px-6 py-3 rounded-lg text-[14px] font-semibold hover:bg-[#1D4ED8] active:bg-[#1E40AF] transition-colors"
            >
              Run Mirror check
            </button>
          </div>

          {/* Two-column grid */}
          <div className="flex-1 min-h-0 grid overflow-hidden px-8 pb-8 gap-6" style={{ gridTemplateColumns: "62fr 38fr", gridTemplateRows: "1fr" }}>

            {/* LEFT: Your Next Move */}
            <div className="overflow-y-auto min-h-0 h-full">
            <div className="bg-white border border-[#DBEAFE] rounded-xl p-6 h-full flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-4">
                <p className="font-display text-[15px] font-semibold text-[#2563EB]">Your next move</p>
                {nextMove && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[13px] text-[#94A3B8]">~{nextMove.flag.time_estimate_minutes} min</span>
                    <span className={`text-[12px] font-medium border rounded-full px-[10px] py-[3px] ${nextMoveBadgeClass(nextMove.flag.severity)}`}>
                      {nextMove.flag.type}
                    </span>
                  </div>
                )}
              </div>
              {audits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[14px] text-[#94A3B8] mb-3">No pages analyzed yet</p>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#2563EB] text-white px-6 py-3 rounded-lg text-[14px] font-semibold hover:bg-[#1D4ED8] transition-colors"
                  >
                    Run Mirror check to get started
                  </button>
                </div>
              ) : !nextMove ? (
                <div className="text-center py-8">
                  <p className="text-[14px] font-medium text-[#16A34A] mb-1">All flags addressed!</p>
                  <p className="text-[13px] text-[#94A3B8]">Run a new check to find more improvements.</p>
                </div>
              ) : (
                <>
                  <p className="font-display text-[22px] font-bold text-[#0F172A] mb-3" style={{ letterSpacing: "-0.4px", lineHeight: "1.3" }}>
                    {nextMove.flag.title}
                  </p>

                  <p className="text-[14px] text-[#475569] mb-5" style={{ lineHeight: "1.65" }}>
                    {nextMove.flag.explanation}
                  </p>

                  <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "16px", marginBottom: "20px" }}>
                    <div className="flex items-center gap-[4px] mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5z" />
                        <path d="M13.5 6.5l4 4" />
                      </svg>
                      <p className="text-[12px] font-semibold text-[#475569]">How to fix</p>
                    </div>
                    <div className="flex flex-col">
                      {fixToBullets(nextMove.flag.fix).map((bullet, i, arr) => (
                        <div key={i} className="flex items-start gap-1" style={{ marginBottom: i < arr.length - 1 ? "12px" : 0 }}>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "#0F172A", flexShrink: 0, marginTop: "2px" }}>→</span>
                          <p className="text-[14px] text-[#475569]" style={{ lineHeight: "1.6", margin: 0 }}>{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-[4px] mb-5">
                    <IconFile className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                    <span className="text-[13px] text-[#94A3B8]">
                      Found in: {nextMove.audit.result?.title || nextMove.audit.url}
                    </span>
                  </div>

                  <Link
                    href={`/mirror?id=${nextMove.audit.id}`}
                    className="inline-block self-start w-auto bg-[#2563EB] text-white rounded-lg py-3 px-6 text-[14px] font-semibold hover:bg-[#1D4ED8] active:bg-[#1E40AF] transition-colors"
                  >
                    Let&apos;s fix this →
                  </Link>

                  {secondMove && (
                    <div style={{ paddingTop: "8px", marginTop: "12px", borderTop: "1px solid #F1F5F9" }}>
                      <span className="text-[12px] text-[#94A3B8]">Next up: </span>
                      <span className="text-[12px] text-[#475569]">{secondMove.flag.title}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            </div>{/* end left scroll wrapper */}

            {/* RIGHT: stacked cards */}
            <div className="flex flex-col gap-4 overflow-y-auto">

              {/* Your progress */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "15px", fontWeight: 600, color: "#0F172A" }}>Your progress</p>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "36px", fontWeight: 700, color: "#2563EB", letterSpacing: "-0.3px", alignSelf: "flex-start", marginTop: 0 }}>
                    {readinessPercent}%
                  </span>
                </div>
                <p className="text-[14px] text-[#475569]" style={{ marginBottom: "12px" }}>{readinessText}</p>
                <div className="w-full bg-[#F1F5F9] h-[6px] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-all"
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: "12px" }}>
                  <div className="flex items-center gap-[4px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                    <span className="text-[13px] text-[#475569]">{criticalRemaining} critical left</span>
                  </div>
                  <div className="flex items-center gap-[4px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    <span className="text-[13px] text-[#475569]">{toImprove} to improve</span>
                  </div>
                  <div className="flex items-center gap-[4px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    <span className="text-[13px] text-[#475569]">{totalAddressed} fixed</span>
                  </div>
                </div>
              </div>

              {/* Your Pages */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6" style={{ borderTop: "2px solid #2563EB" }}>
                <p className="font-display text-[15px] font-semibold text-[#0F172A] mb-4">Your pages</p>

                {audits.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8]">
                    No pages yet — paste your first URL above and we&apos;ll take a look
                  </p>
                ) : (
                  <div>
                    {audits.map((audit, i) => (
                      <div
                        key={audit.id}
                        className={`flex items-start justify-between gap-2 ${
                          i < audits.length - 1 ? "border-b border-[#F1F5F9] pb-3 mb-3" : ""
                        }`}
                      >
                        <div className="flex items-start gap-[4px] min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${auditDotColor(audit)}`} />
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium text-[#0F172A]" style={{ lineHeight: "1.3" }}>
                              {audit.result?.title || audit.url}
                            </p>
                            <p className="text-[13px] text-[#94A3B8]">
                              {PAGE_TYPE_LABEL[audit.page_type] ?? "Other"} · {flagSummaryText(audit)}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/mirror?id=${audit.id}`}
                          className="text-[13px] font-medium text-[#2563EB] hover:underline flex-shrink-0"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* What you've fixed */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                <p className="font-display text-[15px] font-semibold text-[#0F172A] mb-4">What you&apos;ve fixed</p>

                {fixedFlags.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8]">
                    Flags you fix will show up here
                  </p>
                ) : (
                  <div>
                    {fixedFlags.map(({ flag, audit }, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-[4px] mb-3 last:mb-0"
                        style={{
                          animation: "fadeInUp 300ms ease-out both",
                          animationDelay: `${i * 80}ms`,
                        }}
                      >
                        <IconCheck className="w-[18px] h-[18px] text-[#16A34A] flex-shrink-0" />
                        <div>
                          <p className="text-[14px] text-[#475569] line-through leading-snug">{flag.title}</p>
                          <p className="text-[12px] text-[#94A3B8]">
                            {audit.result?.title || audit.url} · {daysAgo(audit.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </Layout>

      {modalOpen && (
        <UrlInputModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleAnalyze}
        />
      )}
    </>
  );
}
