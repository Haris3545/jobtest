import { askClaude, askClaudeJSON } from "./anthropic";
import { tavilySearch, TavilyResult } from "./tavily";
import { CvContent } from "./pdf";

export async function tailorCvContent(params: {
  masterCvText: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}): Promise<CvContent> {
  const prompt = `Here is a candidate's master CV (raw extracted text):
---
${params.masterCvText}
---

Here is the job they're applying for:
Title: ${params.jobTitle}
Company: ${params.company}
Description: ${params.jobDescription}

Task: Produce a tailored version of this CV for this specific job. Rules:
- Do NOT invent experience, skills, or achievements that aren't in the master CV.
- You MAY reorder bullet points and sections to put the most relevant items first.
- You MAY reword bullet points for clarity and to naturally include keywords from the job description, but the underlying facts/claims must stay true to the original.
- Keep it concise and ATS-friendly (plain language, avoid unnecessary jargon not in the original).

Return ONLY strict JSON matching this shape, nothing else:
{
  "name": string,
  "contactLine": string (e.g. "email | phone | location | linkedin"),
  "summary": string (2-3 sentences, optional but recommended),
  "sections": [ { "heading": string, "bullets": string[] } ]
}`;
  return askClaudeJSON<CvContent>({ prompt, maxTokens: 3000 });
}

export async function generateCoverLetter(params: {
  masterCvText: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}): Promise<string> {
  const prompt = `Candidate's CV (raw text):
---
${params.masterCvText}
---

Job applying for: ${params.jobTitle} at ${params.company}
Job description: ${params.jobDescription}

Write a concise, specific, non-generic cover letter (max ~350 words) for this candidate applying to this role. Base it only on real experience present in the CV — do not invent anything. Address why this candidate is a good fit for this specific role and company. Return plain text only, no markdown, ready to drop into a letter template.`;
  return askClaude({ prompt, maxTokens: 1200 });
}

export interface AtsResult {
  score: number; // 0-100
  matchedKeywords: string[];
  missingKeywords: string[];
  advice: string;
}

export async function scoreAts(params: {
  cvText: string;
  jobDescription: string;
}): Promise<AtsResult> {
  const prompt = `CV text:
---
${params.cvText}
---
Job description:
---
${params.jobDescription}
---
Estimate how well this CV would score against an ATS (applicant tracking system) keyword match for this job description. Return ONLY strict JSON:
{
  "score": number (0-100),
  "matchedKeywords": string[],
  "missingKeywords": string[] (important job-description keywords/skills the CV is missing or under-represents),
  "advice": string (1-3 sentences of concrete, actionable advice)
}`;
  return askClaudeJSON<AtsResult>({ prompt, maxTokens: 1000 });
}

export interface PrepBriefResult {
  nextSteps: string; // markdown checklist
  companyBrief: string; // markdown
}

export async function buildPrepBrief(params: {
  jobTitle: string;
  company: string;
  jobDescription: string;
  status: string;
}): Promise<PrepBriefResult> {
  let researchNotes = "";
  try {
    const queries = [
      `${params.company} interview process ${params.jobTitle}`,
      `${params.company} recent news 2026`,
      `${params.company} culture reviews Glassdoor`,
    ];
    const results: TavilyResult[] = (
      await Promise.all(queries.map((q) => tavilySearch(q, { maxResults: 4 })))
    ).flat();
    researchNotes = results
      .map((r) => `- ${r.title} (${r.url}): ${r.content.slice(0, 400)}`)
      .join("\n");
  } catch {
    researchNotes = "(Web search unavailable — set TAVILY_API_KEY to enable live research.)";
  }

  const prompt = `Job: ${params.jobTitle} at ${params.company}
Current application status: ${params.status}
Job description: ${params.jobDescription}

Raw web research snippets (may be noisy, use judgement, cite company/source names not raw URLs where natural):
${researchNotes}

Produce two things as strict JSON:
1. "nextSteps": a markdown checklist of the concrete next steps for THIS application given its current status (e.g. if status is SAVED: tailor CV, write cover letter, apply before deadline; if INTERVIEW: prep steps specific to likely interview format for this company/role).
2. "companyBrief": a markdown briefing (headings + bullets) covering: what the company does, recent news/developments, culture/interview process if known, and 3-5 likely interview topics or questions for this specific role. Be honest if information is limited.

Return ONLY: { "nextSteps": string, "companyBrief": string }`;
  return askClaudeJSON<PrepBriefResult>({ prompt, maxTokens: 2500 });
}

export interface DiscoveredRole {
  title: string;
  company: string;
  url: string;
  blurb: string;
  likelyOpen: boolean;
  source: string;
}

export async function discoverRoles(params: {
  roleQuery: string;
  targetStartYear?: number;
  region?: string;
}): Promise<DiscoveredRole[]> {
  const yearPart = params.targetStartYear ? `${params.targetStartYear} start` : "";
  const regionPart = params.region ?? "UK";
  const queries = [
    `${params.roleQuery} graduate scheme ${yearPart} ${regionPart} apply`,
    `${params.roleQuery} graduate programme ${yearPart} ${regionPart}`,
    `${params.roleQuery} entry level graduate jobs ${yearPart} ${regionPart}`,
  ];
  const results: TavilyResult[] = (
    await Promise.all(queries.map((q) => tavilySearch(q, { maxResults: 8 })))
  ).flat();

  const dedup = new Map<string, TavilyResult>();
  for (const r of results) dedup.set(r.url, r);

  const digest = Array.from(dedup.values())
    .slice(0, 24)
    .map((r) => `URL: ${r.url}\nTitle: ${r.title}\nSnippet: ${r.content.slice(0, 300)}`)
    .join("\n---\n");

  const prompt = `Raw search results for graduate/entry-level roles matching "${params.roleQuery}"${
    params.targetStartYear ? ` targeting a ${params.targetStartYear} start` : ""
  } in ${regionPart}:
---
${digest}
---
From these, extract distinct actual job/graduate-scheme postings or programmes (ignore generic listicles, job-board search pages, or irrelevant results). For roles adjacent to "${params.roleQuery}" that are still a good match, include them too. For each, indicate whether it appears currently open for applications vs. not yet open/expected later.

Return ONLY strict JSON: an array of
{ "title": string, "company": string, "url": string, "blurb": string (1-2 sentences: what it is + why relevant), "likelyOpen": boolean, "source": string (site name) }
Return at most 15 items, best matches first.`;
  return askClaudeJSON<DiscoveredRole[]>({ prompt, maxTokens: 3000 });
}
