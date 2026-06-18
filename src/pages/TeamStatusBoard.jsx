import React, { useState, useEffect } from 'react';
import { MapPin, Home, Plane, Sun, Clock, Edit2, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const STATUS_CONFIG = {
  office:    { label: 'In Office',  icon: MapPin,  bg: 'bg-blue-50',    border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',    emoji: '🏢' },
  wfh:       { label: 'WFH',        icon: Home,    bg: 'bg-emerald-50', border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500', emoji: '🏠' },
  ooo:       { label: 'Out of Office',icon: Sun,   bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',   emoji: '🌴' },
  'half-day':{ label: 'Half Day',   icon: Clock,   bg: 'bg-purple-50',  border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500',  emoji: '⏰' },
  travel:    { label: 'Travelling', icon: Plane,   bg: 'bg-pink-50',    border: 'border-pink-200',   badge: 'bg-pink-100 text-pink-700',     dot: 'bg-pink-500',    emoji: '✈️' },
};

const Avatar = ({ name, status }) => {
  const colors = ['bg-indigo-500','bg-emerald-500','bg-pink-500','bg-amber-500','bg-blue-500','bg-purple-500'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const dot = STATUS_CONFIG[status]?.dot || 'bg-gray-300';
  return (
    <div className="relative">
      <div className={`w-11 h-11 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold">{name?.charAt(0)?.toUpperCase()}</span>
      </div>
      <span className={`absolute bottom-0 right-0 w-3 h-3 ${dot} rounded-full border-2 border-white`} />
    </div>
  );
};

const TeamStatusBoard = () => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [statuses, setStatuses]     = useState([]);
  const [myStatus, setMyStatus]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ status: 'office', note: '' });
  const [filter, setFilter]         = useState('all');

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const load = async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/teams/${currentTeam._id}/team-status`);
      const data = res.data?.data || [];
      setStatuses(data);
      const mine = data.find(s => s.user?._id === user?._id);
      setMyStatus(mine || null);
      if (mine) setForm({ status: mine.status, note: mine.note || '' });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentTeam?._id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/teams/${currentTeam._id}/team-status`, form);
      setMyStatus(res.data.data);
      setEditing(false);
      toast.success('Status updated!');
      load();
    } catch { toast.error('Failed to update status'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  const filtered = filter === 'all' ? statuses : statuses.filter(s => s.status === filter);
  const counts = Object.keys(STATUS_CONFIG).reduce((acc, k) => ({ ...acc, [k]: statuses.filter(s => s.status === k).length }), {});

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Status</h1>
            <p className="text-sm text-gray-500">{today} · {statuses.length} updated</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700">
            <Edit2 size={14} /> Update My Status
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
              <Check size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* My status editor */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Where are you today?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button key={key} onClick={() => setForm(f => ({ ...f, status: key }))}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${form.status === key ? `${cfg.bg} ${cfg.border} ${cfg.badge.split(' ')[1]}` : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                <span className="text-xl">{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>
          <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Optional note — e.g. Back at 2pm, Doctor appointment..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
      )}

      {/* Summary pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          All · {statuses.length}
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => counts[key] > 0 && (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === key ? `${cfg.badge}` : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {cfg.emoji} {cfg.label} · {counts[key]}
          </button>
        ))}
      </div>

      {/* Team grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">📍</p>
          <p className="font-semibold text-gray-600">No statuses set yet</p>
          <p className="text-sm text-gray-400 mt-1">Team members haven't updated their status today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(s => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.office;
            const isMe = s.user?._id === user?._id;
            return (
              <div key={s._id} className={`rounded-2xl border p-4 flex items-center gap-3 ${cfg.bg} ${cfg.border} ${isMe ? 'ring-1 ring-gray-300' : ''}`}>
                <Avatar name={s.user?.name} status={s.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm">{s.user?.name}</p>
                    {isMe && <span className="text-[10px] font-bold text-gray-400">(you)</span>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  {s.note && <p className="text-xs text-gray-500 mt-1 truncate">{s.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Members with no status */}
      {statuses.length === 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-700 font-medium">No team members have set their status today yet.</p>
          <p className="text-xs text-amber-500 mt-0.5">Click "Update My Status" to be the first!</p>
        </div>
      )}
    </div>
  );
};

export default TeamStatusBoard;
