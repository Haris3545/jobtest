"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

interface FormState {
  url: string;
  title: string;
  company: string;
  location: string;
  source: string;
  description: string;
  salary: string;
  openDate: string;
  closingDate: string;
}

const empty: FormState = {
  url: "",
  title: "",
  company: "",
  location: "",
  source: "other",
  description: "",
  salary: "",
  openDate: "",
  closingDate: "",
};

export default function AddJobModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(empty);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function scan() {
    if (!form.url) return;
    setScanning(true);
    setScanMsg(null);
    try {
      const res = await fetch("/api/jobs/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url }),
      });
      const data = await res.json();
      if (!data.ok) {
        setScanMsg(data.error ?? "Could not auto-fill — please enter details manually.");
      } else {
        setScanMsg("Auto-filled from page — please double check before saving.");
      }
      setForm((f) => ({
        ...f,
        title: data.title ?? f.title,
        company: data.company ?? f.company,
        location: data.location ?? f.location,
        source: data.source ?? f.source,
        description: data.description ?? f.description,
        salary: data.salary ?? f.salary,
        openDate: data.openDate ? data.openDate.slice(0, 10) : f.openDate,
        closingDate: data.closingDate ? data.closingDate.slice(0, 10) : f.closingDate,
      }));
    } catch {
      setScanMsg("Scan failed — please enter details manually.");
    } finally {
      setScanning(false);
    }
  }

  async function save() {
    if (!form.title || !form.company || !form.url) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save job");
        return;
      }
      onCreated();
      onClose();
    } catch {
      setSaveError("Failed to save job — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-16 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 space-y-3 mb-16">
        <h2 className="text-lg font-semibold">Add a job</h2>

        <label className="block text-sm font-medium text-neutral-600">Job listing URL</label>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-2 text-sm"
            placeholder="https://www.linkedin.com/jobs/view/..."
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <button
            onClick={scan}
            disabled={scanning || !form.url}
            className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-40"
          >
            {scanning ? "Scanning…" : "Scan"}
          </button>
        </div>
        {scanMsg && <p className="text-xs text-neutral-500">{scanMsg}</p>}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Field label="Salary" value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} />
          <Field
            label="Open date"
            type="date"
            value={form.openDate}
            onChange={(v) => setForm({ ...form, openDate: v })}
          />
          <Field
            label="Closing date"
            type="date"
            value={form.closingDate}
            onChange={(v) => setForm({ ...form, closingDate: v })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-600 mb-1">Description</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm h-28"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-md border">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.title || !form.company}
            className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save job"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-600 mb-1">{label}</label>
      <input
        type={type}
        className="w-full border rounded-md px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
