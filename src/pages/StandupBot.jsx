import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Smile, Users, ChevronDown, ChevronUp, Send, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const MOOD_OPTIONS = [
  { value: 'excellent', emoji: '😄', label: 'Excellent' },
  { value: 'good',      emoji: '🙂', label: 'Good' },
  { value: 'neutral',   emoji: '😐', label: 'Neutral' },
  { value: 'tired',     emoji: '😴', label: 'Tired' },
  { value: 'stressed',  emoji: '😰', label: 'Stressed' },
];

const MOOD_COLORS = {
  excellent: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  good:      'bg-indigo-100 text-indigo-700 border-indigo-200',
  neutral:   'bg-amber-100 text-amber-700 border-amber-200',
  tired:     'bg-orange-100 text-orange-700 border-orange-200',
  stressed:  'bg-red-100 text-red-700 border-red-200',
};

const Avatar = ({ name }) => {
  const colors = ['bg-indigo-500','bg-emerald-500','bg-pink-500','bg-amber-500','bg-blue-500','bg-purple-500'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-sm font-bold">{name?.charAt(0)?.toUpperCase()}</span>
    </div>
  );
};

const StandupBot = () => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [myStandup, setMyStandup]     = useState(null);
  const [teamStandups, setTeamStandups] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [editing, setEditing]         = useState(false);
  const [expanded, setExpanded]       = useState({});
  const [form, setForm] = useState({ yesterday: '', today: '', blockers: '', mood: 'good', isBlocked: false });

  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  const load = async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const [myRes, teamRes] = await Promise.all([
        api.get(`/teams/${currentTeam._id}/standup/today`),
        api.get(`/teams/${currentTeam._id}/standup`),
      ]);
      const mine = myRes.data?.data;
      setMyStandup(mine);
      if (mine) setForm({ yesterday: mine.yesterday, today: mine.today, blockers: mine.blockers || '', mood: mine.mood, isBlocked: mine.isBlocked });
      setTeamStandups(teamRes.data?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentTeam?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.yesterday.trim() || !form.today.trim()) { toast.error('Please fill in yesterday and today fields'); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/teams/${currentTeam._id}/standup`, form);
      setMyStandup(res.data.data);
      setEditing(false);
      toast.success(myStandup ? 'Standup updated!' : 'Standup submitted!');
      load();
    } catch { toast.error('Failed to submit standup'); }
    finally { setSubmitting(false); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return <LoadingSpinner />;

  const others = teamStandups.filter(s => s.user?._id !== user?._id);
  const blockers = teamStandups.filter(s => s.isBlocked);

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Standup</h1>
            <p className="text-sm text-gray-500">{today} · {currentTeam?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {teamStandups.length > 0 && (
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
              {teamStandups.length}/{currentTeam?.memberCount || '?'} submitted
            </span>
          )}
          {blockers.length > 0 && (
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-full flex items-center gap-1">
              <AlertTriangle size={11} /> {blockers.length} blocked
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — My standup form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">My Standup</h2>
              {myStandup && !editing && (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium">
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>

            {myStandup && !editing ? (
              <div className="p-5 space-y-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${MOOD_COLORS[myStandup.mood]}`}>
                  {MOOD_OPTIONS.find(m => m.value === myStandup.mood)?.emoji} {MOOD_OPTIONS.find(m => m.value === myStandup.mood)?.label}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Yesterday</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{myStandup.yesterday}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{myStandup.today}</p>
                </div>
                {myStandup.blockers && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Blockers</p>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">{myStandup.blockers}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <p className="text-xs text-grayald-500 text-gray-500">Submitted successfully</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Mood */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">How are you feeling?</label>
                  <div className="flex gap-2 flex-wrap">
                    {MOOD_OPTIONS.map(m => (
                      <button key={m.value} type="button" onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.mood === m.value ? MOOD_COLORS[m.value] : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yesterday */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    What did you do yesterday? *
                  </label>
                  <textarea rows={3} value={form.yesterday} onChange={e => setForm(f => ({ ...f, yesterday: e.target.value }))}
                    placeholder="Completed the auth module, reviewed 2 PRs..."
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
                </div>

                {/* Today */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    What will you do today? *
                  </label>
                  <textarea rows={3} value={form.today} onChange={e => setForm(f => ({ ...f, today: e.target.value }))}
                    placeholder="Work on the dashboard refactor, standup at 10am..."
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
                </div>

                {/* Blockers */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    Any blockers?
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="blocked" checked={form.isBlocked}
                      onChange={e => setForm(f => ({ ...f, isBlocked: e.target.checked }))}
                      className="w-4 h-4 rounded accent-red-500" />
                    <label htmlFor="blocked" className="text-sm text-gray-600 font-medium cursor-pointer">I am blocked</label>
                  </div>
                  {form.isBlocked && (
                    <textarea rows={2} value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
                      placeholder="Waiting for API credentials from infra team..."
                      className="w-full border border-red-200 bg-red-50 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200 resize-none" />
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  {editing && (
                    <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                  )}
                  <button type="submit" disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    <Send size={14} />
                    {submitting ? 'Submitting…' : myStandup ? 'Update Standup' : 'Submit Standup'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right — Team standups */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="font-bold text-gray-900 px-1">Team Updates</h2>

          {others.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-400 text-sm">No team standups yet today</p>
              <p className="text-gray-300 text-xs mt-1">Check back after your teammates submit</p>
            </div>
          )}

          {others.map(s => {
            const moodCfg = MOOD_OPTIONS.find(m => m.value === s.mood);
            const isOpen = expanded[s._id];
            return (
              <div key={s._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${s.isBlocked ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleExpand(s._id)}>
                  <Avatar name={s.user?.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{s.user?.name}</p>
                      {s.isBlocked && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle size={9} /> BLOCKED
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${MOOD_COLORS[s.mood] || ''}`}>
                        {moodCfg?.emoji} {moodCfg?.label}
                      </span>
                    </div>
                    {!isOpen && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{s.today}</p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Yesterday</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.yesterday}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.today}</p>
                    </div>
                    {s.blockers && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Blockers</p>
                        <p className="text-sm text-red-700 whitespace-pre-wrap">{s.blockers}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StandupBot;
