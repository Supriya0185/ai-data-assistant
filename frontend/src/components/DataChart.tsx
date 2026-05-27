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
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#f97316', '#84cc16', '#ec4899', '#3b82f6',
];

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: unknown; color: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl px-3 py-2">
      {label && <p className="text-xs text-slate-400 mb-1.5 font-medium">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-slate-300">{entry.name}:</span>
          <span className="text-xs text-white font-semibold">{String(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const DataChart: React.FC<Props> = ({ chart }) => {
  if (!chart.data || chart.data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm py-8 bg-gray-50 rounded-xl border border-gray-100">
        No chart data available
      </div>
    );
  }

  const axisStyle = { fontSize: 11, fill: '#94a3b8' };
  const gridProps = { strokeDasharray: '3 3', stroke: '#f1f5f9', vertical: false };

  const commonProps = {
    data: chart.data,
    margin: { top: 8, right: 16, left: -10, bottom: 8 },
  };

  const renderChart = () => {
    switch (chart.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={chart.xAxis} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            {chart.yAxis && (
              <Bar
                dataKey={chart.yAxis}
                fill={COLORS[0]!}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            )}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={chart.xAxis} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            {chart.yAxis && (
              <Line
                type="monotone"
                dataKey={chart.yAxis}
                stroke={COLORS[0]!}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.25} />
                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={chart.xAxis} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            {chart.yAxis && (
              <Area
                type="monotone"
                dataKey={chart.yAxis}
                stroke={COLORS[0]!}
                fill="url(#areaGrad)"
                strokeWidth={2.5}
              />
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
              outerRadius={90}
              innerRadius={40}
              paddingAngle={2}
              label={({ name, percent }) =>
                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {chart.data.map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]!}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey={chart.xAxis} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis dataKey={chart.yAxis} tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={chart.data} fill={COLORS[0]!} />
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Chart header */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">{chart.title}</h4>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-medium capitalize">
            {chart.type} chart
          </span>
        </div>
      </div>

      <div className="px-2 pb-2 pt-2">
        <ResponsiveContainer width="100%" height={260}>
          {renderChart() ?? <div />}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
