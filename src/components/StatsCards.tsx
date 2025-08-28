import React from 'react';
import { Job } from '../utils/loadJobs';

interface StatsCardsProps {
  stats: {
    RUNNING: number;
    QUEUED: number;
    COMPLETED: number;
    FAILED: number;
  };
  totalJobs: number;
}

export function StatsCards({ stats, totalJobs }: StatsCardsProps) {
  const statsList = [
    { 
      name: 'Total Jobs', 
      value: totalJobs, 
      change: '+4.75%', 
      changeType: 'positive',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    { 
      name: 'Running', 
      value: stats.RUNNING, 
      change: '+2.02%', 
      changeType: 'positive',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    { 
      name: 'Queued', 
      value: stats.QUEUED, 
      change: '+4.05%', 
      changeType: 'positive',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    { 
      name: 'Completed', 
      value: stats.COMPLETED, 
      change: '+1.32%', 
      changeType: 'positive',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    { 
      name: 'Failed', 
      value: stats.FAILED, 
      change: '-0.58%', 
      changeType: 'negative',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div>
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Overview</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {statsList.map((item) => (
          <div 
            key={item.name} 
            className={`${item.bgColor} px-4 py-5 rounded-lg overflow-hidden shadow`}
          >
            <p className="text-sm font-medium text-gray-500 mb-1">{item.name}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{item.value.toLocaleString()}</p>
              <span 
                className={`ml-2 text-sm font-semibold ${
                  item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}