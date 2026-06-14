import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, Clock, CheckSquare, Zap, Crown } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import activityService from '../services/activityService';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const RANK_STYLE = [
  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-400', text: 'text-amber-700', icon: '🥇' },
  { bg: 'bg-gray-50',  border: 'border-gray-200',  badge: 'bg-gray-400',  text: 'text-gray-600',  icon: '🥈' },
  { bg: 'bg-orange-50',border: 'border-orange-200',badge: 'bg-orange-400',text: 'text-orange-700',icon: '🥉' },
];

const CATEGORIES = [
  { key: 'hours',       label: 'Hours Logged',   icon: Clock,       color: 'text-indigo-500', unit: 'h' },
  { key: 'tasks',       label: 'Tasks Done',      icon: CheckSquare, color: 'text-emerald-500', unit: '' },
  { key: 'meetings',    label: 'Meetings',        icon: TrendingUp,  color: 'text-blue-500', unit: '' },
  { key: 'productivity',label: 'Avg Productivity',icon: Zap,         color: 'text-amber-500', unit: '/10' },
];

const Avatar = ({ name, rank }) => {
  const colors = ['bg-indigo-500','bg-emerald-500','bg-pink-500','bg-amber-500','bg-blue-500','bg-purple-500'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`relative w-10 h-10 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-sm font-bold">{name?.charAt(0)?.toUpperCase()}</span>
      {rank < 3 && (
        <span className="absolute -top-1 -right-1 text-sm">{RANK_STYLE[rank]?.icon}</span>
      )}
    </div>
  );
};

const Leaderboard = () => {
  const { currentTeam } = useTeam();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);
  const [sortBy, setSortBy] = useState('hours');

  useEffect(() => {
    if (!currentTeam?._id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await activityService.getMemberComparison(currentTeam._id, { days: range });
        const data = (res.data || []).map(m => ({
          name: m.userName || m.name || 'Unknown',
          hours: parseFloat((m.totalHours || 0).toFixed(1)),
          tasks: m.totalTasks || 0,
          meetings: m.totalMeetings || 0,
          productivity: parseFloat((m.avgProductivity || 0).toFixed(1)),
          activeDays: m.activeDays || 0,
        }));
        setMembers(data);
      } catch { setMembers([]); }
      finally { setLoading(false); }
    };
    load();
  }, [currentTeam?._id, range]);

  if (loading) return <LoadingSpinner />;

  const sorted = [...members].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  const maxVal = sorted[0]?.[sortBy] || 1;
  const cat = CATEGORIES.find(c => c.key === sortBy);

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
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

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(c => {
          const Icon = c.icon;
          return (
            <button key={c.key} onClick={() => setSortBy(c.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${sortBy === c.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              <Icon size={14} />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Top 3 podium */}
      {sorted.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[sorted[1], sorted[0], sorted[2]].map((m, i) => {
            const actualRank = i === 1 ? 0 : i === 0 ? 1 : 2;
            const style = RANK_STYLE[actualRank];
            const heights = ['h-28', 'h-36', 'h-24'];
            return (
              <div key={m.name}
                className={`${style.bg} border ${style.border} rounded-2xl p-4 flex flex-col items-center justify-end ${heights[i]} transition-all`}>
                <span className="text-2xl mb-1">{style.icon}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${['bg-indigo-500','bg-emerald-500','bg-pink-500','bg-amber-500','bg-blue-500'][m.name?.charCodeAt(0) % 5]}`}>
                  <span className="text-white text-sm font-bold">{m.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <p className="font-bold text-gray-900 text-sm text-center truncate w-full">{m.name}</p>
                <p className={`text-xs font-semibold ${style.text}`}>{m[sortBy]}{cat?.unit}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full rankings */}
      <div className="space-y-3">
        {sorted.map((m, i) => {
          const style = i < 3 ? RANK_STYLE[i] : null;
          const pct = maxVal > 0 ? (m[sortBy] / maxVal) * 100 : 0;
          return (
            <div key={m.name}
              className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${style ? `${style.border}` : 'border-gray-100'} shadow-sm`}>
              <div className="w-7 text-center">
                <span className={`text-sm font-bold ${i < 3 ? style.text : 'text-gray-400'}`}>
                  {i < 3 ? style.icon : `#${i + 1}`}
                </span>
              </div>
              <Avatar name={m.name} rank={i} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-gray-900 text-sm truncate">{m.name}</p>
                  <span className="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">
                    {m[sortBy]}{cat?.unit}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-400">{m.hours}h logged</span>
                  <span className="text-[10px] text-gray-400">{m.tasks} tasks</span>
                  <span className="text-[10px] text-gray-400">{m.activeDays} active days</span>
                </div>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Trophy size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No data yet</p>
            <p className="text-sm mt-1">Team members need to log activities first</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
