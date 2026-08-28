"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Candidate {
  title: string;
  company: string;
  url: string;
  blurb: string;
  likelyOpen: boolean;
  source: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [roleQuery, setRoleQuery] = useState("");
  const [targetStartYear, setTargetStartYear] = useState("2027");
  const [region, setRegion] = useState("UK");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Candidate[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());

  async function search() {
    if (!roleQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleQuery, targetStartYear, region }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        return;
      }
      setResults(data);
    } catch {
      setError("Search failed — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function addToTracker(c: Candidate) {
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: c.url,
        title: c.title,
        company: c.company,
        description: c.blurb,
        source: "discovery",
        status: c.likelyOpen ? "SAVED" : "DISCOVERED",
      }),
    });
    setAdded((prev) => new Set(prev).add(c.url));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Discover roles</h1>
        <p className="text-sm text-neutral-500">
          Search the web for graduate/entry-level roles matching a job type, then tick which ones to
          add to your tracker.
        </p>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-neutral-500 mb-1">Job type / role</label>
          <input
            className="border rounded-md px-3 py-2 text-sm w-full"
            placeholder="e.g. software engineering, corporate law, investment banking"
            value={roleQuery}
            onChange={(e) => setRoleQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Target start year</label>
          <input
            className="border rounded-md px-3 py-2 text-sm w-28"
            value={targetStartYear}
            onChange={(e) => setTargetStartYear(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Region</label>
          <input
            className="border rounded-md px-3 py-2 text-sm w-28"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-40"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3">
        {results.map((c) => (
          <div key={c.url} className="glass-card p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{c.title}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    c.likelyOpen ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {c.likelyOpen ? "Likely open" : "Not yet open"}
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                {c.company} · {c.source}
              </p>
              <p className="text-sm mt-1">{c.blurb}</p>
              <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                {c.url}
              </a>
            </div>
            <button
              onClick={() => addToTracker(c)}
              disabled={added.has(c.url)}
              className="shrink-0 px-3 py-1.5 text-sm rounded-md border disabled:opacity-40"
            >
              {added.has(c.url) ? "✓ Added" : "+ Add"}
            </button>
          </div>
        ))}
      </div>

      {added.size > 0 && (
        <button onClick={() => router.push("/")} className="text-sm text-blue-600 hover:underline">
          View added jobs in the dashboard →
        </button>
      )}
    </div>
  );
}
