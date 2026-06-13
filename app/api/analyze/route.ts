import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeUrl } from "@/lib/firecrawl";
import { detectPageType } from "@/lib/detect-page-type";
import { analyzePortfolioPage } from "@/lib/analyze";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { url } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Read designer context from saved profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("designer_type, seniority")
    .eq("id", user.id)
    .single();

  const designerType = profile?.designer_type ?? "Product / UX";
  const seniority    = profile?.seniority    ?? "Mid-level";

  try {
    // 1. Scrape the page
    const markdown = await scrapeUrl(url);

    // 2. Detect page type from URL + content
    const pageType = detectPageType(url, markdown);

    // 3. Analyze with Claude
    const result = await analyzePortfolioPage(markdown, pageType, designerType, seniority);

    // 4. Save to Supabase
    const { data: audit, error: dbError } = await supabase
      .from("audits")
      .insert({
        user_id: user.id,
        url,
        page_type: result.page_type,
        title: result.title,
        result,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to save audit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ audit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Analyze error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
