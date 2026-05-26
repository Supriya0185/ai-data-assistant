import React from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ChartSuggestion } from '../types';

interface Props {
  chart: ChartSuggestion;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
];

export const DataChart: React.FC<Props> = ({ chart }) => {
  if (!chart.data || chart.data.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-4">
        No chart data available
      </div>
    );
  }

  const commonProps = {
    data: chart.data,
    margin: { top: 10, right: 20, left: 0, bottom: 10 },
  };

  const renderChart = () => {
    switch (chart.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chart.xAxis} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {chart.yAxis && <Bar dataKey={chart.yAxis} fill={COLORS[0]!} radius={[4, 4, 0, 0]} />}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chart.xAxis} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {chart.yAxis && <Line type="monotone" dataKey={chart.yAxis} stroke={COLORS[0]!} strokeWidth={2} dot={false} />}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chart.xAxis} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {chart.yAxis && (
              <Area type="monotone" dataKey={chart.yAxis} stroke={COLORS[0]!} fill={`${COLORS[0]}33`} strokeWidth={2} />
            )}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chart.data}
              dataKey={chart.yAxis || 'value'}
              nameKey={chart.xAxis || 'name'}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chart.data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]!} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chart.xAxis} tick={{ fontSize: 11 }} />
            <YAxis dataKey={chart.yAxis} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Scatter data={chart.data} fill={COLORS[0]!} />
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{chart.title}</h4>
      <ResponsiveContainer width="100%" height={260}>
        {renderChart() ?? <div />}
      </ResponsiveContainer>
    </div>
  );
};
