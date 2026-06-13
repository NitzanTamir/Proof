"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Layout from "@/components/Layout";
import type { AuditRow } from "@/lib/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const PAGE_TYPE_LABEL: Record<string, string> = {
  case_study: "Case study",
  homepage:   "Homepage",
  about:      "About",
  other:      "Other",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [audits, setAudits]       = useState<AuditRow[]>([]);
  const [booting, setBooting]     = useState(true);

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
          setAudits((data as AuditRow[]) ?? []);
          setBooting(false);
        });
    });
  }, [router]);

  if (booting) return null;

  const metaLine = audits.length === 0
    ? "No audits yet"
    : `${audits.length} audit${audits.length !== 1 ? "s" : ""} · last run ${formatDate(audits[0].created_at)}`;

  return (
    <Layout userEmail={userEmail}>
      <div className="h-full overflow-y-auto p-8">

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "26px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.5px", marginBottom: "4px" }}>
            Audit history
          </h1>
          <p style={{ fontSize: "13px", color: "#475569" }}>{metaLine}</p>
        </div>

        {/* Table card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
          {audits.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#0F172A", marginBottom: "4px" }}>No audits yet</p>
              <p style={{ fontSize: "13px", color: "#475569" }}>Run your first Mirror check to get started</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#EFF6FF", borderBottom: "1px solid #E2E8F0" }}>
                  {["Page", "Type", "Flags", "Date", ""].map((col) => (
                    <th
                      key={col}
                      style={{ padding: "11px 20px", textAlign: "left", fontSize: "12px", fontWeight: 500, color: "#475569" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audits.map((audit, i) => {
                  const flags    = audit.result?.flags ?? [];
                  const critical = flags.filter((f) => f.severity === "Critical").length;
                  const improve  = flags.filter((f) => f.severity === "Improve").length;
                  const polish   = flags.filter((f) => f.severity === "Polish").length;
                  const isLast   = i === audits.length - 1;

                  return (
                    <tr
                      key={audit.id}
                      className="group"
                      style={{ borderBottom: isLast ? "none" : "1px solid #E2E8F0", transition: "background 120ms" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Page */}
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "#0F172A", marginBottom: "3px" }}>
                          {audit.result?.title || audit.url}
                        </p>
                        <a
                          href={audit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "11px", color: "#2563EB", display: "block", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none" }}
                        >
                          {audit.url}
                        </a>
                      </td>

                      {/* Type */}
                      <td style={{ padding: "16px 20px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#2563EB", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "20px", paddingTop: "3px", paddingBottom: "3px", paddingLeft: "10px", paddingRight: "10px", textTransform: "capitalize", display: "inline-flex", alignItems: "center", height: "26px" }}>
                          {PAGE_TYPE_LABEL[audit.page_type] ?? "Other"}
                        </span>
                      </td>

                      {/* Flags */}
                      <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {critical > 0 && (
                            <span style={{ fontSize: "12px", fontWeight: 500, background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: "20px", padding: "3px 10px", whiteSpace: "nowrap", textTransform: "capitalize", display: "inline-flex", alignItems: "center", height: "26px" }}>
                              {critical} critical
                            </span>
                          )}
                          {improve > 0 && (
                            <span style={{ fontSize: "12px", fontWeight: 500, background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", borderRadius: "20px", padding: "3px 10px", whiteSpace: "nowrap", textTransform: "capitalize", display: "inline-flex", alignItems: "center", height: "26px" }}>
                              {improve} improve
                            </span>
                          )}
                          {polish > 0 && (
                            <span style={{ fontSize: "12px", fontWeight: 500, background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "3px 10px", whiteSpace: "nowrap", textTransform: "capitalize", display: "inline-flex", alignItems: "center", height: "26px" }}>
                              {polish} polish
                            </span>
                          )}
                          {critical === 0 && improve === 0 && polish === 0 && (
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "16px 20px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: "12px", color: "#475569" }}>{formatDate(audit.created_at)}</span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "16px 20px", verticalAlign: "middle", textAlign: "right", whiteSpace: "nowrap" }}>
                        <Link
                          href={`/mirror?id=${audit.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ fontSize: "12px", fontWeight: 500, color: "#2563EB" }}
                        >
                          View in Mirror →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
