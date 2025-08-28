import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Job } from '../utils/loadJobs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface JobChartsProps {
  jobs: Job[];
}

// Add error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in chart component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 p-4">Error rendering chart. Check console for details.</div>;
    }
    return this.props.children;
  }
}

export function JobCharts({ jobs }: JobChartsProps) {
  console.log('Rendering JobCharts with jobs:', jobs);
  
  if (!jobs || jobs.length === 0) {
    return <div className="text-gray-500 p-4">No job data available for charts.</div>;
  }

  try {
    // Prepare data for status distribution pie chart
    const statusData = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(statusData).map(([name, value]) => ({
      name,
      value,
    }));

    // Prepare data for backend distribution bar chart
    const backendData = jobs.reduce((acc, job) => {
      const backend = job.backend_type || 'Unknown';
      acc[backend] = (acc[backend] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const barData = Object.entries(backendData).map(([name, value]) => ({
      name,
      Jobs: value,
    }));

    // Prepare data for jobs over time bar chart
    const jobsOverTime = jobs
      .filter(job => job.creation_time)
      .sort((a, b) => new Date(a.creation_time).getTime() - new Date(b.creation_time).getTime())
      .reduce((acc, job) => {
        const date = new Date(job.creation_time).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, count: 0 };
        }
        acc[date].count++;
        return acc;
      }, {} as Record<string, { date: string; count: number }>);

    const lineData = Object.values(jobsOverTime);

    const ChartWrapper = ({ children }: { children: React.ReactNode }) => (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {children}
      </div>
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution Pie Chart */}
        <ErrorBoundary>
          <ChartWrapper>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Status Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        </ErrorBoundary>

        {/* Backend Distribution Bar Chart */}
        <ErrorBoundary>
          <ChartWrapper>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Backend Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Jobs" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        </ErrorBoundary>

        {/* Jobs Over Time Bar Chart */}
        <ErrorBoundary>
          <ChartWrapper>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Jobs Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lineData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Jobs" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        </ErrorBoundary>
      </div>
    );
  } catch (error) {
    console.error('Error rendering charts:', error);
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">Error rendering charts. Please check the console for details.</p>
          </div>
        </div>
      </div>
    );
  }
}
