import * as cheerio from "cheerio";

export interface ScrapedJob {
  title: string | null;
  company: string | null;
  location: string | null;
  description: string | null;
  salary: string | null;
  openDate: string | null; // ISO date string
  closingDate: string | null; // ISO date string
  source: string;
  ok: boolean;
  error?: string;
}

function detectSource(url: string): string {
  const host = new URL(url).hostname;
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("indeed.com")) return "indeed";
  if (host.includes("brightnetwork.co.uk")) return "brightnetwork";
  return "company";
}

function toISO(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function textOrNull(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

/**
 * Parses schema.org JobPosting JSON-LD, which most ATSs and job boards
 * (including Indeed and many company career sites) embed for SEO. This is
 * far more reliable than scraping visible HTML, which changes often and is
 * frequently blocked on LinkedIn.
 */
function parseJsonLd($: cheerio.CheerioAPI): Partial<ScrapedJob> | null {
  const scripts = $('script[type="application/ld+json"]');
  for (const el of scripts.toArray()) {
    try {
      const parsed = JSON.parse($(el).text());
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of candidates) {
        const graph = node["@graph"] ? node["@graph"] : [node];
        for (const item of graph) {
          if (item["@type"] === "JobPosting" || (Array.isArray(item["@type"]) && item["@type"].includes("JobPosting"))) {
            const org = item.hiringOrganization;
            const loc = item.jobLocation;
            const locStr = Array.isArray(loc) ? loc[0] : loc;
            const address = locStr?.address;
            const locationParts = [address?.addressLocality, address?.addressRegion, address?.addressCountry].filter(Boolean);
            const salaryObj = item.baseSalary?.value;
            let salary: string | null = null;
            if (salaryObj) {
              const min = salaryObj.minValue;
              const max = salaryObj.maxValue;
              const currency = item.baseSalary?.currency ?? "";
              if (min && max) salary = `${currency} ${min}-${max} ${salaryObj.unitText ?? ""}`.trim();
              else if (salaryObj.value) salary = `${currency} ${salaryObj.value}`.trim();
            }
            return {
              title: textOrNull(item.title),
              company: textOrNull(org?.name),
              location: locationParts.length ? locationParts.join(", ") : null,
              description: textOrNull(item.description)?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? null,
              salary,
              openDate: toISO(item.datePosted),
              closingDate: toISO(item.validThrough),
            };
          }
        }
      }
    } catch {
      // ignore malformed JSON-LD blocks and keep scanning
    }
  }
  return null;
}

function parseMetaFallback($: cheerio.CheerioAPI): Partial<ScrapedJob> {
  const metaTitle =
    $('meta[property="og:title"]').attr("content") ?? $("title").text() ?? null;
  const metaDesc =
    $('meta[property="og:description"]').attr("content") ??
    $('meta[name="description"]').attr("content") ??
    null;
  return {
    title: textOrNull(metaTitle),
    description: textOrNull(metaDesc),
    company: null,
    location: null,
    salary: null,
    openDate: null,
    closingDate: null,
  };
}

export async function scrapeJobUrl(url: string): Promise<ScrapedJob> {
  const source = detectSource(url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return {
        title: null,
        company: null,
        location: null,
        description: null,
        salary: null,
        openDate: null,
        closingDate: null,
        source,
        ok: false,
        error: `Fetch failed with status ${res.status}. The site may be blocking automated requests — enter the details manually.`,
      };
    }
    const html = await res.text();
    const $ = cheerio.load(html);
    const fromJsonLd = parseJsonLd($);
    const fromMeta = parseMetaFallback($);
    const merged = { ...fromMeta, ...(fromJsonLd ?? {}) };
    return {
      title: merged.title ?? null,
      company: merged.company ?? null,
      location: merged.location ?? null,
      description: merged.description ?? null,
      salary: merged.salary ?? null,
      openDate: merged.openDate ?? null,
      closingDate: merged.closingDate ?? null,
      source,
      ok: true,
    };
  } catch (err) {
    return {
      title: null,
      company: null,
      location: null,
      description: null,
      salary: null,
      openDate: null,
      closingDate: null,
      source,
      ok: false,
      error:
        err instanceof Error
          ? `${err.message}. The site may be blocking automated requests — enter the details manually.`
          : "Unknown scraping error — enter the details manually.",
    };
  }
}
