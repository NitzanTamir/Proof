const FIRECRAWL_API = "https://api.firecrawl.dev/v1/scrape";

// Truncate content to prevent exceeding Claude's token budget on very large pages
const MAX_CONTENT_LENGTH = 50_000;

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
  };
  error?: string;
}

export async function scrapeUrl(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is not set");
  }

  const response = await fetch(FIRECRAWL_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url, formats: ["markdown"] }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Firecrawl request failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as FirecrawlResponse;

  if (!json.success) {
    throw new Error(`Firecrawl error: ${json.error ?? "unknown"}`);
  }

  const markdown = json.data?.markdown;
  if (!markdown) {
    throw new Error(`No content scraped from ${url}`);
  }

  return markdown.length > MAX_CONTENT_LENGTH
    ? markdown.slice(0, MAX_CONTENT_LENGTH)
    : markdown;
}
