import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import activityService from '../../services/activityService';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="font-bold mb-1">{label}</p>
      <p>{d.hours}h logged</p>
      {d.meetings > 0 && <p className="text-gray-400">{d.meetings} meeting{d.meetings !== 1 ? 's' : ''}</p>}
      {d.tasks > 0 && <p className="text-gray-400">{d.tasks} task{d.tasks !== 1 ? 's' : ''}</p>}
      {d.productivity > 0 && <p className="text-gray-400">productivity {d.productivity}/10</p>}
    </div>
  );
};

const WeeklyChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService.getDailyStats(7)
      .then(res => setData(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
      <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
      <div className="h-28 bg-gray-50 rounded-xl" />
    </div>
  );

  const totalHours = data.reduce((s, d) => s + d.hours, 0);
  const activeDays = data.filter(d => d.hours > 0).length;
  const today = data[data.length - 1];
  const yesterday = data[data.length - 2];
  const trend = today && yesterday
    ? today.hours > yesterday.hours ? 'up'
    : today.hours < yesterday.hours ? 'down' : 'flat'
    : 'flat';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">This Week</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalHours.toFixed(1)}h across {activeDays} active day{activeDays !== 1 ? 's' : ''}
          </p>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon size={14} />
          <span>vs yesterday</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={data} barSize={22} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb', radius: 6 }} />
          <Bar dataKey="hours" radius={[5, 5, 0, 0]}>
            {data.map((entry, i) => {
              const isToday = i === data.length - 1;
              const isEmpty = entry.hours === 0;
              return (
                <Cell
                  key={i}
                  fill={isToday ? '#111827' : isEmpty ? '#e5e7eb' : '#6366f1'}
                  opacity={isEmpty ? 0.5 : 1}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-between mt-3">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            {d.productivity > 0 && (
              <div
                className="w-1 rounded-full bg-orange-400"
                style={{ height: `${(d.productivity / 10) * 16}px`, minHeight: 2 }}
                title={`Productivity: ${d.productivity}/10`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-300 text-right mt-1">orange dots = productivity</p>
    </div>
  );
};

export default WeeklyChart;
