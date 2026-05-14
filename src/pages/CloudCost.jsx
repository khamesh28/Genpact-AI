import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Cloud, DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Server, Database, Shield, Zap, Globe, Activity, RefreshCw,
} from 'lucide-react';

// ─── mock data ────────────────────────────────────────────────────────────────

const MONTHLY_TREND = [
  { month: 'Dec', spend: 3200 }, { month: 'Jan', spend: 3800 },
  { month: 'Feb', spend: 3500 }, { month: 'Mar', spend: 4100 },
  { month: 'Apr', spend: 3900 }, { month: 'May', spend: 4347 },
];

const SERVICES = [
  { name: 'Azure Virtual Machines',  icon: Server,   spend: 1420, budget: 1600, color: '#0078d4', trend: +8,  category: 'Compute'  },
  { name: 'Azure SQL Database',      icon: Database,  spend: 680,  budget: 800,  color: '#00a4ef', trend: -3,  category: 'Database' },
  { name: 'Azure Blob Storage',      icon: Cloud,     spend: 310,  budget: 400,  color: '#50e6ff', trend: +12, category: 'Storage'  },
  { name: 'Azure Active Directory',  icon: Shield,    spend: 220,  budget: 250,  color: '#6264a7', trend: 0,   category: 'Identity' },
  { name: 'Azure Functions',         icon: Zap,       spend: 190,  budget: 300,  color: '#ffb900', trend: +5,  category: 'Compute'  },
  { name: 'Azure CDN',               icon: Globe,     spend: 145,  budget: 200,  color: '#e81123', trend: -1,  category: 'Network'  },
  { name: 'Azure Monitor',           icon: Activity,  spend: 98,   budget: 150,  color: '#10893e', trend: +2,  category: 'Monitor'  },
  { name: 'Azure DevOps',            icon: RefreshCw, spend: 284,  budget: 300,  color: '#8764b8', trend: +1,  category: 'DevOps'   },
];

const PIE_DATA = [
  { name: 'Compute',  value: 1610, color: '#0078d4' },
  { name: 'Database', value: 680,  color: '#00a4ef' },
  { name: 'Storage',  value: 310,  color: '#50e6ff' },
  { name: 'Identity', value: 220,  color: '#6264a7' },
  { name: 'Network',  value: 145,  color: '#e81123' },
  { name: 'Other',    value: 382,  color: '#8764b8' },
];

const DAILY_SPEND = [
  { day: 'Mon', cost: 142 }, { day: 'Tue', cost: 158 }, { day: 'Wed', cost: 135 },
  { day: 'Thu', cost: 167 }, { day: 'Fri', cost: 145 }, { day: 'Sat', cost: 89 },
  { day: 'Sun', cost: 71  },
];

const TOTAL_SPEND   = 4347;
const TOTAL_BUDGET  = 5000;
const BUDGET_USED   = Math.round((TOTAL_SPEND / TOTAL_BUDGET) * 100);
const ALERTS        = SERVICES.filter(s => s.spend / s.budget > 0.9).length;

// ─── sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color, alert }) => (
  <div className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${alert ? 'border-red-200' : 'border-gray-100'}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const BudgetBar = ({ spend, budget }) => {
  const pct = Math.min((spend / budget) * 100, 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>${spend.toLocaleString()}</span>
        <span>${budget.toLocaleString()}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── main page ────────────────────────────────────────────────────────────────

const CloudCost = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Compute', 'Database', 'Storage', 'Network', 'Other'];
  const filtered = activeCategory === 'All' ? SERVICES : SERVICES.filter(s => s.category === activeCategory);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cloud & Cost Monitor</h1>
            <p className="text-sm text-gray-500">Azure infrastructure spend — May 2026</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign}    label="Total Spend"     value={`$${TOTAL_SPEND.toLocaleString()}`} sub="this month"           color="bg-gray-900" />
        <StatCard icon={TrendingUp}    label="Budget Used"     value={`${BUDGET_USED}%`}                  sub={`of $${TOTAL_BUDGET.toLocaleString()} budget`} color="bg-blue-600" />
        <StatCard icon={Server}        label="Active Services" value={SERVICES.length}                    sub="across Azure"         color="bg-indigo-500" />
        <StatCard icon={AlertTriangle} label="Cost Alerts"     value={ALERTS}                             sub="nearing budget"       color="bg-red-500" alert={ALERTS > 0} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-1">Monthly Spend Trend</h2>
          <p className="text-xs text-gray-400 mb-4">6-month rolling view</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_TREND} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Spend']} />
              <Bar dataKey="spend" fill="#111827" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-1">Spend by Category</h2>
          <p className="text-xs text-gray-400 mb-4">Current month</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {PIE_DATA.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily spend this week */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-bold text-gray-800 mb-1">Daily Spend — This Week</h2>
        <p className="text-xs text-gray-400 mb-4">Average per day: ${Math.round(DAILY_SPEND.reduce((a, d) => a + d.cost, 0) / 7)}</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={DAILY_SPEND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={v => [`$${v}`, 'Daily Cost']} />
            <Line type="monotone" dataKey="cost" stroke="#0078d4" strokeWidth={2.5} dot={{ r: 4, fill: '#0078d4' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Service breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-gray-800">Service Breakdown</h2>
            <p className="text-xs text-gray-400">Budget utilization per service</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${activeCategory === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(svc => {
            const Icon = svc.icon;
            const pct = Math.round((svc.spend / svc.budget) * 100);
            const overBudget = pct >= 90;
            return (
              <div key={svc.name} className={`border rounded-xl p-4 ${overBudget ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: svc.color + '20' }}>
                      <Icon size={18} style={{ color: svc.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                      <span className="text-[10px] font-medium text-gray-400 uppercase">{svc.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{pct}%</p>
                    {svc.trend !== 0 && (
                      <p className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${svc.trend > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {svc.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(svc.trend)}%
                      </p>
                    )}
                  </div>
                </div>
                <BudgetBar spend={svc.spend} budget={svc.budget} />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default CloudCost;
