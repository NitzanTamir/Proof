export type PageType = "case_study" | "homepage" | "about" | "other";

export type FlagSeverity = "Critical" | "Improve" | "Polish";

export interface AuditFlag {
  dimension: string;
  type: string;
  severity: FlagSeverity;
  title: string;
  explanation: string;
  fix: string;
  time_estimate_minutes: number;
}

export interface BiggestOpportunity {
  title: string;
  explanation: string;
  time_estimate_minutes: number;
}

export type AuditSummary = string | { headline: string; body: string };

export interface AuditStrength {
  label: string;
  note: string;
}

export interface AuditResult {
  page_type: PageType;
  title: string;
  summary: AuditSummary;
  strengths?: AuditStrength[];
  flags: AuditFlag[];
  biggest_opportunity: BiggestOpportunity;
}

export interface AuditRow {
  id: string;
  user_id: string;
  url: string;
  page_type: string;
  title: string;
  result: AuditResult;
  created_at: string;
}
