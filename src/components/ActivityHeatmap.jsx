import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['','Mon','','Wed','','Fri',''];

const colorLevel = (hours) => {
  if (hours === 0) return 'bg-gray-100 dark-cell-0';
  if (hours < 2)   return 'bg-emerald-200 dark-cell-1';
  if (hours < 4)   return 'bg-emerald-400 dark-cell-2';
  if (hours < 6)   return 'bg-emerald-600 dark-cell-3';
  return 'bg-emerald-800 dark-cell-4';
};

const ActivityHeatmap = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    api.get('/activities/stats/daily', { params: { days: 365 } })
      .then(res => {
        const map = {};
        (res.data?.data || []).forEach(d => { map[d.date] = d.hours; });
        setData(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build a 52-week grid (Sunday-based, going backwards from today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from the Sunday of the week 52 weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  // Build weeks array
  const weeks = [];
  const cursor = new Date(startDate);
  while (cursor <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().split('T')[0];
      week.push({ date: iso, hours: data[iso] || 0, future: cursor > today });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month labels: find first week of each month
  const monthLabels = [];
  weeks.forEach((week, wi) => {
    const firstDay = new Date(week[0].date + 'T00:00:00');
    if (firstDay.getDate() <= 7) {
      monthLabels.push({ wi, label: MONTHS[firstDay.getMonth()] });
    }
  });

  const totalDays  = Object.keys(data).length;
  const activeDays = Object.values(data).filter(h => h > 0).length;
  const maxStreak  = (() => {
    let best = 0, cur = 0;
    const sorted = Object.keys(data).sort();
    for (let i = 0; i < sorted.length; i++) {
      if (data[sorted[i]] > 0) { cur++; best = Math.max(best, cur); }
      else cur = 0;
    }
    return best;
  })();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="h-32 animate-pulse bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Activity Heatmap</h3>
          <p className="text-xs text-gray-400 mt-0.5">{activeDays} active days in the past year · Best streak: {maxStreak} days</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span>Less</span>
          {['bg-gray-100','bg-emerald-200','bg-emerald-400','bg-emerald-600','bg-emerald-800'].map(c => (
            <span key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="relative mb-1" style={{ paddingLeft: 28 }}>
        <div className="flex gap-0.5">
          {weeks.map((_, wi) => {
            const ml = monthLabels.find(m => m.wi === wi);
            return (
              <div key={wi} className="flex-shrink-0" style={{ width: 13 }}>
                {ml && <span className="text-[9px] text-gray-400 absolute">{ml.label}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex gap-0.5" style={{ paddingLeft: 28 }}>
        {/* Day labels */}
        <div className="absolute flex flex-col gap-0.5" style={{ marginLeft: -26, marginTop: 2 }}>
          {DAYS.map((d, i) => (
            <div key={i} className="text-[9px] text-gray-400 leading-none flex items-center" style={{ height: 13 }}>{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(cell => (
              <div
                key={cell.date}
                className={`w-3 h-3 rounded-sm cursor-default transition-transform hover:scale-125 relative ${cell.future ? 'opacity-0' : colorLevel(cell.hours)}`}
                onMouseEnter={() => setHovered(cell)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="mt-2 text-xs text-gray-500">
          <strong className="text-gray-800">{new Date(hovered.date + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</strong>
          {' — '}
          {hovered.hours > 0 ? `${hovered.hours}h logged` : 'No activity'}
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
