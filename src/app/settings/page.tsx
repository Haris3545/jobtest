"use client";

import { useEffect, useState } from "react";

interface Master {
  id: string;
  fileName: string;
  uploadedAt: string;
  hasText: boolean;
}

export default function SettingsPage() {
  const [master, setMaster] = useState<Master | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/cv/master")
      .then((r) => r.json())
      .then(setMaster);
  }
  useEffect(load, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/cv/master", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      load();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="glass-card p-5 space-y-3">
        <h3 className="font-medium">Master CV</h3>
        <p className="text-sm text-neutral-500">
          Upload your CV as a PDF once. It&apos;s used as the source of truth for every tailored CV and
          cover letter — nothing is invented beyond what&apos;s in here.
        </p>
        {master ? (
          <div className="text-sm">
            <p>
              ✅ Uploaded {new Date(master.uploadedAt).toLocaleString()}
              {!master.hasText && " (warning: no extractable text found — is this a scanned image PDF?)"}
            </p>
            <a href="/api/cv/master/download" className="text-blue-600 hover:underline text-xs">
              Download current master CV
            </a>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No master CV uploaded yet.</p>
        )}
        <input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} />
        {uploading && <p className="text-xs text-neutral-400">Uploading…</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="glass-card p-5 space-y-2 text-sm text-neutral-600">
        <h3 className="font-medium text-neutral-900">Browser deadline reminders</h3>
        <p>
          When jobs are closing within 14 days, a banner appears and (if you allow notifications) a
          browser push fires for anything due within 3 days. Grant notification permission when
          prompted to enable this.
        </p>
      </div>
    </div>
  );
}
