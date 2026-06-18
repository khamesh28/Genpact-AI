import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, RefreshCw, ExternalLink, AlertTriangle,
  ChevronDown, ChevronUp, Plug, Shield, Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';

// ─── Microsoft 365 service brand colours ─────────────────────────────────────
const CONNECTORS = [
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'Communication',
    description: 'Sync team meetings, channels, and calendar events directly into your worklog and dashboard.',
    pulls: ['Meeting schedule & attendees', 'Channel activity feed', 'Calendar events → Daily worklog', 'Call duration logs'],
    authType: 'OAuth 2.0',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="8" fill="#5059C9"/>
        <path d="M30 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="#fff"/>
        <path d="M33 18h-6a3 3 0 0 0-3 3v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9a3 3 0 0 0-3-3z" fill="#fff"/>
        <path d="M20 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#7B83EB"/>
        <path d="M23 22h-6a2 2 0 0 0-2 2v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7a2 2 0 0 0-2-2z" fill="#7B83EB"/>
      </svg>
    ),
    color: '#5059C9',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    category: 'Productivity',
    description: 'Pull calendar events and meeting invites to auto-populate your daily activity log.',
    pulls: ['Calendar events → meeting entries', 'Meeting duration auto-fill', 'Recurring event detection', 'Out-of-office awareness'],
    authType: 'OAuth 2.0',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="8" fill="#0078D4"/>
        <rect x="10" y="12" width="28" height="24" rx="3" fill="#fff"/>
        <rect x="10" y="12" width="28" height="7" rx="3" fill="#0078D4"/>
        <rect x="10" y="16" width="28" height="3" fill="#0078D4"/>
        <circle cx="18" cy="27" r="2" fill="#0078D4"/>
        <circle cx="24" cy="27" r="2" fill="#0078D4"/>
        <circle cx="30" cy="27" r="2" fill="#0078D4"/>
        <circle cx="18" cy="32" r="2" fill="#0078D4"/>
        <circle cx="24" cy="32" r="2" fill="#0078D4"/>
      </svg>
    ),
    color: '#0078D4',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    category: 'Collaboration',
    description: 'Connect SharePoint sites to pull project documents, resource sheets, and team wikis.',
    pulls: ['Project document libraries', 'Resource allocation sheets', 'Project status lists', 'Team wiki pages'],
    authType: 'Service Account / OAuth',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="8" fill="#036C70"/>
        <circle cx="20" cy="24" r="10" fill="#1A9BA1"/>
        <circle cx="28" cy="24" r="10" fill="#37C6D0" fillOpacity="0.8"/>
        <circle cx="24" cy="24" r="7" fill="#fff" fillOpacity="0.3"/>
        <text x="17" y="28" fontSize="11" fontWeight="bold" fill="#fff">SP</text>
      </svg>
    ),
    color: '#036C70',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  {
    id: 'excel',
    name: 'Excel Online',
    category: 'Data',
    description: 'Sync Excel workbooks for cloud cost tracking, resource allocation, and project budgets.',
    pulls: ['Cloud cost workbooks → Cost Monitor', 'Resource allocation sheets', 'Project budget trackers', 'Sprint velocity data'],
    authType: 'OAuth 2.0',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="8" fill="#217346"/>
        <rect x="8" y="10" width="20" height="28" rx="2" fill="#185C37"/>
        <rect x="20" y="14" width="20" height="20" rx="2" fill="#33C481"/>
        <path d="M14 18l4 8-4 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
        <path d="M26 22h8M26 26h8M26 30h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#217346',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    category: 'Analytics',
    description: 'Embed Power BI dashboards for real-time cloud cost analytics and team productivity reports.',
    pulls: ['Cloud cost dashboards', 'Resource utilisation reports', 'Sprint burndown embeds', 'Executive summary reports'],
    authType: 'Service Principal',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="8" fill="#F2C811"/>
        <rect x="10" y="28" width="6" height="12" rx="1" fill="#333"/>
        <rect x="19" y="20" width="6" height="20" rx="1" fill="#333"/>
        <rect x="28" y="14" width="6" height="26" rx="1" fill="#333"/>
        <rect x="37" y="8" width="6" height="32" rx="1" fill="#333"/>
      </svg>
    ),
    color: '#F2C811',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    category: 'Storage',
    description: 'Access OneDrive files for project attachments, reports, and shared documents.',
    pulls: ['Project file attachments', 'Report exports storage', 'Shared document access', 'Auto-backup activity reports'],
    authType: 'OAuth 2.0',
    icon: (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
        <rect width="48" height="48" rx="8" fill="#0364B8"/>
        <path d="M8 30a8 8 0 0 1 7-8 10 10 0 0 1 18 2 6 6 0 0 1-1 12H8z" fill="#fff"/>
        <path d="M26 24a6 6 0 0 1 6-2 6 6 0 0 1 6 6H26z" fill="#CBE4F9"/>
      </svg>
    ),
    color: '#0364B8',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
];

