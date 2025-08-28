import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Job } from '../utils/loadJobs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface BackendTypeChartProps {
  jobs: Job[];
}

export function BackendTypeChart({ jobs }: BackendTypeChartProps) {
  if (!jobs || jobs.length === 0) {
    return <div className="text-gray-500 p-4">No job data available.</div>;
  }

  // Count jobs by backend type
  const backendCounts = jobs.reduce((acc, job) => {
    const backendType = job.backend_type || 'Unknown';
    acc[backendType] = (acc[backendType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for the chart
  const chartData = Object.entries(backendCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: ((count / jobs.length) * 100).toFixed(1) + '%',
    }))
    .sort((a, b) => b.count - a.count);

  // Function to format backend type names for better display
  const formatBackendName = (name: string) => {
    if (typeof name !== 'string') return '';
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Backend Type Usage</h3>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={150}
              tick={{ fontSize: 12 }}
              tickFormatter={formatBackendName}
            />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${props.payload.percentage} (${value} jobs)`,
                'Count'
              ]}
            />
            <Bar 
              dataKey="count" 
              name="Number of Jobs"
              fill="#0088FE"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }} 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {formatBackendName(item.name)}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">{item.count}</span>
                <span className="text-sm text-gray-500">{item.percentage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
