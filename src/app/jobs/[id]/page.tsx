"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { Job, JobStatus, STATUS_LABELS } from "@/lib/types";
import CvTab from "@/components/job-tabs/CvTab";
import CoverLetterTab from "@/components/job-tabs/CoverLetterTab";
import PrepTab from "@/components/job-tabs/PrepTab";
import AtsTab from "@/components/job-tabs/AtsTab";

const STATUS_OPTIONS: JobStatus[] = [
  "DISCOVERED",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

function yearBadge(label: string, iso: string | null) {
  if (!iso) return null;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-600">
      {label} {new Date(iso).getFullYear()}
    </span>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [rescanNote, setRescanNote] = useState<string | null>(null);

  function load() {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then(setJob);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  async function rescan() {
    setRescanning(true);
    setRescanNote(null);
    try {
      const res = await fetch(`/api/jobs/${id}/rescan`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRescanNote(data.error ?? "Recheck failed");
        return;
      }
      if (!data.ok) {
        setRescanNote(data.error ?? "Could not re-fetch the listing page.");
      } else {
        const changes = Object.entries(data.changed as Record<string, boolean>)
          .filter(([, changed]) => changed)
          .map(([field]) => field);
        setRescanNote(
          changes.length
            ? `Changes detected on the listing: ${changes.join(", ")}. Review the Details section and update if needed.`
            : "No changes detected — the listing still matches what you saved."
        );
      }
      load();
    } catch {
      setRescanNote("Recheck failed — check your connection and try again.");
    } finally {
      setRescanning(false);
    }
  }

  if (!job) return <p className="text-sm text-neutral-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
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
        <button onClick={deleteJob} className="text-xs text-red-600 hover:underline shrink-0">
          Delete
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="border rounded-md px-2 py-1 text-sm bg-white"
          value={job.status}
          onChange={(e) => updateField("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {yearBadge("Opens", job.openDate)}
        {yearBadge("Closes", job.closingDate)}
        {job.atsScore != null && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-600">
            ATS {job.atsScore}%
          </span>
        )}
        <span className="text-xs text-neutral-400 ml-auto">
          {job.lastScannedAt
            ? `Listing last checked ${new Date(job.lastScannedAt).toLocaleDateString()}`
            : "Listing not re-checked yet"}
        </span>
        <button
          onClick={rescan}
          disabled={rescanning}
          className="px-2.5 py-1 text-xs rounded-md border disabled:opacity-40"
        >
          {rescanning ? "Checking…" : "Recheck listing"}
        </button>
        {saving && <span className="text-xs text-neutral-400">Saving…</span>}
      </div>
      {rescanNote && <p className="text-xs text-neutral-500">{rescanNote}</p>}

      <section className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-700">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Salary</label>
            <input
              className="border rounded-md px-3 py-2 text-sm w-full"
              defaultValue={job.salary ?? ""}
              onBlur={(e) => updateField("salary", e.target.value)}
            />
          </div>
          <div />
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
            className="border rounded-md px-3 py-2 text-sm w-full h-32"
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
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">Tailored CV</h2>
        <CvTab jobId={id} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">Cover Letter</h2>
        <CoverLetterTab jobId={id} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">ATS Score</h2>
        <AtsTab job={job} onUpdated={load} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-700 mb-2">Prep &amp; Research</h2>
        <PrepTab job={job} onUpdated={load} />
      </section>
    </div>
  );
}
