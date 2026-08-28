"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";

interface AtsResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  advice: string;
}

export default function AtsTab({ job, onUpdated }: { job: Job; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsResult | null>(
    job.atsDetail ? (JSON.parse(job.atsDetail) as AtsResult) : null
  );

  async function score() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/ats-score`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to score CV");
        return;
      }
      setResult(data);
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">ATS keyword match</h3>
        <button
          onClick={score}
          disabled={loading}
          className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-40"
        >
          {loading ? "Scoring…" : "Score CV against this job"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="space-y-3">
          <div className="text-3xl font-semibold">{result.score}%</div>
          <p className="text-sm text-neutral-600">{result.advice}</p>
          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1">Matched keywords</h4>
            <div className="flex flex-wrap gap-1">
              {result.matchedKeywords.map((k) => (
                <span key={k} className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                  {k}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1">Missing keywords</h4>
            <div className="flex flex-wrap gap-1">
              {result.missingKeywords.map((k) => (
                <span key={k} className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
