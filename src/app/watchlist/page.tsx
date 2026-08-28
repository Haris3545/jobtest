"use client";

import { useEffect, useState } from "react";

interface Finding {
  id: string;
  title: string;
  url: string;
  snippet: string | null;
  status: string;
  foundAt: string;
}

interface WatchTarget {
  id: string;
  label: string;
  roleQuery: string;
  targetStartYear: number | null;
  region: string | null;
  cadenceDays: number;
  active: boolean;
  lastCheckedAt: string | null;
  findings: Finding[];
}

export default function WatchlistPage() {
  const [targets, setTargets] = useState<WatchTarget[]>([]);
  const [checking, setChecking] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: "", roleQuery: "", targetStartYear: "2027", region: "UK" });

  function load() {
    fetch("/api/watch")
      .then((r) => r.json())
      .then(setTargets);
  }
  useEffect(load, []);

  async function addTarget() {
    if (!form.label || !form.roleQuery) return;
    await fetch("/api/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ label: "", roleQuery: "", targetStartYear: "2027", region: "UK" });
    setShowAdd(false);
    load();
  }

  async function checkNow(id: string) {
    setChecking(id);
    try {
      await fetch(`/api/watch/${id}/check`, { method: "POST" });
      load();
    } finally {
      setChecking(null);
    }
  }

  async function markFinding(id: string, status: string) {
    await fetch(`/api/watch/findings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function removeTarget(id: string) {
    if (!confirm("Remove this watch target?")) return;
    await fetch(`/api/watch/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Watchlist</h1>
          <p className="text-sm text-neutral-500">
            Roles not open yet — periodically re-check the web for new info (opening dates, applications
            live, etc). Click &ldquo;Check now&rdquo; anytime, or wire up a scheduled job (see README) for
            automatic checks.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white"
        >
          + Add watch
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Label</label>
            <input
              className="border rounded-md px-3 py-2 text-sm"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Role query</label>
            <input
              className="border rounded-md px-3 py-2 text-sm w-64"
              placeholder="e.g. corporate law training contract"
              value={form.roleQuery}
              onChange={(e) => setForm({ ...form, roleQuery: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Target start year</label>
            <input
              className="border rounded-md px-3 py-2 text-sm w-24"
              value={form.targetStartYear}
              onChange={(e) => setForm({ ...form, targetStartYear: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Region</label>
            <input
              className="border rounded-md px-3 py-2 text-sm w-24"
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
            />
          </div>
          <button onClick={addTarget} className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white">
            Save
          </button>
        </div>
      )}

      <div className="space-y-3">
        {targets.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t.label}</h3>
                <p className="text-xs text-neutral-500">
                  &ldquo;{t.roleQuery}&rdquo; {t.targetStartYear ? `· ${t.targetStartYear} start` : ""}{" "}
                  {t.region ? `· ${t.region}` : ""} · checked every {t.cadenceDays}d
                  {t.lastCheckedAt ? ` · last checked ${new Date(t.lastCheckedAt).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => checkNow(t.id)}
                  disabled={checking === t.id}
                  className="px-3 py-1.5 text-sm rounded-md border disabled:opacity-40"
                >
                  {checking === t.id ? "Checking…" : "Check now"}
                </button>
                <button onClick={() => removeTarget(t.id)} className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            </div>
            {t.findings.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                {t.findings.map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <a href={f.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                        {f.title}
                      </a>{" "}
                      {f.status === "NEW" && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">new</span>
                      )}
                      {f.snippet && <p className="text-neutral-500 text-xs mt-0.5">{f.snippet}</p>}
                    </div>
                    {f.status === "NEW" && (
                      <div className="shrink-0 flex gap-2">
                        <button
                          onClick={() => markFinding(f.id, "SEEN")}
                          className="text-xs text-neutral-500 hover:underline"
                        >
                          Mark seen
                        </button>
                        <button
                          onClick={() => markFinding(f.id, "DISMISSED")}
                          className="text-xs text-neutral-500 hover:underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {targets.length === 0 && (
          <p className="text-sm text-neutral-500">No watch targets yet.</p>
        )}
      </div>
    </div>
  );
}
