import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTeam } from '../context/TeamContext';
import api from '../services/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const STATUS_CONFIG = {
  'on-track':  { label: 'On Track',  badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  'at-risk':   { label: 'At Risk',   badge: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500'   },
  'off-track': { label: 'Off Track', badge: 'bg-red-100 text-red-700',         dot: 'bg-red-500'     },
  'completed': { label: 'Completed', badge: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500'    },
};

const progress = (kr) => kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
const okrProgress = (okr) => {
  if (!okr.keyResults?.length) return 0;
  return Math.round(okr.keyResults.reduce((s, k) => s + progress(k), 0) / okr.keyResults.length);
};

const BLANK_OKR = { title: '', description: '', quarter: '', status: 'on-track', keyResults: [] };
const BLANK_KR  = { title: '', target: '', current: '0', unit: '' };

const KRRow = ({ kr, okrId, onUpdated, teamId }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(kr.current);
  const [saving, setSaving] = useState(false);
  const pct = progress(kr);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/teams/${teamId}/okr/${okrId}/key-results/${kr._id}`, { current: Number(val) });
      onUpdated(res.data.data);
      setEditing(false);
      toast.success('Progress updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-gray-700 font-medium truncate">{kr.title}</p>
          {editing ? (
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <input
                type="number"
                value={val}
                onChange={e => setVal(e.target.value)}
                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <span className="text-xs text-gray-400">/ {kr.target}{kr.unit ? ` ${kr.unit}` : ''}</span>
              <button onClick={save} disabled={saving} className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"><Check size={11} /></button>
              <button onClick={() => { setEditing(false); setVal(kr.current); }} className="p-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300"><X size={11} /></button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="ml-2 text-xs text-gray-400 hover:text-indigo-500 flex-shrink-0 flex items-center gap-1">
              <span className="font-semibold text-gray-700">{kr.current}/{kr.target}{kr.unit ? ` ${kr.unit}` : ''}</span>
              <Edit2 size={10} />
            </button>
          )}
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-blue-500' : pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] font-bold text-gray-400 w-8 text-right flex-shrink-0">{pct}%</span>
    </div>
  );
};

const OKRTracker = () => {
  const { currentTeam } = useTeam();
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_OKR);
  const [krForm, setKrForm] = useState(BLANK_KR);
  const [saving, setSaving] = useState(false);

  const teamId = currentTeam?._id;

  const load = async () => {
    if (!teamId) return;
    try {
      const res = await api.get(`/teams/${teamId}/okr`);
      setOkrs(res.data?.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [teamId]);

  const addKR = () => {
    if (!krForm.title.trim() || !krForm.target) return toast.error('KR title and target are required');
    setForm(f => ({ ...f, keyResults: [...f.keyResults, { ...krForm, target: Number(krForm.target), current: Number(krForm.current) }] }));
    setKrForm(BLANK_KR);
  };

  const removeKR = (i) => setForm(f => ({ ...f, keyResults: f.keyResults.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Objective title is required');
    if (!form.keyResults.length) return toast.error('Add at least one key result');
    setSaving(true);
    try {
      const res = await api.post(`/teams/${teamId}/okr`, form);
      setOkrs(prev => [res.data.data, ...prev]);
      setShowForm(false);
      setForm(BLANK_OKR);
      toast.success('OKR created!');
    } catch { toast.error('Failed to create OKR'); }
    finally { setSaving(false); }
  };

  const deleteOkr = async (id) => {
    if (!window.confirm('Delete this OKR?')) return;
    try {
      await api.delete(`/teams/${teamId}/okr/${id}`);
      setOkrs(prev => prev.filter(o => o._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleKRUpdated = (updatedOkr) => {
    setOkrs(prev => prev.map(o => o._id === updatedOkr._id ? updatedOkr : o));
  };

  const QUARTERS = ['Q1 2026','Q2 2026','Q3 2026','Q4 2026'];

  const avgProgress = okrs.length
    ? Math.round(okrs.reduce((s, o) => s + okrProgress(o), 0) / okrs.length)
    : 0;
  const onTrack = okrs.filter(o => o.status === 'on-track' || o.status === 'completed').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OKR Tracker</h1>
            <p className="text-sm text-gray-500">Objectives & Key Results · {currentTeam?.name}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700">
          <Plus size={15} /> New Objective
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total OKRs',    value: okrs.length,   color: 'bg-gray-900'   },
          { label: 'Avg Progress',  value: `${avgProgress}%`, color: 'bg-indigo-500' },
          { label: 'On Track',      value: onTrack,        color: 'bg-emerald-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-5">New Objective</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Objective *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Improve customer satisfaction score"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Quarter</label>
                <select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                  <option value="">No quarter</option>
                  {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional context for this objective"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
            </div>

            {/* Key Results */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Key Results</label>
              {form.keyResults.map((kr, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="flex-1 text-sm text-gray-700">{kr.title} — <strong>0/{kr.target}{kr.unit ? ` ${kr.unit}` : ''}</strong></span>
                  <button type="button" onClick={() => removeKR(i)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 mt-2">
                <input value={krForm.title} onChange={e => setKrForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Key result title" className="col-span-6 border border-dashed border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                <input type="number" value={krForm.target} onChange={e => setKrForm(f => ({ ...f, target: e.target.value }))}
                  placeholder="Target" className="col-span-2 border border-dashed border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                <input value={krForm.unit} onChange={e => setKrForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="Unit (%, pts…)" className="col-span-3 border border-dashed border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                <button type="button" onClick={addKR} className="col-span-1 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200">
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setForm(BLANK_OKR); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Creating…' : 'Create OKR'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OKR cards */}
      {okrs.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Target size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-600">No OKRs yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "New Objective" to set your first goal</p>
        </div>
      )}

      <div className="space-y-4">
        {okrs.map(okr => {
          const pct = okrProgress(okr);
          const cfg = STATUS_CONFIG[okr.status] || STATUS_CONFIG['on-track'];
          const isOpen = expanded[okr._id];
          return (
            <div key={okr._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 cursor-pointer" onClick={() => setExpanded(p => ({ ...p, [okr._id]: !p[okr._id] }))}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900">{okr.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      {okr.quarter && <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{okr.quarter}</span>}
                    </div>
                    {okr.description && <p className="text-xs text-gray-500 mb-2">{okr.description}</p>}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-blue-500' : pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-700 flex-shrink-0">{pct}%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{okr.keyResults?.length || 0} key results · by {okr.owner?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); deleteOkr(okr._id); }} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
              </div>

              {isOpen && okr.keyResults?.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-3 space-y-0.5">
                  {okr.keyResults.map(kr => (
                    <KRRow key={kr._id} kr={kr} okrId={okr._id} teamId={teamId} onUpdated={handleKRUpdated} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OKRTracker;
