import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from 'recharts';
import { Job } from '../utils/loadJobs';
import { recommendBackends } from '../utils/analytics';

export function BackendRecommendationChart({ jobs }: { jobs: Job[] }) {
  const data = React.useMemo(() => {
    const recs = recommendBackends(jobs);

    // Build backend -> backend_type map directly from Excel rows (first seen wins)
    const backendTypeMap = new Map<string, string | undefined>();
    const counts = new Map<string, number>();
    for (const j of jobs) {
      const raw = typeof j.backend === 'string' ? j.backend : String(j.backend || '').trim();
      const b = raw.trim();
      if (!b) continue;
      if (!backendTypeMap.has(b)) backendTypeMap.set(b, (j.backend_type as any) || undefined);
      counts.set(b, (counts.get(b) || 0) + 1);
    }

    // Pick top 3 by job count (exact backend ids from Excel)
    const top3 = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([b]) => b);

    if (!top3.length) return [] as any[];

    // Map recommendations by backend id
    const byBackend: Record<string, ReturnType<typeof recommendBackends>[number] | undefined> = {};
    for (const r of recs) byBackend[r.backend] = r;

    // Build final data in the same order as top3 and with human-readable labels
    const topRecs = top3
      .map(b => byBackend[b])
      .filter(Boolean) as NonNullable<typeof byBackend[string]>[];

    if (!topRecs.length) return [] as any[];

    // Normalize queue and exec to 0..1, where higher is better
    const qs = topRecs.map(r => r.avgQueue).filter(Number.isFinite) as number[];
    const es = topRecs.map(r => r.avgExec).filter(Number.isFinite) as number[];
    const qMin = qs.length ? Math.min(...qs) : 0;
    const qMax = qs.length ? Math.max(...qs) : 1;
    const eMin = es.length ? Math.min(...es) : 0;
    const eMax = es.length ? Math.max(...es) : 1;

    return topRecs.map(r => {
      const backendId = r.backend; // exact id from Excel
      const bt = backendTypeMap.get(backendId) || 'Unknown';
      const backendLabel = `${backendId} (${bt})`;
      const successPct = Math.max(0, Math.min(1, r.success));
      const queueScore = Number.isFinite(r.avgQueue) && qMax !== qMin ? 1 - (r.avgQueue - qMin) / (qMax - qMin) : 0;
      const execScore = Number.isFinite(r.avgExec) && eMax !== eMin ? 1 - (r.avgExec - eMin) / (eMax - eMin) : 0;
      return {
        backendId,
        backendLabel,
        score: Number(r.score.toFixed(3)),
        success: Number((successPct * 100).toFixed(1)), // %
        queue: Number((queueScore * 100).toFixed(1)),   // % (higher is better)
        exec: Number((execScore * 100).toFixed(1)),     // % (higher is better)
        rawSuccess: r.success,
        rawAvgQueue: r.avgQueue,
        rawAvgExec: r.avgExec,
      };
    });
  }, [jobs]);

  if (!data.length) {
    return <p className="text-xs text-gray-600">Not enough data to compare backends for current filters.</p>;
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="backendLabel" angle={-20} textAnchor="end" interval={0} height={50} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === 'Score') return [Number(value).toFixed(3), name];
              return [`${value}%`, name];
            }}
            labelFormatter={(label: any, payload: any[]) => {
              const p = payload && payload[0] && (payload[0].payload as any);
              if (p) {
                const raw = `raw: success ${(p.rawSuccess * 100).toFixed(1)}% • queue ${Math.round(p.rawAvgQueue)}s • exec ${Math.round(p.rawAvgExec)}s`;
                return `${label}\n${raw}`;
              }
              return String(label);
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="score" name="Score" fill="#60a5fa" radius={[4,4,0,0]} />
          <Bar yAxisId="right" dataKey="success" name="Success %" fill="#34d399" opacity={0.8} />
          <Bar yAxisId="right" dataKey="queue" name="Queue (better=high)" fill="#fbbf24" opacity={0.8} />
          <Bar yAxisId="right" dataKey="exec" name="Exec (better=high)" fill="#f472b6" opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
