import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, TrendingDown, Minus, Smile, Frown, Meh, Zap, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useTeam } from '../context/TeamContext';
import activityService from '../services/activityService';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const MOOD_CONFIG = {
  excellent: { label: 'Excellent', color: '10B981', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', score: 5 },
  good:      { label: 'Good',      color: '6366F1', bg: 'bg-indigo-50',  text: 'text-indigo-700',  badge: 'bg-indigo-100 text-indigo-700',  score: 4 },
  neutral:   { label: 'Neutral',   color: 'F59E0B', bg: 'bg-amber-50',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-700',    score: 3 },
  tired:     { label: 'Tired',     color: 'F97316', bg: 'bg-orange-50',  text: 'text-orange-700',  badge: 'bg-orange-100 text-orange-700',  score: 2 },
  stressed:  { label: 'Stressed',  color: 'EF4444', bg: 'bg-red-50',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700',        score: 1 },
};

const MoodEmoji = ({ mood, size = 'md' }) => {
  const icons = {
    excellent: '😄', good: '🙂', neutral: '😐', tired: '😴', stressed: '😰',
  };
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  return <span className={sizes[size]}>{icons[mood] || '😐'}</span>;
};

const StatCard = ({ label, value, sub, color, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={15} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const MoodDashboard = () => {
  const { currentTeam } = useTeam();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(14);

  useEffect(() => {
    if (!currentTeam?._id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [dailyRes, statsRes] = await Promise.all([
          activityService.getDailyStats(range),
          activityService.getStats({ days: range }),
        ]);
        const daily = dailyRes.data || [];
        setHistory(daily.filter(d => d.hours > 0));

        // Compute mood distribution from daily data
        const moodCounts = {};
        let totalProd = 0, prodCount = 0;
        daily.forEach(d => {
          if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
          if (d.productivity > 0) { totalProd += d.productivity; prodCount++; }
        });
        setStats({
          moodCounts,
          avgProductivity: prodCount ? (totalProd / prodCount).toFixed(1) : 0,
          activeDays: daily.filter(d => d.hours > 0).length,
          topMood: Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral',
        });
      } catch (e) {}
      finally { setLoading(false); }
    };
    load();
  }, [currentTeam?._id, range]);

  if (loading) return <LoadingSpinner />;

  const moodData = Object.entries(MOOD_CONFIG).map(([key, cfg]) => ({
    mood: cfg.label,
    count: stats?.moodCounts?.[key] || 0,
    color: cfg.color,
  }));

  const trendData = history.map(d => ({
    day: d.day,
    productivity: d.productivity,
    moodScore: MOOD_CONFIG[d.mood]?.score || 3,
  }));

  const totalMoodEntries = Object.values(stats?.moodCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mood & Wellbeing</h1>
            <p className="text-sm text-gray-500">{currentTeam?.name} · last {range} days</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[7, 14, 30].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${range === r ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Avg Productivity" value={`${stats?.avgProductivity}/10`} sub="self-assessed" color="bg-indigo-500" icon={Zap} />
        <StatCard label="Active Days" value={stats?.activeDays || 0} sub={`of ${range} days`} color="bg-emerald-500" icon={TrendingUp} />
        <StatCard label="Top Mood" value={<MoodEmoji mood={stats?.topMood} />} sub={MOOD_CONFIG[stats?.topMood]?.label} color="bg-pink-500" icon={Smile} />
        <StatCard label="Mood Entries" value={totalMoodEntries} sub="logged" color="bg-amber-500" icon={Heart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Mood distribution bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-1">Mood Distribution</h3>
          <p className="text-xs text-gray-400 mb-4">How you've been feeling</p>
          <div className="space-y-3">
            {Object.entries(MOOD_CONFIG).map(([key, cfg]) => {
              const count = stats?.moodCounts?.[key] || 0;
              const pct = totalMoodEntries ? Math.round((count / totalMoodEntries) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <MoodEmoji mood={key} size="sm" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
                      <span className="text-xs text-gray-400">{count} days · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: `#${cfg.color}` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Productivity trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-1">Productivity Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Score out of 10 per day</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }}
                  formatter={(v, name) => [v, name === 'productivity' ? 'Productivity' : 'Mood Score']}
                />
                <Line type="monotone" dataKey="productivity" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: '#6366F1', r: 3 }} name="productivity" />
                <Line type="monotone" dataKey="moodScore" stroke="#EC4899" strokeWidth={2} strokeDasharray="4 2" dot={false} name="moodScore" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">No data yet — log some activities</div>
          )}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-indigo-500 rounded" /><span className="text-xs text-gray-400">Productivity</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-pink-400 rounded" style={{ borderTop: '2px dashed' }} /><span className="text-xs text-gray-400">Mood</span></div>
          </div>
        </div>
      </div>

      {/* Day-by-day mood log */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">Day-by-Day Log</h3>
          <div className="flex flex-wrap gap-2">
            {history.map((d, i) => {
              const cfg = MOOD_CONFIG[d.mood] || MOOD_CONFIG.neutral;
              return (
                <div key={i} title={`${d.date} — ${cfg.label} — ${d.productivity}/10 productivity`}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border ${cfg.bg} cursor-default`}>
                  <MoodEmoji mood={d.mood} size="sm" />
                  <span className="text-[10px] font-semibold text-gray-500">{d.day}</span>
                  <span className="text-[10px] text-gray-400">{d.productivity}/10</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodDashboard;
