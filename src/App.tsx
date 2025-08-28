import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { JobsTable } from './components/JobsTable';
import { StatsCards } from './components/StatsCards';
import { Job, loadJobs } from './utils/loadJobs';
import { JobStatusChart } from './components/JobStatusChart';
import { BackendTypeChart } from './components/BackendTypeChart';
import { JobTargetChart } from './components/JobTargetChart';
import { JobTimelineChart } from './components/JobTimelineChart';
import { ExecutionTimeChart } from './components/ExecutionTimeChart';
import { ShotsDistributionChart } from './components/ShotsDistributionChart';

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Job>('creation_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  // New: filters and search
  const [statusFilter, setStatusFilter] = useState<'All' | Job['status']>('All');
  const [backendTypeFilter, setBackendTypeFilter] = useState<string>('All');
  const [providerFilter, setProviderFilter] = useState<string>('All');
  const [targetFilter, setTargetFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Load jobs from CSV
  const fetchJobs = async () => {
    try {
      setRefreshing(true);
      const data = await loadJobs();
      setJobs(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Failed to load job data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Derived filter option lists
  const statusOptions = React.useMemo(() => ['All', 'RUNNING', 'QUEUED', 'COMPLETED', 'FAILED'] as const, []);
  const backendTypeOptions = React.useMemo(() => {
    const set = new Set(jobs.map(j => j.backend_type || 'Unknown').filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [jobs]);
  const providerOptions = React.useMemo(() => {
    const set = new Set(jobs.map(j => j.provider || 'Unknown').filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [jobs]);
  const targetOptions = React.useMemo(() => {
    const set = new Set(jobs.map(j => j.target || 'Unknown').filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter(j => {
      if (statusFilter !== 'All' && j.status !== statusFilter) return false;
      if (backendTypeFilter !== 'All' && (j.backend_type || 'Unknown') !== backendTypeFilter) return false;
      if (providerFilter !== 'All' && (j.provider || 'Unknown') !== providerFilter) return false;
      if (targetFilter !== 'All' && (j.target || 'Unknown') !== targetFilter) return false;
      if (!q) return true;
      const fields = [
        j.job_id,
        j.job_name,
        j.backend,
        j.backend_type,
        j.status,
        j.creation_time,
        j.end_time ?? '',
        j.execution_time ?? '',
        String(j.shots),
        j.provider,
        j.target,
      ]
        .filter(Boolean)
        .map(String)
        .map(v => v.toLowerCase());
      return fields.some(v => v.includes(q));
    });
  }, [jobs, statusFilter, backendTypeFilter, providerFilter, targetFilter, searchQuery]);

  // Handle sorting
  const handleSort = (field: keyof Job) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort jobs (use filteredJobs)
  const sortedJobs = React.useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      let comparison = 0;

      if (sortField === 'creation_time' || sortField === 'end_time') {
        comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
      } else if (sortField === 'execution_time') {
        comparison = parseInt(aValue as string, 10) - parseInt(bValue as string, 10);
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredJobs, sortField, sortDirection]);

  // Calculate stats (use filteredJobs)
  const stats = React.useMemo(() => {
    return filteredJobs.reduce(
      (acc, job) => {
        if (job.status in acc) {
          acc[job.status]++;
        }
        return acc;
      },
      {
        RUNNING: 0,
        QUEUED: 0,
        COMPLETED: 0,
        FAILED: 0,
      } as Record<string, number>
    );
  }, [filteredJobs]);

  // Handle job refresh
  const handleRefreshJob = (jobId: string) => {
    console.log(`Refreshing job ${jobId}`);
  };

  // Handle full refresh
  const handleRefreshAll = () => {
    fetchJobs();
  };

  const handleTimeRangeChange = (range: '24h' | '7d' | '30d' | 'all') => {
    setTimeRange(range);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Quantum Job Dashboard</h1>
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Stats Cards */}
        <div className="px-4 sm:px-0">
          <StatsCards stats={stats} totalJobs={filteredJobs.length} />
        </div>

        {/* Filters Row */}
        <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Job Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Backend Type</label>
              <select
                value={backendTypeFilter}
                onChange={(e) => setBackendTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {backendTypeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target</label>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {targetOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-700">Filtered data displayed. Showing {filteredJobs.length.toLocaleString()} jobs.</p>
          </div>
        </div>

        {/* Search + Jobs Table */}
        <div className="px-4 sm:px-0 space-y-3">
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all columns..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <JobsTable
              jobs={sortedJobs}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onRefreshJob={handleRefreshJob}
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Status Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <JobStatusChart jobs={filteredJobs} />
          </div>

          {/* Backend Type Usage */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <BackendTypeChart jobs={filteredJobs} />
          </div>

          {/* Job Distribution by Target */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <JobTargetChart jobs={filteredJobs} />
          </div>

          {/* Job Submissions Over Time */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <JobTimelineChart 
              jobs={filteredJobs} 
              timeRange={timeRange} 
              onTimeRangeChange={handleTimeRangeChange} 
            />
          </div>

          {/* Execution Time Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
            <ExecutionTimeChart jobs={filteredJobs} />
          </div>

          {/* Distribution of Shots */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
            <ShotsDistributionChart jobs={filteredJobs} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Quantum Job Dashboard - {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}