import { Job } from './loadJobs';

export interface JobDurations {
  job_id: string;
  backend: string;
  backend_type?: string | null;
  status: Job['status'];
  queueSec: number; // estimated
  execSec: number;  // from execution_time when available
}

export function computeDurations(jobs: Job[]): JobDurations[] {
  return jobs
    .filter(j => j.creation_time)
    .map(j => {
      const startMs = new Date(j.creation_time).getTime();
      const endMs = j.end_time ? new Date(j.end_time).getTime() : NaN;
      const execMs = j.execution_time ? parseInt(j.execution_time, 10) : NaN;

      const execSec = Number.isFinite(execMs) && execMs >= 0 ? execMs / 1000 : (
        Number.isFinite(endMs) ? Math.max(0, (endMs - startMs) / 1000) : 0
      );

      const turnaroundSec = Number.isFinite(endMs) ? Math.max(0, (endMs - startMs) / 1000) : execSec;
      const queueSec = Math.max(0, turnaroundSec - execSec);

      return {
        job_id: j.job_id,
        backend: j.backend || 'Unknown',
        backend_type: j.backend_type,
        status: j.status,
        queueSec,
        execSec,
      };
    });
}

export function estimateWaitTimesByBackend(jobs: Job[]): Record<string, { mean: number; p90: number; count: number }> {
  const durations = computeDurations(jobs);
  const byBackend: Record<string, number[]> = {};
  for (const d of durations) {
    if (!byBackend[d.backend]) byBackend[d.backend] = [];
    byBackend[d.backend].push(d.queueSec);
  }
  const result: Record<string, { mean: number; p90: number; count: number }> = {};
  for (const [backend, arr] of Object.entries(byBackend)) {
    if (!arr.length) continue;
    const sorted = [...arr].sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
    result[backend] = { mean, p90, count: arr.length };
  }
  return result;
}

export function recommendBackends(jobs: Job[], weights = { success: 0.5, queue: 0.3, exec: 0.2 }) {
  const durations = computeDurations(jobs);
  const backends = Array.from(new Set(jobs.map(j => j.backend || 'Unknown')));

  const stats = backends.map(b => {
    const subset = jobs.filter(j => (j.backend || 'Unknown') === b);
    const n = subset.length || 1;
    const completed = subset.filter(j => j.status === 'COMPLETED').length;
    const success = completed / n; // higher is better

    const durSubset = durations.filter(d => d.backend === b);
    const avgQueue = durSubset.length ? durSubset.reduce((a, d) => a + d.queueSec, 0) / durSubset.length : Infinity; // lower better
    const avgExec = durSubset.length ? durSubset.reduce((a, d) => a + d.execSec, 0) / durSubset.length : Infinity; // lower better

    return { backend: b, success, avgQueue, avgExec, count: n };
  });

  // Normalize
  const maxSuccess = Math.max(...stats.map(s => s.success), 1);
  const minQueue = Math.min(...stats.map(s => s.avgQueue).filter(Number.isFinite), 0) as number;
  const maxQueue = Math.max(...stats.map(s => s.avgQueue).filter(Number.isFinite), 1) as number;
  const minExec = Math.min(...stats.map(s => s.avgExec).filter(Number.isFinite), 0) as number;
  const maxExec = Math.max(...stats.map(s => s.avgExec).filter(Number.isFinite), 1) as number;

  const scored = stats.map(s => {
    const successN = maxSuccess ? s.success / maxSuccess : 0; // 0..1
    const queueN = Number.isFinite(s.avgQueue) && maxQueue !== minQueue
      ? 1 - (s.avgQueue - minQueue) / (maxQueue - minQueue)
      : 0; // invert (lower better)
    const execN = Number.isFinite(s.avgExec) && maxExec !== minExec
      ? 1 - (s.avgExec - minExec) / (maxExec - minExec)
      : 0; // invert (lower better)

    const score = weights.success * successN + weights.queue * queueN + weights.exec * execN;
    const reasons = [
      `Success ${(s.success * 100).toFixed(0)}%`,
      `Avg queue ${Math.round(s.avgQueue)}s`,
      `Avg exec ${Math.round(s.avgExec)}s`,
    ];
    return { ...s, score, reasons };
  })
  .sort((a, b) => b.score - a.score);

  return scored;
}

export function detectAnomalies(jobs: Job[]) {
  const durations = computeDurations(jobs);
  const byBackend: Record<string, number[]> = {};
  durations.forEach(d => {
    if (!byBackend[d.backend]) byBackend[d.backend] = [];
    byBackend[d.backend].push(d.queueSec);
  });

  const anomalies: Array<{ job_id: string; type: 'stuck' | 'failure_cluster'; details: string }> = [];

  // Z-score on queue time per backend
  for (const backend of Object.keys(byBackend)) {
    const arr = byBackend[backend];
    if (arr.length < 8) continue; // need enough data
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / arr.length;
    const std = Math.sqrt(variance) || 1;
    durations
      .filter(d => d.backend === backend)
      .forEach(d => {
        const z = (d.queueSec - mean) / std;
        if (z > 2.5) {
          anomalies.push({ job_id: d.job_id, type: 'stuck', details: `${backend}: queue ${Math.round(d.queueSec)}s (z=${z.toFixed(2)})` });
        }
      });
  }

  // Failure clusters per backend (last 20)
  const backends = Array.from(new Set(jobs.map(j => j.backend || 'Unknown')));
  for (const b of backends) {
    const recent = jobs.filter(j => (j.backend || 'Unknown') === b).slice(-20);
    if (recent.length >= 10) {
      const failRate = recent.filter(j => j.status === 'FAILED').length / recent.length;
      if (failRate >= 0.5) {
        anomalies.push({ job_id: recent[recent.length - 1].job_id, type: 'failure_cluster', details: `${b}: recent failure rate ${(failRate * 100).toFixed(0)}%` });
      }
    }
  }

  return anomalies;
}
