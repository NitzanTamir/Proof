import type { PageType } from "./types";

const CASE_STUDY_PATH_PATTERNS = [
  "/work/",
  "/case-study/",
  "/case_study/",
  "/project/",
  "/projects/",
  "/portfolio/",
  "/study/",
];

const ABOUT_PATH_PATTERNS = ["/about", "/bio", "/story", "/me", "/who-i-am"];

// Minimum number of content signals to classify as case study
const CASE_STUDY_SIGNAL_THRESHOLD = 3;

const CASE_STUDY_CONTENT_SIGNALS = [
  "problem statement",
  "user research",
  "design process",
  "final design",
  "key findings",
  "research findings",
  "prototype",
  "iterations",
  "impact",
  "outcomes",
  "metrics",
  "before and after",
  "how might we",
  "pain points",
  "job to be done",
];

export function detectPageType(url: string, content: string): PageType {
  let pathname = "";
  try {
    pathname = new URL(url).pathname.toLowerCase();
  } catch {
    // If URL parsing fails, fall through to content-based detection
  }

  // Exact homepage
  if (pathname === "/" || pathname === "" || pathname === "/index.html") {
    return "homepage";
  }

  // About page
  if (ABOUT_PATH_PATTERNS.some((p) => pathname.startsWith(p))) {
    return "about";
  }

  // Case study via URL path
  if (CASE_STUDY_PATH_PATTERNS.some((p) => pathname.includes(p))) {
    return "case_study";
  }

  // Content-based fallback: count case study signals
  const lower = content.toLowerCase();
  const matchCount = CASE_STUDY_CONTENT_SIGNALS.filter((signal) =>
    lower.includes(signal)
  ).length;

  if (matchCount >= CASE_STUDY_SIGNAL_THRESHOLD) {
    return "case_study";
  }

  // Short content with no clear signals is likely a homepage or landing page
  if (content.length < 2000 && !pathname.includes("/")) {
    return "homepage";
  }

  return "other";
}
