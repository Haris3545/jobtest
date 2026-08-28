"use client";

import { useEffect, useState } from "react";
import type { CvContent } from "@/lib/pdf-render";

interface VersionMeta {
  id: string;
  version: number;
  changeSummary: string | null;
  createdAt: string;
  extractedText: string | null;
}

export default function CvTab({ jobId }: { jobId: string }) {
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load(selectId?: string) {
    fetch(`/api/jobs/${jobId}/cv`)
      .then((r) => r.json())
      .then((data: VersionMeta[]) => {
        setVersions(data);
        setSelected((prev) => selectId ?? prev ?? data[0]?.id ?? null);
      });
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/cv`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate CV");
        return;
      }
      load(data.id);
    } catch {
      setError("Failed to generate CV — check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  const selectedVersion = versions.find((v) => v.id === selected);

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Tailored CV versions</h3>
          {versions.length > 0 && (
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={selected ?? ""}
              onChange={(e) => setSelected(e.target.value)}
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version} — {new Date(v.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="px-3 py-2 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-40"
        >
          {generating ? "Tailoring…" : versions.length ? "Generate new version" : "Generate tailored CV"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!selectedVersion && !error && (
        <p className="text-sm text-neutral-500">
          No tailored CV yet. Upload your master CV under Settings, then click Generate.
        </p>
      )}

      {selectedVersion?.extractedText && (
        <CvEditor
          key={selectedVersion.id}
          jobId={jobId}
          versionId={selectedVersion.id}
          initialContent={JSON.parse(selectedVersion.extractedText) as CvContent}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}

function CvEditor({
  jobId,
  versionId,
  initialContent,
  onSaved,
}: {
  jobId: string;
  versionId: string;
  initialContent: CvContent;
  onSaved: () => void;
}) {
  const [content, setContent] = useState<CvContent>(initialContent);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/jobs/${jobId}/cv/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function updateSection(i: number, patch: Partial<CvContent["sections"][number]>) {
    const sections = [...content.sections];
    sections[i] = { ...sections[i], ...patch };
    setContent({ ...content, sections });
  }

  function updateBullet(sectionIdx: number, bulletIdx: number, value: string) {
    const sections = [...content.sections];
    const bullets = [...sections[sectionIdx].bullets];
    bullets[bulletIdx] = value;
    sections[sectionIdx] = { ...sections[sectionIdx], bullets };
    setContent({ ...content, sections });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <a href={`/api/jobs/${jobId}/cv/${versionId}?download=1`} className="px-3 py-1.5 text-sm rounded-md border">
          Download haris_khan_cv.pdf
        </a>
        <button
          onClick={save}
          disabled={saving}
          className="px-3 py-1.5 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save edits"}
        </button>
      </div>

      <p className="text-xs text-neutral-400">
        Note: this renders a clean, consistent CV template from your tailored content rather than editing
        your original PDF&apos;s exact pixel layout — true in-place editing of arbitrary PDFs isn&apos;t
        reliable when wording changes length. Edit anything below before downloading.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <input
          className="border rounded-md px-3 py-2 text-sm font-medium"
          value={content.name}
          onChange={(e) => setContent({ ...content, name: e.target.value })}
        />
        <input
          className="border rounded-md px-3 py-2 text-sm"
          value={content.contactLine}
          onChange={(e) => setContent({ ...content, contactLine: e.target.value })}
        />
      </div>
      <textarea
        className="border rounded-md px-3 py-2 text-sm w-full h-20"
        value={content.summary ?? ""}
        onChange={(e) => setContent({ ...content, summary: e.target.value })}
      />

      {content.sections.map((section, si) => (
        <div key={si} className="border rounded-md p-3 space-y-2">
          <input
            className="border-b w-full text-sm font-semibold pb-1"
            value={section.heading}
            onChange={(e) => updateSection(si, { heading: e.target.value })}
          />
          {section.bullets.map((b, bi) => (
            <textarea
              key={bi}
              className="border rounded-md px-2 py-1 text-sm w-full"
              value={b}
              onChange={(e) => updateBullet(si, bi, e.target.value)}
            />
          ))}
          <button className="text-xs text-blue-600" onClick={() => updateSection(si, { bullets: [...section.bullets, ""] })}>
            + Add bullet
          </button>
        </div>
      ))}
    </div>
  );
}
