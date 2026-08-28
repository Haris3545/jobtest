"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { Job, JobStatus, STATUS_LABELS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import CvTab from "@/components/job-tabs/CvTab";
import CoverLetterTab from "@/components/job-tabs/CoverLetterTab";
import PrepTab from "@/components/job-tabs/PrepTab";
import AtsTab from "@/components/job-tabs/AtsTab";

const TABS = ["Overview", "Tailored CV", "Cover Letter", "Prep & Research", "ATS Score"] as const;
type Tab = (typeof TABS)[number];

const STATUS_OPTIONS: JobStatus[] = [
  "DISCOVERED",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then(setJob);
  }
  useEffect(load, [id]);

  async function updateField(field: string, value: unknown) {
    if (!job) return;
    setJob({ ...job, [field]: value } as Job);
    setSaving(true);
    try {
      await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteJob() {
    if (!confirm("Delete this job and all its tailored CVs / cover letters?")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (!job) return <p className="text-sm text-neutral-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{job.title}</h1>
          <p className="text-neutral-500">
            {job.company} {job.location ? `· ${job.location}` : ""}
          </p>
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline break-all"
          >
            {job.url}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <button onClick={deleteJob} className="text-xs text-red-600 hover:underline">
            Delete
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
              <select
                className="border rounded-md px-3 py-2 text-sm w-full"
                value={job.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Salary</label>
              <input
                className="border rounded-md px-3 py-2 text-sm w-full"
                defaultValue={job.salary ?? ""}
                onBlur={(e) => updateField("salary", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Open date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                defaultValue={job.openDate?.slice(0, 10) ?? ""}
                onBlur={(e) => updateField("openDate", e.target.value || null)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Closing date</label>
              <input
                type="date"
                className="border rounded-md px-3 py-2 text-sm w-full"
                defaultValue={job.closingDate?.slice(0, 10) ?? ""}
                onBlur={(e) => updateField("closingDate", e.target.value || null)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Description</label>
            <textarea
              className="border rounded-md px-3 py-2 text-sm w-full h-40"
              defaultValue={job.description ?? ""}
              onBlur={(e) => updateField("description", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Notes</label>
            <textarea
              className="border rounded-md px-3 py-2 text-sm w-full h-20"
              defaultValue={job.notes ?? ""}
              onBlur={(e) => updateField("notes", e.target.value)}
            />
          </div>
          {saving && <p className="text-xs text-neutral-400">Saving…</p>}
        </div>
      )}

      {tab === "Tailored CV" && <CvTab jobId={id} />}
      {tab === "Cover Letter" && <CoverLetterTab jobId={id} />}
      {tab === "Prep & Research" && <PrepTab job={job} onUpdated={load} />}
      {tab === "ATS Score" && <AtsTab job={job} onUpdated={load} />}
    </div>
  );
}
