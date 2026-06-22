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
  const ordered   = getOrderedFlags(audit);
  const addressed = getAddressed(audit.id);
  const remaining = ordered.filter((_, i) => !addressed.has(String(i)));
  if (remaining.some((f) => f.severity === "Critical")) return "bg-[#DC2626]";
  if (remaining.some((f) => f.severity === "Improve"))  return "bg-[#D97706]";
  return "bg-[#16A34A]";
}

function flagSummaryText(audit: AuditRow): string {
  const ordered   = getOrderedFlags(audit);
  const addressed = getAddressed(audit.id);
  const remaining = ordered.filter((_, i) => !addressed.has(String(i)));
  const critical  = remaining.filter((f) => f.severity === "Critical").length;
  const improve   = remaining.filter((f) => f.severity === "Improve").length;
  const parts: string[] = [];
  if (critical > 0) parts.push(`${critical} critical`);
  if (improve > 0)  parts.push(`${improve} improve`);
  if (parts.length > 0) return parts.join(", ");
  return ordered.length > 0 && remaining.length === 0 ? "All fixed" : "No flags";
}


// ─── icons ───────────────────────────────────────────────────────────────────



function BulletIcon({ bullet }: { bullet: string }) {
  const t = bullet.toLowerCase();
  let paths: React.ReactNode;
  if (/\b(metric|impact|result|outcome|number|data|stat|roi|conversion|measur)\b/.test(t)) {
    paths = <>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </>;
  } else if (/\b(show|display|visual|see|view|look|highlight|present|screenshot|visible)\b/.test(t)) {
    paths = <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>;
  } else if (/\b(structur|organiz|section|layout|format|step|list|hierarch|order)\b/.test(t)) {
    paths = <>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </>;
  } else if (/\b(explain|context|narrativ|story|reason|why|thinking|thought|communicat|message)\b/.test(t)) {
    paths = <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />;
  } else {
    paths = <>
      <path d="M4 20h4l10.5-10.5a2.828 2.828 0 1 0-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </>;
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {paths}
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
              <div className="flex items-start justify-between gap-4">
                <p className="font-display text-[15px] font-semibold text-[#2563EB]">Your next move</p>
                {nextMove && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[13px] text-[#94A3B8]">~{nextMove.flag.time_estimate_minutes} min</span>
                    <span style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "3px 10px", fontSize: "12px", fontWeight: 500, display: "inline-flex", alignItems: "center", height: "26px" }}>
                      {nextMove.audit.result?.title || nextMove.audit.url}
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
                  <p className="font-display text-[22px] font-bold text-[#0F172A]" style={{ letterSpacing: "-0.4px", lineHeight: "1.3", marginTop: "8px" }}>
                    {nextMove.flag.title}
                  </p>

                  <p className="text-[14px] text-[#475569]" style={{ lineHeight: "1.65", marginTop: "8px" }}>
                    {nextMove.flag.explanation}
                  </p>

<p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", fontWeight: 700, color: "#0F172A", marginTop: "20px", marginBottom: "12px" }}>
                    How to fix
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                    {(() => {
                      const bullets = fixToBullets(nextMove.flag.fix);
                      return bullets.map((bullet, i) => (
                      <div key={i} style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", flex: "0 1 auto", width: "fit-content", minWidth: "280px", maxWidth: "420px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                          <BulletIcon bullet={bullet} />
                        </div>
                        <p style={{ fontSize: "15px", fontWeight: 500, color: "#0F172A", lineHeight: "1.55", flex: 1, marginBottom: "14px" }}>
                          {bullet}
                        </p>
                        <Link
                          href={`/mirror?id=${nextMove.audit.id}`}
                          className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-150"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", padding: 0, fontSize: "12px", fontWeight: 600 }}
                        >
                          Let&apos;s fix this →
                        </Link>
                      </div>
                    ));
                    })()}
                  </div>
                </>
              )}
            </div>
            </div>{/* end left scroll wrapper */}

            {/* RIGHT: stacked cards */}
            <div className="flex flex-col gap-4 overflow-y-auto">

              {/* Your progress */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl pt-4 pr-6 pb-6 pl-6">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "15px", fontWeight: 600, color: "#0F172A", marginBottom: "8px" }}>Your progress</p>
                    <p className="text-[14px] text-[#475569]" style={{ margin: 0 }}>{readinessText}</p>
                  </div>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "36px", fontWeight: 700, color: "#2563EB", letterSpacing: "-0.3px" }}>
                    {readinessPercent}%
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-[6px] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-all"
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: "16px" }}>
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
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
                <p className="font-display text-[15px] font-semibold text-[#0F172A] mb-2">Your pages</p>

                {audits.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8]">
                    No pages yet — paste your first URL above and we&apos;ll take a look
                  </p>
                ) : (
                  <div>
                    {audits.map((audit, i) => (
                      <div
                        key={audit.id}
                        style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px", marginBottom: i < audits.length - 1 ? "10px" : 0, display: "flex", alignItems: "center", gap: "12px" }}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${auditDotColor(audit)}`} />
                        <div className="min-w-0" style={{ flex: 1 }}>
                          <p className="font-semibold text-[#1E293B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "13px", lineHeight: "1.3" }}>
                            {audit.result?.title || audit.url}
                          </p>
                          <p className="text-[13px] text-[#94A3B8]">
                            {PAGE_TYPE_LABEL[audit.page_type] ?? "Other"} · {flagSummaryText(audit)}
                          </p>
                        </div>
                        <Link
                          href={`/mirror?id=${audit.id}`}
                          className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-150"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", padding: 0, fontSize: "12px", fontWeight: 600, flexShrink: 0 }}
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
                <p className="font-display text-[15px] font-semibold text-[#0F172A] mb-2">What you&apos;ve fixed</p>

                {fixedFlags.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8]">
                    Flags you fix will show up here
                  </p>
                ) : (
                  <div>
                    {fixedFlags.map(({ flag, audit }, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#F0FDF4",
                          borderRadius: "8px",
                          padding: "12px 14px",
                          marginBottom: i < fixedFlags.length - 1 ? "6px" : 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          animation: "fadeInUp 300ms ease-out both",
                          animationDelay: `${i * 80}ms`,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#16A34A" style={{ flexShrink: 0 }}>
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5l-4-4 1.41-1.41L10.5 13.67l5.59-5.59L17.5 9.5l-7 7z"/>
                        </svg>
                        <div>
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "13px", fontWeight: 600, color: "#15803D" }}>{flag.title}</p>
                          <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>
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
