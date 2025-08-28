export interface Job {
  job_id: string;
  backend: string;
  shots: number;
  status: 'running' | 'queued' | 'completed' | 'failed';
  creation_time: string;
  completion_time?: string;
  run_time?: string;
}

export interface JobStats {
  queued: number;
  running: number;
  completed: number;
  failed: number;
}