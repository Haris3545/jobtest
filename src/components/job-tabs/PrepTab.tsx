"use client";

import { useState } from "react";
import type { Job } from "@/lib/types";

export default function PrepTab({ job, onUpdated }: { job: Job; onUpdated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/prep`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate prep brief");
        return;
      }
      onUpdated();
    } catch {
      setError("Failed to generate prep brief — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={generate}
          disabled={loading}
          className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-40"
        >
          {loading ? "Researching…" : job.nextSteps ? "Refresh prep brief" : "Generate prep brief"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!job.nextSteps && !error && !loading && (
        <p className="text-sm text-neutral-500">
          Generates next-step checklist and a company/interview research brief using live web search.
        </p>
      )}

      {job.nextSteps && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-medium mb-2">Next steps</h3>
          <pre className="whitespace-pre-wrap text-sm font-sans">{job.nextSteps}</pre>
        </div>
      )}
      {job.companyBrief && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-medium mb-2">Company & interview research</h3>
          <pre className="whitespace-pre-wrap text-sm font-sans">{job.companyBrief}</pre>
        </div>
      )}
    </div>
  );
}
