import React, { useState, useEffect } from 'react';
import { Target, Clock, CheckSquare, AlertTriangle, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import activityService from '../services/activityService';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low:    'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_COLORS = {
  todo:        'bg-gray-100 text-gray-600',
  'in-progress':'bg-indigo-100 text-indigo-700',
  done:        'bg-emerald-100 text-emerald-700',
  blocked:     'bg-red-100 text-red-700',
};

const timeAgo = (ts) => {
  const diff = Date.now() - new Date(ts);
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1)  return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();
const isDueToday = (dueDate) => {
  if (!dueDate) return false;
  const d = new Date(dueDate); const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={16} className="text-white" />
    </div>
    <div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </div>
);

const TodaysPriorities = () => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [activity, setActivity] = useState(null);
  const [standup, setStandup]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  useEffect(() => {
    if (!currentTeam?._id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [actRes, standupRes] = await Promise.all([
          activityService.getActivityByDate(todayStr),
          api.get(`/teams/${currentTeam._id}/standup/today`).catch(() => ({ data: { data: null } })),
        ]);
        setActivity(actRes?.data || null);
        setStandup(standupRes.data?.data || null);

        // Get tasks assigned to me that are todo/in-progress or overdue
        const taskRes = await api.get(`/teams/${currentTeam._id}/admin/history`, {
          params: { limit: 50 }
        }).catch(() => ({ data: { data: [] } }));

        // fallback — get tasks from projects
        const projectsRes = await api.get(`/teams/${currentTeam._id}/projects`).catch(() => ({ data: { data: [] } }));
        const projects = projectsRes.data?.data || [];

        let allTasks = [];
        for (const p of projects) {
          const tRes = await api.get(`/teams/${currentTeam._id}/projects/${p._id}/tasks`)
            .catch(() => ({ data: { data: [] } }));
          allTasks = [...allTasks, ...(tRes.data?.data || [])];
        }

        // Filter to tasks assigned to me
        const myTasks = allTasks.filter(t => {
          const assigneeId = t.assignedTo?._id || t.assignedTo;
          return String(assigneeId) === String(user?._id);
        });

        const relevant = myTasks.filter(t =>
          ['todo','in-progress','blocked'].includes(t.status) ||
          isOverdue(t.dueDate) || isDueToday(t.dueDate)
        ).sort((a, b) => {
          const pa = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (pa[b.priority] || 0) - (pa[a.priority] || 0);
        });
        setTasks(relevant);
      } catch(e) {}
      finally { setLoading(false); }
    };
    load();
  }, [currentTeam?._id]);

  if (loading) return <LoadingSpinner />;

  const todayMeetings = activity?.meetings || [];
  const todayTasksLogged = activity?.tasks || [];
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'done');
  const dueTodayTasks = tasks.filter(t => isDueToday(t.dueDate));
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Priorities</h1>
          <p className="text-sm text-gray-500">{todayLabel}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Overdue" value={overdueTasks.length} color="bg-red-500" icon={AlertTriangle} />
        <StatCard label="Due Today" value={dueTodayTasks.length} color="bg-amber-500" icon={Clock} />
        <StatCard label="In Progress" value={inProgressTasks.length} color="bg-indigo-500" icon={CheckSquare} />
        <StatCard label="Meetings Today" value={todayMeetings.length} color="bg-emerald-500" icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Tasks */}
        <div className="lg:col-span-2 space-y-5">

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-500" />
                <h3 className="font-bold text-red-600 text-sm uppercase tracking-wide">Overdue</h3>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{overdueTasks.length}</span>
              </div>
              <div className="space-y-2">
                {overdueTasks.map(t => (
                  <div key={t._id} className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{t.title}</p>
                        <p className="text-xs text-red-500 mt-0.5">Due {new Date(t.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                    </div>
                    {t.project?.name && <p className="text-[10px] text-gray-400 mt-2">{t.project.name}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due today */}
          {dueTodayTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-amber-500" />
                <h3 className="font-bold text-amber-600 text-sm uppercase tracking-wide">Due Today</h3>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{dueTodayTasks.length}</span>
              </div>
              <div className="space-y-2">
                {dueTodayTasks.map(t => (
                  <div key={t._id} className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{t.title}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In progress */}
          {inProgressTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare size={14} className="text-indigo-500" />
                <h3 className="font-bold text-indigo-600 text-sm uppercase tracking-wide">In Progress</h3>
              </div>
              <div className="space-y-2">
                {inProgressTasks.map(t => (
                  <div key={t._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{t.title}</p>
                        {t.project?.name && <p className="text-[10px] text-gray-400 mt-0.5">{t.project.name}</p>}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">You're all clear!</p>
              <p className="text-sm text-gray-400 mt-1">No overdue or upcoming tasks</p>
            </div>
          )}
        </div>

        {/* Right — Today's log + standup */}
        <div className="space-y-4">

          {/* Today's meetings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={15} className="text-emerald-500" /> Today's Meetings
            </h3>
            {todayMeetings.length === 0 ? (
              <p className="text-sm text-gray-400">No meetings logged yet today</p>
            ) : (
              <div className="space-y-2">
                {todayMeetings.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                      <p className="text-xs text-gray-400">{m.duration} min</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Standup status */}
          <div className={`rounded-2xl border p-5 ${standup ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              {standup ? <CheckCircle2 size={15} className="text-emerald-500" /> : <AlertTriangle size={15} className="text-amber-500" />}
              Daily Standup
            </h3>
            {standup ? (
              <>
                <p className="text-sm text-emerald-700 font-medium">Submitted ✓</p>
                <p className="text-xs text-emerald-600 mt-1 line-clamp-2">{standup.today}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-amber-700 font-medium">Not submitted yet</p>
                <a href={`/teams/${currentTeam?._id}/standup`}
                  className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900">
                  Submit now <ArrowRight size={11} />
                </a>
              </>
            )}
          </div>

          {/* Today's logged tasks */}
          {todayTasksLogged.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Logged Today</h3>
              <div className="space-y-1.5">
                {todayTasksLogged.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-gray-700 truncate">{t.title}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{t.timeSpent}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaysPriorities;
