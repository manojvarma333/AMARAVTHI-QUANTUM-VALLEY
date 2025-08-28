import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Job } from '../utils/loadJobs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface JobStatusChartProps {
  jobs: Job[];
}

const StatusCard = ({ title, count, color }: { title: string; count: number; color: string }) => (
  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-lg font-semibold">{count}</p>
    </div>
  </div>
);

export function JobStatusChart({ jobs }: JobStatusChartProps) {
  if (!jobs || jobs.length === 0) {
    return <div className="text-gray-500 p-4">No job data available.</div>;
  }

  // Count jobs by status
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for the chart
  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / jobs.length) * 100).toFixed(1) + '%',
  }));

  // Sort by count in descending order
  chartData.sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Job Status Distribution</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => [
                  `${props.payload.percentage} (${value} jobs)`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {chartData.map((status, index) => (
            <StatusCard
              key={status.name}
              title={status.name}
              count={status.value}
              color={COLORS[index % COLORS.length]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
