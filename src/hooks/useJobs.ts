import { useState, useEffect, useCallback } from 'react';
import { Job, JobStats } from '../types/Job';
import { generateMockJobs, simulateJobStatusChange } from '../utils/mockData';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<Job['status'] | 'all'>('all');
  const [backendFilter, setBackendFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Job>('creation_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Initialize jobs
  useEffect(() => {
    const initialJobs = generateMockJobs(250);
    setJobs(initialJobs);
    setLoading(false);
  }, []);

  // Calculate stats
  const stats: JobStats = {
    queued: jobs.filter(job => job.status === 'queued').length,
    running: jobs.filter(job => job.status === 'running').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    failed: jobs.filter(job => job.status === 'failed').length,
  };

  // Get unique backends
  const backends = Array.from(new Set(jobs.map(job => job.backend))).sort();

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...jobs];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Apply backend filter
    if (backendFilter !== 'all') {
      filtered = filtered.filter(job => job.backend === backendFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle date sorting
      if (sortField === 'creation_time') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredJobs(filtered);
  }, [jobs, statusFilter, backendFilter, sortField, sortDirection]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(currentJobs => {
        // Simulate some jobs changing status
        const updatedJobs = currentJobs.map(job => {
          // 10% chance of status change for demo purposes
          if (Math.random() < 0.1) {
            return simulateJobStatusChange(job);
          }
          return job;
        });
        setLastUpdated(new Date());
        return updatedJobs;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Refresh individual job
  const refreshJob = useCallback((jobId: string) => {
    setJobs(currentJobs =>
      currentJobs.map(job =>
        job.job_id === jobId ? simulateJobStatusChange(job) : job
      )
    );
    setLastUpdated(new Date());
  }, []);

  // Sorting function
  const handleSort = useCallback((field: keyof Job) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  return {
    jobs: filteredJobs,
    stats,
    backends,
    loading,
    lastUpdated,
    statusFilter,
    setStatusFilter,
    backendFilter,
    setBackendFilter,
    sortField,
    sortDirection,
    handleSort,
    refreshJob
  };
}