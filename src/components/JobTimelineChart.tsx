import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Job } from '../utils/loadJobs';

interface JobTimelineChartProps {
  jobs: Job[];
  timeRange: '24h' | '7d' | '30d' | 'all';
  onTimeRangeChange: (range: '24h' | '7d' | '30d' | 'all') => void;
}

interface TimeDataPoint {
  date: Date;
  count: number;
  formattedDate: string;
}

const formatDate = (date: Date, timeRange: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short',
    day: 'numeric'
  };

  if (timeRange === '24h') {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }
  
  if (timeRange === 'all') {
    options.year = '2-digit';
  }
  
  return date.toLocaleDateString('en-US', options);
};

export function JobTimelineChart({ jobs, timeRange, onTimeRangeChange }: JobTimelineChartProps) {
  const chartData = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];

    // Filter jobs by time range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
      default:
        const creationDates = jobs
          .map(job => new Date(job.creation_time).getTime())
          .filter(time => !isNaN(time));
        startDate = creationDates.length > 0 
          ? new Date(Math.min(...creationDates)) 
          : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days if no valid dates
        break;
    }

    // Group jobs by time period
    const timeData: Record<string, { date: Date; count: number }> = {};
    
    jobs.forEach(job => {
      const jobDate = new Date(job.creation_time);
      if (isNaN(jobDate.getTime()) || jobDate < startDate) return;
      
      let timeKey: string;
      const normalizedDate = new Date(jobDate);
      
      if (timeRange === '24h') {
        // Group by hour
        normalizedDate.setMinutes(0, 0, 0);
        timeKey = normalizedDate.getTime().toString();
      } else {
        // Group by day for all other ranges
        normalizedDate.setHours(0, 0, 0, 0);
        timeKey = normalizedDate.getTime().toString();
      }

      if (!timeData[timeKey]) {
        timeData[timeKey] = {
          date: new Date(parseInt(timeKey)),
          count: 0,
        };
      }
      timeData[timeKey].count++;
    });

    // Convert to array and sort by date
    const sortedData = Object.values(timeData)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(item => ({
        ...item,
        formattedDate: formatDate(item.date, timeRange)
      }));

    // Fill in missing dates with zero counts if needed
    if (sortedData.length === 0) return [];
    
    const filledData: TimeDataPoint[] = [];
    const firstDate = new Date(sortedData[0].date);
    let currentDate = timeRange === '24h' 
      ? new Date(firstDate.setMinutes(0, 0, 0)) 
      : new Date(firstDate.setHours(0, 0, 0, 0));

    const endDate = new Date();
    let dataIndex = 0;

    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate);
      if (timeRange === '24h') {
        nextDate.setHours(nextDate.getHours() + 1);
      } else {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      let count = 0;
      if (dataIndex < sortedData.length && sortedData[dataIndex].date.getTime() === currentDate.getTime()) {
        count = sortedData[dataIndex].count;
        dataIndex++;
      }
      
      filledData.push({
        date: new Date(currentDate),
        count: count,
        formattedDate: formatDate(new Date(currentDate), timeRange)
      });
      
      currentDate = nextDate;
    }
    
    return filledData;
  }, [jobs, timeRange]);

  if (!jobs || jobs.length === 0) {
    return <div className="text-gray-500 p-4">No job data available.</div>;
  }

  if (chartData.length === 0) {
    return <div className="text-gray-500 p-4">No data available for the selected time range.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Job Submissions Over Time</h3>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              width={40}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                      <p className="font-medium text-gray-900 mb-1">
                        {payload[0].payload.formattedDate}
                      </p>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jobs:</span>
                        <span className="font-medium">{payload[0].value}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              name="Jobs" 
              stroke="#3b82f6"
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
