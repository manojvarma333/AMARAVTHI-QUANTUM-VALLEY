import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Job } from '../utils/loadJobs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF7F50'];

interface ExecutionTimeChartProps {
  jobs: Job[];
}

interface TimeStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  p90: number;
  count: number;
}

const calculateStats = (times: number[]): TimeStats => {
  if (!times.length) return { min: 0, max: 0, avg: 0, median: 0, p90: 0, count: 0 };
  
  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg,
    median,
    p90,
    count: sorted.length
  };
};

const formatTime = (seconds: number): string => {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

export function ExecutionTimeChart({ jobs }: ExecutionTimeChartProps) {
  if (!jobs || jobs.length === 0) {
    return <div className="text-gray-500 p-4">No job data available.</div>;
  }

  // Filter jobs with execution times and group by backend type
  const jobsWithTimes = jobs.filter(job => 
    job.status === 'COMPLETED' && 
    job.execution_time !== null &&
    !isNaN(parseInt(job.execution_time, 10))
  );

  if (jobsWithTimes.length === 0) {
    return <div className="text-gray-500 p-4">No completed jobs with valid timing data available.</div>;
  }

  // Calculate execution times in seconds
  const jobsWithExecutionTime = jobsWithTimes.map(job => ({
    ...job,
    executionTime: parseInt(job.execution_time!, 10) / 1000
  }));

  // Group by backend type and calculate statistics
  const backendStats = jobsWithExecutionTime.reduce((acc, job) => {
    const backend = job.backend_type || 'Unknown';
    if (!acc[backend]) {
      acc[backend] = [];
    }
    acc[backend].push(job.executionTime);
    return acc;
  }, {} as Record<string, number[]>);

  // Calculate statistics for each backend
  const chartData = Object.entries(backendStats).map(([backend, times]) => {
    const stats = calculateStats(times);
    return {
      backend,
      ...stats,
      // For the chart, we'll show min, avg, max as stacked bars
      min: stats.min,
      avgMinusMin: stats.avg - stats.min,
      maxMinusAvg: stats.max - stats.avg,
      // For tooltip
      formattedMin: formatTime(stats.min),
      formattedAvg: formatTime(stats.avg),
      formattedMax: formatTime(stats.max),
      formattedMedian: formatTime(stats.median),
      formattedP90: formatTime(stats.p90),
      count: stats.count
    };
  }).sort((a, b) => b.count - a.count); // Sort by job count

  // Calculate overall statistics
  const allTimes = jobsWithExecutionTime.map(job => job.executionTime);
  const overallStats = calculateStats(allTimes);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Execution Time Analysis</h3>
        <div className="text-sm text-gray-500 mt-1 sm:mt-0">
          {jobsWithExecutionTime.length} completed jobs analyzed
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barGap={0}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="backend" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => 
                value.split('.').pop()?.split(/(?=[A-Z])/).join(' ') || value
              }
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={value => formatTime(Number(value))}
              width={80}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                    <div className="font-medium text-gray-900 mb-2">
                      {label.split('.').pop()?.split(/(?=[A-Z])/).join(' ') || label}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jobs:</span>
                        <span className="font-medium">{data.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Min:</span>
                        <span>{data.formattedMin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Avg:</span>
                        <span>{data.formattedAvg}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-600">Median:</span>
                        <span>{data.formattedMedian}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-600">P90:</span>
                        <span>{data.formattedP90}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Max:</span>
                        <span>{data.formattedMax}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend 
              formatter={(value) => {
                const labels: Record<string, string> = {
                  min: 'Minimum',
                  avgMinusMin: 'Average',
                  maxMinusAvg: 'Maximum'
                };
                return labels[value as keyof typeof labels] || value;
              }}
            />
            
            {/* Stacked bars for min, avg-min, max-avg */}
            <Bar 
              dataKey="min" 
              name="Minimum" 
              stackId="a" 
              fill="#3b82f6" // blue-500
              radius={[4, 0, 0, 4]}
            />
            <Bar 
              dataKey="avgMinusMin" 
              name="Average" 
              stackId="a" 
              fill="#10b981" // emerald-500
            />
            <Bar 
              dataKey="maxMinusAvg" 
              name="Maximum" 
              stackId="a" 
              fill="#ef4444" // red-500
              radius={[0, 4, 4, 0]}
            />
            
            {/* Add reference line for overall average */}
            <ReferenceLine 
              y={overallStats.avg} 
              stroke="#6b7280" // gray-500
              strokeDasharray="3 3"
              label={{
                position: 'right',
                value: `Avg: ${formatTime(overallStats.avg)}`,
                fill: '#6b7280',
                fontSize: 12
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-700">Fastest Execution</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatTime(overallStats.min)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Minimum time across all jobs</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-700">Average Execution</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatTime(overallStats.avg)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Mean execution time</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-700">P90 Execution Time</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatTime(overallStats.p90)}
          </p>
          <p className="text-xs text-gray-500 mt-1">90% of jobs complete within this time</p>
        </div>
      </div>
    </div>
  );
}