const STORAGE_KEY = 'wt_connectors';

const loadState = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

const saveState = (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
};

// ─── sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  if (status === 'connected')
    return <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full"><CheckCircle size={12} /> Connected</span>;
  if (status === 'syncing')
    return <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full"><RefreshCw size={12} className="animate-spin" /> Syncing…</span>;
  if (status === 'error')
    return <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full"><XCircle size={12} /> Error</span>;
  return <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"><XCircle size={12} /> Not connected</span>;
};

// ─── main component ───────────────────────────────────────────────────────────

const Connectors = () => {
  const [connState, setConnState] = useState(loadState);
  const [expanded, setExpanded] = useState(null);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => { saveState(connState); }, [connState]);

  const getStatus = (id) => connState[id]?.status || 'disconnected';
  const getLastSync = (id) => connState[id]?.lastSync || null;

  const handleConnect = (connector) => {
    setConnecting(connector.id);
    setConnState(prev => ({ ...prev, [connector.id]: { status: 'syncing', lastSync: null } }));

    // Simulate OAuth / handshake delay
    setTimeout(() => {
      setConnState(prev => ({
        ...prev,
        [connector.id]: { status: 'connected', lastSync: new Date().toISOString() },
      }));
      setConnecting(null);
      toast.success(`${connector.name} connected successfully`);
    }, 2200);
  };

  const handleDisconnect = (connector) => {
    setConnState(prev => {
      const next = { ...prev };
      delete next[connector.id];
      return next;
    });
    toast.info(`${connector.name} disconnected`);
  };

  const handleSync = (connector) => {
    setConnState(prev => ({ ...prev, [connector.id]: { ...prev[connector.id], status: 'syncing' } }));
    setTimeout(() => {
      setConnState(prev => ({
        ...prev,
        [connector.id]: { status: 'connected', lastSync: new Date().toISOString() },
      }));
      toast.success(`${connector.name} synced`);
    }, 1800);
  };

  const connected = CONNECTORS.filter(c => getStatus(c.id) === 'connected').length;
  const categories = [...new Set(CONNECTORS.map(c => c.category))];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 bg-gray-50 min-h-screen">

      {/* Demo Mode Banner */}
      <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Demo Mode</strong> — OAuth flows are simulated. To enable real Microsoft 365 integration, configure your Azure AD app credentials in the backend environment.
        </p>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Plug className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Connectors</h1>
            <p className="text-sm text-gray-500">Connect your Microsoft 365 tenant to pull live data into the portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-sm font-semibold text-gray-700">{connected} / {CONNECTORS.length} connected</span>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-8 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Placeholder Integration — OAuth / Service Account</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Connect your Microsoft 365 tenant via OAuth 2.0 or a service account below. Once connected, the portal will pull live project data, resource sheets, cloud cost workbooks, and calendar events. All data is read-only and governed by your tenant's permission model.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Connectors',   value: CONNECTORS.length, icon: Plug,          color: 'bg-gray-900'    },
          { label: 'Connected',          value: connected,          icon: CheckCircle,   color: 'bg-green-600'   },
          { label: 'Not Connected',      value: CONNECTORS.length - connected, icon: XCircle, color: 'bg-gray-400' },
          { label: 'Data Categories',    value: categories.length,  icon: RefreshCw,     color: 'bg-indigo-500'  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Connector cards */}
      <div className="space-y-4">
        {CONNECTORS.map(connector => {
          const status = getStatus(connector.id);
          const lastSync = getLastSync(connector.id);
          const isConnected = status === 'connected';
          const isSyncing = status === 'syncing';
          const isOpen = expanded === connector.id;

          return (
            <div
              key={connector.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                isConnected ? 'border-gray-200' : 'border-gray-100'
              }`}
            >
              {/* Main row */}
              <div className="flex items-center gap-5 p-5 flex-wrap">

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${connector.bg} border ${connector.border}`}>
                  {connector.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-gray-900">{connector.name}</p>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">
                      {connector.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{connector.description}</p>
                  {lastSync && (
                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={10} /> Last synced {new Date(lastSync).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Auth type */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 flex-shrink-0">
                  <Shield size={12} />
                  {connector.authType}
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  <StatusBadge status={status} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isConnected && (
                    <button
                      onClick={() => handleSync(connector)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sync now"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(connector)}
                      className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(connector)}
                      disabled={isSyncing || connecting === connector.id}
                      className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2"
                    >
                      {isSyncing ? (
                        <><RefreshCw size={14} className="animate-spin" /> Connecting…</>
                      ) : (
                        <><ExternalLink size={14} /> Connect</>
                      )}
                    </button>
                  )}

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : connector.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div className={`border-t border-gray-100 px-5 py-4 ${connector.bg}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* What gets pulled */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Data this connector pulls</p>
                      <ul className="space-y-2">
                        {connector.pulls.map(item => (
                          <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Setup instructions */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">How to connect</p>
                      <ol className="space-y-2 text-sm text-gray-700 list-none">
                        {connector.authType === 'Service Principal' ? (
                          <>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>Register an Azure App in your tenant's Entra ID</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>Grant it Power BI Service permissions</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>Enter your Tenant ID, Client ID, and Client Secret below</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>Click Connect to authorize</li>
                          </>
                        ) : connector.authType === 'Service Account / OAuth' ? (
                          <>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>Sign in with a Microsoft 365 admin account</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>Grant SharePoint read permissions to the portal app</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>Enter your SharePoint site URL</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>Click Connect to authorize</li>
                          </>
                        ) : (
                          <>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>Click Connect to open Microsoft sign-in</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>Sign in with your Microsoft 365 work account</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>Grant the requested read permissions</li>
                            <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>You'll be redirected back automatically</li>
                          </>
                        )}
                      </ol>

                      {/* Tenant input (shown when not connected) */}
                      {!isConnected && (
                        <div className="mt-4 space-y-2">
                          <input
                            type="text"
                            placeholder="Tenant ID (e.g. contoso.onmicrosoft.com)"
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-gray-300"
                          />
                          {connector.authType === 'Service Principal' && (
                            <>
                              <input type="text"  placeholder="Client ID" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-gray-300" />
                              <input type="password" placeholder="Client Secret" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-gray-300" />
                            </>
                          )}
                          {connector.authType === 'Service Account / OAuth' && (
                            <input type="text" placeholder="SharePoint site URL (e.g. https://contoso.sharepoint.com/sites/projects)" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-gray-300" />
                          )}
                          <button
                            onClick={() => handleConnect(connector)}
                            disabled={isSyncing}
                            className="w-full py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isSyncing ? <><RefreshCw size={14} className="animate-spin" /> Connecting…</> : <><ExternalLink size={14} /> Authorize & Connect</>}
                          </button>
                        </div>
                      )}

                      {/* Connected state */}
                      {isConnected && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            <p className="text-sm font-semibold text-green-800">Active & syncing</p>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Data is being pulled into the portal. Changes in {connector.name} will reflect within a few minutes.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom notice */}
      <div className="mt-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Note: </span>
          This is a placeholder integration UI. Production OAuth flows require an Azure App Registration with delegated/application permissions on your Microsoft 365 tenant. Contact your IT admin to whitelist the portal's redirect URI before going live.
        </p>
      </div>
    </div>
  );
};

export default Connectors;
