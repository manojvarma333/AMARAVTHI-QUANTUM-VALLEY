import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { Job } from '../types/Job';

interface FilterBarProps {
  statusFilter: Job['status'] | 'all';
  setStatusFilter: (status: Job['status'] | 'all') => void;
  backendFilter: string;
  setBackendFilter: (backend: string) => void;
  backends: string[];
  lastUpdated: Date;
}

export function FilterBar({
  statusFilter,
  setStatusFilter,
  backendFilter,
  setBackendFilter,
  backends,
  lastUpdated
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter size={20} />
          <span className="font-medium">Filters</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Job['status'] | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Backend Filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Backend</label>
            <select
              value={backendFilter}
              onChange={(e) => setBackendFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[200px]"
            >
              <option value="all">All Backends</option>
              {backends.map((backend) => (
                <option key={backend} value={backend}>
                  {backend}
                </option>
              ))}
            </select>
          </div>

          {/* Last Updated */}
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw size={16} />
              <span>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}