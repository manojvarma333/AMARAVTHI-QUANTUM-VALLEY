import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  LabelList,
  Line,
  ReferenceLine
} from 'recharts';
import { Job } from '../utils/loadJobs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ShotsDistributionChartProps {
  jobs: Job[];
}

interface BinData {
  range: string;
  count: number;
  rangeStart: number;
  rangeEnd: number;
  percentage: number;
  cumulative?: number;
  cumulativePercentage?: number;
}

const BIN_SIZES = [10, 50, 100, 500, 1000, 5000, 10000];

export function ShotsDistributionChart({ jobs }: ShotsDistributionChartProps) {
  const [binSizeIndex, setBinSizeIndex] = useState(2); // Default to 100 shots/bin
  
  // Filter jobs with shots data
  const jobsWithShots = useMemo(() => 
    jobs.filter(job => typeof job.shots === 'number' && job.shots > 0),
    [jobs]
  );

  if (jobsWithShots.length === 0) {
    return <div className="text-gray-500 p-4">No job data with shots information available.</div>;
  }

  // Calculate statistics
  const shotsData = jobsWithShots.map(job => job.shots!);
  const minShots = Math.min(...shotsData);
  const maxShots = Math.max(...shotsData);
  const avgShots = shotsData.reduce((a, b) => a + b, 0) / shotsData.length;
  const medianShots = [...shotsData].sort((a, b) => a - b)[Math.floor(shotsData.length / 2)];

  // Calculate histogram data
  const binSize = BIN_SIZES[binSizeIndex];
  const numBins = Math.ceil(maxShots / binSize) || 1;
  
  const histogramData = Array(numBins).fill(0).map((_, i) => {
    const rangeStart = i * binSize;
    const rangeEnd = (i + 1) * binSize;
    const count = jobsWithShots.filter(job => {
      const shots = job.shots!;
      return shots >= rangeStart && shots < rangeEnd;
    }).length;
    
    return {
      range: `${rangeStart.toLocaleString()} - ${(rangeEnd - 1).toLocaleString()}`,
      count,
      rangeStart,
      rangeEnd: rangeEnd - 1,
      percentage: (count / jobsWithShots.length) * 100,
    };
  });

  // Calculate cumulative distribution
  let cumulative = 0;
  const cumulativeData = histogramData.map(bin => {
    cumulative += bin.count;
    return {
      ...bin,
      cumulative,
      cumulativePercentage: (cumulative / jobsWithShots.length) * 100,
    };
  });

  // Find the bin with the most jobs
  const maxBin = cumulativeData.reduce((max, bin) => 
    bin.count > max.count ? bin : max, { count: -Infinity } as BinData
  );

  // Format large numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Distribution of Shots</h3>
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="text-sm text-gray-600 mr-2">Bin Size:</span>
          <div className="flex space-x-1">
            {BIN_SIZES.map((size, index) => (
              <button
                key={size}
                onClick={() => setBinSizeIndex(index)}
                className={`px-2 py-1 text-xs rounded ${
                  binSizeIndex === index
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {formatNumber(size)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={cumulativeData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 5,
            }}
            barSize={24}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              height={60}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#0088FE" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              width={60}
              tickFormatter={value => value.toLocaleString()}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#8884d8" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              width={60}
              tickFormatter={value => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                    <div className="font-medium text-gray-900 mb-2">
                      {data.rangeStart.toLocaleString()} - {data.rangeEnd.toLocaleString()} shots
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jobs:</span>
                        <span className="font-medium">{data.count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Percentage:</span>
                        <span>{data.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-600">Cumulative:</span>
                        <span>{data.cumulativePercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            
            <Bar 
              yAxisId="left"
              dataKey="count" 
              name="Number of Jobs"
              fill="#0088FE"
              radius={[4, 4, 0, 0]}
            >
              {cumulativeData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry === maxBin ? '#FF8042' : COLORS[index % COLORS.length]}
                  fillOpacity={0.8}
                />
              ))}
              <LabelList 
                dataKey="count" 
                position="top" 
                formatter={(value: number) => value > 0 ? value : ''}
                style={{ fontSize: '10px', fill: '#4B5563' }}
              />
            </Bar>
            
            <Line 
              yAxisId="right"
              type="monotone"
              dataKey="cumulativePercentage"
              name="Cumulative %"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            
            {/* Add reference lines for average and median */}
            <ReferenceLine 
              x={cumulativeData[Math.min(Math.floor(avgShots / binSize), cumulativeData.length - 1)]?.range}
              stroke="#10B981"
              strokeDasharray="3 3"
              label={{
                position: 'top',
                value: `Avg: ${avgShots.toLocaleString()}`,
                fill: '#10B981',
                fontSize: 12
              }}
            />
            <ReferenceLine 
              x={cumulativeData[Math.min(Math.floor(medianShots / binSize), cumulativeData.length - 1)]?.range} 
              stroke="#8B5CF6"
              strokeDasharray="3 3"
              label={{
                position: 'top',
                value: `Median: ${medianShots.toLocaleString()}`,
                fill: '#8B5CF6',
                fontSize: 12,
                dy: 15
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-700">Minimum Shots</p>
          <p className="text-2xl font-semibold text-gray-900">
            {minShots.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Lowest number of shots in any job</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-700">Average Shots</p>
          <p className="text-2xl font-semibold text-gray-900">
            {avgShots.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">Mean shots per job</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-700">Maximum Shots</p>
          <p className="text-2xl font-semibold text-gray-900">
            {maxShots.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Highest number of shots in any job</p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Note: The orange bar indicates the bin with the most jobs. Hover over bars for detailed information.</p>
      </div>
    </div>
  );
}
