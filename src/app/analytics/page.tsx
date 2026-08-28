"use client";

import { useEffect, useState } from "react";

interface Analytics {
  total: number;
  byStatus: Record<string, number>;
  applied: number;
  interviewed: number;
  offers: number;
  rejected: number;
  responseRate: number;
  offerRate: number;
  avgAtsScore: number | null;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm text-neutral-500">Loading…</p>;

  const maxCount = Math.max(1, ...Object.values(data.byStatus));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total tracked" value={data.total} />
        <Stat label="Applied" value={data.applied} />
        <Stat label="Interview rate" value={`${data.responseRate}%`} />
        <Stat label="Offer rate" value={`${data.offerRate}%`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Interviewed" value={data.interviewed} />
        <Stat label="Offers" value={data.offers} />
        <Stat label="Rejected" value={data.rejected} />
        <Stat label="Avg ATS score" value={data.avgAtsScore != null ? `${data.avgAtsScore}%` : "—"} />
      </div>

      <div className="glass-card p-5">
        <h3 className="font-medium mb-3">By status</h3>
        <div className="space-y-2">
          {Object.entries(data.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs w-24 shrink-0 text-neutral-500">{status}</span>
              <div className="flex-1 bg-neutral-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-neutral-900 h-3 rounded-full"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
