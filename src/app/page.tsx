"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Job, JobStatus, STATUS_LABELS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import AddJobModal from "@/components/AddJobModal";

const STATUS_FILTERS: (JobStatus | "ALL")[] = [
  "ALL",
  "DISCOVERED",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JobStatus | "ALL">("ALL");
  const [showAdd, setShowAdd] = useState(false);

  function load() {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then(setJobs)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Applications</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white"
        >
          + Add job
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              filter === s ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-600"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_LABELS[s]}
            {s !== "ALL" && ` (${jobs.filter((j) => j.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">
            No jobs yet. Click &ldquo;Add job&rdquo; and paste a listing URL to get started.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Role</th>
                <th className="text-left px-4 py-2 font-medium">Company</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Closes</th>
                <th className="text-left px-4 py-2 font-medium">ATS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.id} className="border-t hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                      {job.title}
                    </Link>
                    {job.location && <div className="text-xs text-neutral-400">{job.location}</div>}
                  </td>
                  <td className="px-4 py-3">{job.company}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3">
                    {job.closingDate ? new Date(job.closingDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">{job.atsScore != null ? `${job.atsScore}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onCreated={load} />}
    </div>
  );
}
