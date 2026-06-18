import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown } from 'lucide-react';

const DONE_STATUSES = new Set(['resolved', 'completed', 'closed', 'done']);

const BurndownChart = ({ sprint, tasks }) => {
  const data = useMemo(() => {
    if (!sprint?.startDate || !sprint?.endDate || !tasks?.length) return [];

    const start = new Date(sprint.startDate);
    const end   = new Date(sprint.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const totalSP = tasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
    if (totalSP === 0) return [];

    // Count days
    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    if (days.length === 0) return [];

    const idealBurnPerDay = totalSP / (days.length - 1);

    // Build actual burn from task completion dates
    // We don't have completion timestamps, so we approximate using status:
    // completed tasks are assumed burned by end of sprint
    const completedSP = tasks.filter(t => DONE_STATUSES.has(String(t.status || '').toLowerCase())).reduce((s, t) => s + (t.storyPoints || 0), 0);

    // Distribute completed SP evenly across sprint days (approximation)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const elapsed = days.filter(d => d <= today).length;
    const burnPerElapsedDay = elapsed > 0 ? completedSP / elapsed : 0;

    return days.map((d, i) => {
      const isPast = d <= today;
      const ideal  = Math.max(0, Math.round((totalSP - idealBurnPerDay * i) * 10) / 10);
      const actual = isPast ? Math.max(0, Math.round((totalSP - burnPerElapsedDay * Math.min(i + 1, elapsed)) * 10) / 10) : null;

      return {
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ideal,
        actual,
      };
    });
  }, [sprint, tasks]);

  if (!data.length) return null;

  const totalSP = tasks.reduce((s, t) => s + (t.storyPoints || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown size={16} className="text-indigo-500" />
        <h3 className="font-bold text-gray-900 text-sm">Burndown Chart</h3>
        <span className="text-xs text-gray-400 ml-auto">Total: {totalSP} SP</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(v, name) => [v !== null ? `${v} SP` : '—', name === 'ideal' ? 'Ideal' : 'Actual']}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Ideal" />
          <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2} dot={false} name="Actual" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BurndownChart;
