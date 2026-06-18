import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Users, Briefcase, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import api from '../services/api';
import projectService from '../services/projectService';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const roleColor = (role) => {
  const map = {
    admin:   { bg: 'bg-red-100',    text: 'text-red-700'    },
    manager: { bg: 'bg-purple-100', text: 'text-purple-700' },
    Manager: { bg: 'bg-purple-100', text: 'text-purple-700' },
    owner:   { bg: 'bg-amber-100',  text: 'text-amber-700'  },
    sme:     { bg: 'bg-cyan-100',   text: 'text-cyan-700'   },
    member:  { bg: 'bg-green-100',  text: 'text-green-700'  },
    Member:  { bg: 'bg-green-100',  text: 'text-green-700'  },
    viewer:  { bg: 'bg-gray-100',   text: 'text-gray-500'   },
  };
  return map[role] || map.viewer;
};

const allocationColor = (pct) => {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-400';
  if (pct >= 40) return 'bg-green-500';
  return 'bg-blue-400';
};

const Avatar = ({ name, size = 9 }) => (
  <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-gray-600 to-gray-900 flex items-center justify-center flex-shrink-0`}>
    <span className="text-white text-sm font-bold">{name?.charAt(0)?.toUpperCase() || '?'}</span>
  </div>
);

const seedColor = (name = '') => {
  const palette = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#0ea5e9','#ef4444','#14b8a6'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
};

const ResourceAllocation = () => {
  const { currentTeam } = useTeam();
  const [enriched, setEnriched]     = useState([]);
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [filterRole, setFilterRole] = useState('All');

  useEffect(() => {
    if (!currentTeam?._id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [compRes, projRes] = await Promise.all([
          api.get(`/teams/${currentTeam._id}/admin/comparison`),
          projectService.getProjects(currentTeam._id),
        ]);

        const members = compRes.data?.data?.members || [];
        const allProjects = projRes.data || [];
        setProjects(allProjects);

        // Build userId → Set<projectId> map from actual task assignments
        const userProjectMap = {};
        const projectMap = {};
        allProjects.forEach(p => { projectMap[p._id] = p; });

        // Fetch tasks for each project (up to 5 projects to keep it fast)
        const projectsToQuery = allProjects.slice(0, 5);
        await Promise.all(
          projectsToQuery.map(async (p) => {
            try {
              const tRes = await api.get(`/teams/${currentTeam._id}/projects/${p._id}/tasks`, {
                params: { limit: 100 }
              });
              const tasks = tRes.data?.data || [];
              tasks.forEach(t => {
                const uid = t.assignedTo?._id || t.assignedTo;
                if (!uid) return;
                const uidStr = String(uid);
                if (!userProjectMap[uidStr]) userProjectMap[uidStr] = new Set();
                userProjectMap[uidStr].add(p._id);
              });
            } catch {}
          })
        );

        // Enrich each member with real allocation % and real assigned projects
        const result = members.map(m => {
          const stats = m.stats || {};
          // Allocation based on actual avg hours vs 8h standard workday; floor at 5 if they have any activity
          const rawAlloc = stats.avgHoursPerDay > 0
            ? Math.min(100, Math.round((stats.avgHoursPerDay / 8) * 100))
            : 0;
          const allocation = rawAlloc;

          const assignedProjectIds = userProjectMap[String(m.userId)] || new Set();
          const assignedProjects = [...assignedProjectIds]
            .map(pid => projectMap[pid])
            .filter(Boolean);

          return { ...m, allocation, assignedProjects };
        });

        setEnriched(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentTeam?._id]);

  const roles = ['All', ...new Set(enriched.map(m => m.role).filter(Boolean))];
  const filtered = filterRole === 'All' ? enriched : enriched.filter(m => m.role === filterRole);

  const avgAllocation = enriched.length
    ? Math.round(enriched.reduce((a, m) => a + m.allocation, 0) / enriched.length)
    : 0;
  const overloaded    = enriched.filter(m => m.allocation >= 90).length;

  const chartData = enriched.map(m => ({
    name: m.name?.split(' ')[0] || 'User',
    allocation: m.allocation,
    color: seedColor(m.name),
  }));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resource Allocation</h1>
            <p className="text-sm text-gray-500">Team workload based on logged hours (last 30 days)</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users,       label: 'Team Members',   value: enriched.length,  sub: 'total headcount',   color: 'bg-gray-900'   },
          { icon: TrendingUp,  label: 'Avg Allocation', value: `${avgAllocation}%`, sub: 'across team',    color: 'bg-indigo-500' },
          { icon: AlertCircle, label: 'Overloaded',     value: overloaded,       sub: '≥ 90% allocated',   color: 'bg-red-500'    },
          { icon: Briefcase,   label: 'Active Projects',value: projects.length,  sub: 'in this team',      color: 'bg-emerald-500'},
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Allocation chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-bold text-gray-800 mb-1">Team Allocation Overview</h2>
        <p className="text-xs text-gray-400 mb-5">% of standard 8h workday used (based on logged hours)</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={v => [`${v}%`, 'Allocation']} />
              <Bar dataKey="allocation" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No members yet</div>
        )}
      </div>

      {/* Member table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-gray-800">Member Breakdown</h2>
            <p className="text-xs text-gray-400">Click a member to see project assignments</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {roles.map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filterRole === r ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No members found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => {
              const rc = roleColor(m.role);
              const isOpen = expanded === m.userId;
              return (
                <div key={m.userId} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpanded(isOpen ? null : m.userId)}
                  >
                    <Avatar name={m.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${rc.bg} ${rc.text}`}>
                          {m.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {m.stats?.activeDays || 0} active days · {m.stats?.totalTasks || 0} tasks · {m.stats?.avgHoursPerDay || 0}h/day avg
                      </p>
                    </div>

                    {/* Allocation bar */}
                    <div className="w-40 hidden sm:block">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Allocation</span>
                        <span className={`font-bold ${m.allocation >= 90 ? 'text-red-500' : 'text-gray-700'}`}>
                          {m.allocation}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${allocationColor(m.allocation)}`}
                          style={{ width: `${m.allocation}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-gray-400 hidden md:block">
                        {m.assignedProjects.length} project{m.assignedProjects.length !== 1 ? 's' : ''}
                      </span>
                      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex gap-6 mb-3 text-xs text-gray-500">
                        <span>Total hours: <strong className="text-gray-800">{m.stats?.totalHours || 0}h</strong></span>
                        <span>Tasks completed: <strong className="text-gray-800">{m.stats?.completedTasks || 0}/{m.stats?.totalTasks || 0}</strong></span>
                        <span>Avg productivity: <strong className="text-gray-800">{m.stats?.avgProductivity || 0}%</strong></span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assigned Projects</p>
                      {m.assignedProjects.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No project tasks found</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {m.assignedProjects.map(p => (
                            <div key={p._id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || seedColor(p.name) }} />
                              <span className="text-xs font-medium text-gray-700">{p.name}</span>
                              <span className="text-[10px] text-gray-400 capitalize">{p.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceAllocation;
