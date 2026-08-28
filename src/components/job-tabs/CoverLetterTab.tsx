"use client";

import { useEffect, useState } from "react";

interface Letter {
  id: string;
  version: number;
  content: string;
  createdAt: string;
}

export default function CoverLetterTab({ jobId }: { jobId: string }) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load(selectId?: string) {
    fetch(`/api/jobs/${jobId}/cover-letter`)
      .then((r) => r.json())
      .then((data: Letter[]) => {
        setLetters(data);
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
      const res = await fetch(`/api/jobs/${jobId}/cover-letter`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate cover letter");
        return;
      }
      load(data.id);
    } finally {
      setGenerating(false);
    }
  }

  const selectedLetter = letters.find((l) => l.id === selected);

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Cover letter versions</h3>
          {letters.length > 0 && (
            <select
              className="border rounded-md px-2 py-1 text-sm"
              value={selected ?? ""}
              onChange={(e) => setSelected(e.target.value)}
            >
              {letters.map((l) => (
                <option key={l.id} value={l.id}>
                  v{l.version} — {new Date(l.createdAt).toLocaleString()}
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
          {generating ? "Writing…" : letters.length ? "Generate new version" : "Generate cover letter"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {selectedLetter && (
        <LetterEditor
          key={selectedLetter.id}
          jobId={jobId}
          letterId={selectedLetter.id}
          initialText={selectedLetter.content}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}

function LetterEditor({
  jobId,
  letterId,
  initialText,
  onSaved,
}: {
  jobId: string;
  letterId: string;
  initialText: string;
  onSaved: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/jobs/${jobId}/cover-letter/${letterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="border rounded-md px-3 py-2 text-sm w-full h-72 font-mono"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <a href={`/api/jobs/${jobId}/cover-letter/${letterId}?download=1`} className="px-3 py-1.5 text-sm rounded-md border">
          Download
        </a>
        <button
          onClick={save}
          disabled={saving}
          className="px-3 py-1.5 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save edits"}
        </button>
      </div>
    </div>
  );
}
