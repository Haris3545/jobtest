export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
}

/**
 * Thin wrapper around the Tavily search API (https://tavily.com).
 * Free tier, no card required — used for company research, interview-prep
 * briefs, and the role-discovery / watchlist features.
 */
export async function tavilySearch(
  query: string,
  opts: { maxResults?: number; days?: number; topic?: "general" | "news" } = {}
): Promise<TavilyResult[]> {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not set. Add it to your environment to use search.");
  }
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: opts.maxResults ?? 6,
      search_depth: "advanced",
      topic: opts.topic ?? "general",
      days: opts.days,
      include_answer: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily search failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return (data.results ?? []) as TavilyResult[];
}
