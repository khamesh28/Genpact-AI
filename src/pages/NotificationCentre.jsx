import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, Users, FolderOpen, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTeam } from '../context/TeamContext';
import api from '../services/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const TYPE_CONFIG = {
  task_assigned:    { icon: FolderOpen,     color: 'text-indigo-500',  bg: 'bg-indigo-50',  label: 'Task' },
  task_completed:   { icon: CheckCircle,    color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Task' },
  task_overdue:     { icon: AlertTriangle,  color: 'text-red-500',     bg: 'bg-red-50',     label: 'Overdue' },
  sprint_started:   { icon: Calendar,       color: 'text-blue-500',    bg: 'bg-blue-50',    label: 'Sprint' },
  sprint_completed: { icon: Calendar,       color: 'text-purple-500',  bg: 'bg-purple-50',  label: 'Sprint' },
  member_joined:    { icon: Users,          color: 'text-pink-500',    bg: 'bg-pink-50',    label: 'Team' },
  announcement:     { icon: Bell,           color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Announcement' },
  general:          { icon: Info,           color: 'text-gray-500',    bg: 'bg-gray-50',    label: 'Info' },
};

const timeAgo = (ts) => {
  const diff = Date.now() - new Date(ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const FILTERS = ['all', 'unread', 'task', 'sprint', 'team'];

const NotificationCentre = () => {
  const { currentTeam } = useTeam();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/teams/${currentTeam._id}/notifications`);
      setNotifications(res.data?.data || []);
    } catch { toast.error('Could not load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentTeam?._id]);

  const markRead = async (id) => {
    try {
      await api.put(`/teams/${currentTeam._id}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.put(`/teams/${currentTeam._id}/notifications/mark-all-read`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
    finally { setMarkingAll(false); }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/teams/${currentTeam._id}/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { toast.error('Could not delete'); }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'task')   return n.type?.includes('task');
    if (filter === 'sprint') return n.type?.includes('sprint');
    if (filter === 'team')   return n.type?.includes('member') || n.type === 'announcement';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · {notifications.length} total
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">
            <CheckCheck size={15} />
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600">No notifications</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
            const Icon = cfg.icon;
            return (
              <div key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  n.isRead
                    ? 'bg-white border-gray-100 opacity-70 hover:opacity-100'
                    : 'bg-white border-indigo-100 shadow-sm ring-1 ring-indigo-50'
                }`}>

                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={16} className={cfg.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                    {n.title || n.message}
                  </p>
                  {n.message && n.title && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>

                {/* Delete */}
                <button onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationCentre;
