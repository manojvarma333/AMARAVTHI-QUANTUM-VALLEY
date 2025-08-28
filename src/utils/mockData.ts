import { Job } from '../types/Job';

const backends = [
  'ibm_quantum_backend_1',
  'ibm_quantum_backend_2', 
  'ibm_quantum_backend_3',
  'ibm_brisbane',
  'ibm_kyoto',
  'ibm_osaka'
];

const statuses: Job['status'][] = ['running', 'queued', 'completed', 'failed'];

function generateRandomJob(index: number): Job {
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const backend = backends[Math.floor(Math.random() * backends.length)];
  const shots = [100, 500, 1000, 2000, 4000, 8192][Math.floor(Math.random() * 6)];
  
  const creationTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  
  let completionTime: Date | undefined;
  let runTime: string | undefined;
  
  if (status === 'completed' || status === 'failed') {
    completionTime = new Date(creationTime.getTime() + Math.random() * 60 * 60 * 1000);
    const duration = Math.floor((completionTime.getTime() - creationTime.getTime()) / 1000);
    runTime = formatDuration(duration);
  } else if (status === 'running') {
    const duration = Math.floor((Date.now() - creationTime.getTime()) / 1000);
    runTime = formatDuration(duration);
  } else {
    runTime = 'N/A';
  }
  
  return {
    job_id: `qjob_${String(index).padStart(4, '0')}_${Math.random().toString(36).substr(2, 8)}`,
    backend,
    shots,
    status,
    creation_time: creationTime.toISOString(),
    completion_time: completionTime?.toISOString(),
    run_time: runTime
  };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function generateMockJobs(count: number = 250): Job[] {
  return Array.from({ length: count }, (_, index) => generateRandomJob(index + 1));
}

export function simulateJobStatusChange(job: Job): Job {
  // Simulate random status changes for demo purposes
  const currentStatuses: Job['status'][] = ['running', 'queued', 'completed', 'failed'];
  const randomStatus = currentStatuses[Math.floor(Math.random() * currentStatuses.length)];
  
  const updatedJob = { ...job, status: randomStatus };
  
  // Update run_time based on new status
  if (randomStatus === 'completed' || randomStatus === 'failed') {
    if (!updatedJob.completion_time) {
      updatedJob.completion_time = new Date().toISOString();
    }
    const duration = Math.floor((new Date(updatedJob.completion_time).getTime() - new Date(updatedJob.creation_time).getTime()) / 1000);
    updatedJob.run_time = formatDuration(duration);
  } else if (randomStatus === 'running') {
    const duration = Math.floor((Date.now() - new Date(updatedJob.creation_time).getTime()) / 1000);
    updatedJob.run_time = formatDuration(duration);
  } else {
    updatedJob.run_time = 'N/A';
  }
  
  return updatedJob;
}