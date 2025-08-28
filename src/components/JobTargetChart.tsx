import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Job } from '../utils/loadJobs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF7F50', '#9ACD32', '#20B2AA'];

interface JobTargetChartProps {
  jobs: Job[];
}

export function JobTargetChart({ jobs }: JobTargetChartProps) {
  if (!jobs || jobs.length === 0) {
    return <div className="text-gray-500 p-4">No job data available.</div>;
  }

  // Count jobs by target
  const targetCounts = jobs.reduce((acc, job) => {
    const target = job.target || 'Unknown';
    acc[target] = (acc[target] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for the chart
  const chartData = Object.entries(targetCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: ((count / jobs.length) * 100).toFixed(1) + '%',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Limit to top 10 targets for better readability

  // Function to format target names for better display
  const formatTargetName = (value: unknown) => {
    const name = typeof value === 'string' ? value : (value != null ? String(value) : '');
    if (!name) return '';
    if (name === 'Unknown') return 'Unknown';
    const lastPart = name.split('.').pop() || name;
    return lastPart.split(/(?=[A-Z])/).join(' ');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Job Distribution by Target</h3>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barSize={30}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={180}
              tick={{ fontSize: 12 }}
              tickFormatter={formatTargetName}
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
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Top Targets</h4>
        <div className="space-y-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {formatTargetName(item.name)}
                </p>
              </div>
              <div className="ml-2 flex items-center">
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.count}</span>
                <span className="text-xs text-gray-500 w-12 text-right">({item.percentage})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
