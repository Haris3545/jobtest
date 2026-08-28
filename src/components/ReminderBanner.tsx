"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DueJob {
  id: string;
  title: string;
  company: string;
  closingDate: string;
  daysLeft: number;
}

export default function ReminderBanner() {
  const [jobs, setJobs] = useState<DueJob[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((data: DueJob[]) => {
        setJobs(data);
        if (data.length && "Notification" in window) {
          if (Notification.permission === "default") {
            Notification.requestPermission();
          }
          if (Notification.permission === "granted") {
            const urgent = data.filter((j) => j.daysLeft <= 3);
            const seenKey = "notifiedJobIds";
            const seen: string[] = JSON.parse(sessionStorage.getItem(seenKey) ?? "[]");
            const toNotify = urgent.filter((j) => !seen.includes(j.id));
            for (const j of toNotify) {
              new Notification(`Closing in ${j.daysLeft}d: ${j.title}`, {
                body: `${j.company} — deadline ${new Date(j.closingDate).toLocaleDateString()}`,
              });
            }
            if (toNotify.length) {
              sessionStorage.setItem(seenKey, JSON.stringify([...seen, ...toNotify.map((j) => j.id)]));
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!jobs.length || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="font-medium">⏰ Deadlines coming up:</span>
        {jobs.map((j) => (
          <Link
            key={j.id}
            href={`/jobs/${j.id}`}
            className="underline decoration-dotted hover:decoration-solid"
          >
            {j.title} @ {j.company} ({j.daysLeft}d)
          </Link>
        ))}
        <button onClick={() => setDismissed(true)} className="ml-auto text-amber-700 hover:text-amber-900">
          Dismiss
        </button>
      </div>
    </div>
  );
}
