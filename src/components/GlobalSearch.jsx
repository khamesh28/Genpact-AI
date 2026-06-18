import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderOpen, Users, Megaphone, LayoutDashboard, Target, ClipboardList, X, Command } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import api from '../services/api';

const STATIC_PAGES = (teamId) => [
  { type: 'page', label: 'Dashboard',         path: `/teams/${teamId}`,                          icon: LayoutDashboard },
  { type: 'page', label: "Today's Priorities", path: `/teams/${teamId}/priorities`,              icon: Target },
  { type: 'page', label: 'Daily Standup',      path: `/teams/${teamId}/standup`,                 icon: ClipboardList },
  { type: 'page', label: 'Team Status',        path: `/teams/${teamId}/team-status`,             icon: Users },
  { type: 'page', label: 'Leaderboard',        path: `/teams/${teamId}/leaderboard`,             icon: Target },
  { type: 'page', label: 'Mood & Wellbeing',   path: `/teams/${teamId}/mood`,                   icon: Target },
  { type: 'page', label: 'OKR Tracker',        path: `/teams/${teamId}/okr`,                    icon: Target },
  { type: 'page', label: 'Project Catalog',    path: `/teams/${teamId}/catalog`,                icon: FolderOpen },
  { type: 'page', label: 'Announcements',      path: `/teams/${teamId}/announcements`,          icon: Megaphone },
  { type: 'page', label: 'Cloud & Cost',       path: `/teams/${teamId}/cloud-cost`,             icon: LayoutDashboard },
  { type: 'page', label: 'Connectors',         path: `/teams/${teamId}/connectors`,             icon: LayoutDashboard },
];

const TYPE_ICON = {
  page:         { icon: LayoutDashboard, color: 'text-gray-400', bg: 'bg-gray-100'    },
  project:      { icon: FolderOpen,      color: 'text-indigo-500', bg: 'bg-indigo-50'  },
  member:       { icon: Users,           color: 'text-emerald-500', bg: 'bg-emerald-50' },
  announcement: { icon: Megaphone,       color: 'text-amber-500',  bg: 'bg-amber-50'   },
};

const GlobalSearch = () => {
  const { currentTeam } = useTeam();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const cacheRef = useRef({ projects: null, members: null });

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setCursor(0);
    }
  }, [open]);

  const search = useCallback(async (q) => {
    if (!currentTeam?._id) return [];
    const teamId = currentTeam._id;
    const lower = q.toLowerCase();

    // Lazy-load projects + members once
    if (!cacheRef.current.projects) {
      try {
        const [pRes, mRes] = await Promise.all([
          api.get(`/teams/${teamId}/projects`),
          api.get(`/teams/${teamId}/members`),
        ]);
        cacheRef.current.projects = pRes.data?.data || [];
        cacheRef.current.members  = mRes.data?.data || [];
      } catch {}
    }

    const pages = STATIC_PAGES(teamId).filter(p => p.label.toLowerCase().includes(lower));
    const projects = (cacheRef.current.projects || [])
      .filter(p => p.name?.toLowerCase().includes(lower))
      .map(p => ({ type: 'project', label: p.name, sub: p.type, path: `/teams/${teamId}/projects/${p._id}`, icon: FolderOpen }));
    const members = (cacheRef.current.members || [])
      .filter(m => m.user?.name?.toLowerCase().includes(lower) || m.user?.email?.toLowerCase().includes(lower))
      .map(m => ({ type: 'member', label: m.user?.name, sub: m.role, path: `/teams/${teamId}/members`, icon: Users }));

    // Announcements (live search)
    let announcements = [];
    if (q.length >= 2) {
      try {
        const aRes = await api.get(`/teams/${teamId}/announcements`);
        announcements = (aRes.data?.data || [])
          .filter(a => a.title?.toLowerCase().includes(lower) || a.content?.toLowerCase().includes(lower))
          .slice(0, 3)
          .map(a => ({ type: 'announcement', label: a.title, sub: a.priority, path: `/teams/${teamId}/announcements`, icon: Megaphone }));
      } catch {}
    }

    return [...pages, ...projects, ...members, ...announcements].slice(0, 10);
  }, [currentTeam]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(currentTeam ? STATIC_PAGES(currentTeam._id).slice(0, 6) : []);
      setCursor(0);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await search(query);
      setResults(r);
      setCursor(0);
      setLoading(false);
    }, 150);
    return () => clearTimeout(t);
  }, [query, search, currentTeam]);

  const go = (item) => {
    navigate(item.path);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && results[cursor]) go(results[cursor]);
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-500 transition-colors"
      title="Search (⌘K)"
    >
      <Search size={13} />
      <span>Search…</span>
      <span className="flex items-center gap-0.5 ml-1 text-[10px] bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-400">
        <Command size={9} /> K
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-[560px] mx-4" onClick={e => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search pages, projects, people…"
              className="flex-1 text-sm outline-none placeholder:text-gray-400 text-gray-900"
            />
            {loading && <div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />}
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>

          {/* Results */}
          <div className="max-h-[360px] overflow-y-auto py-1">
            {results.length === 0 && !loading && (
              <div className="py-10 text-center text-sm text-gray-400">No results for "{query}"</div>
            )}
            {results.map((r, i) => {
              const cfg = TYPE_ICON[r.type] || TYPE_ICON.page;
              const Icon = r.icon || cfg.icon;
              return (
                <button
                  key={i}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === cursor ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  onClick={() => go(r)}
                  onMouseEnter={() => setCursor(i)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                    {r.sub && <p className="text-[11px] text-gray-400 capitalize">{r.sub}</p>}
                  </div>
                  <span className="text-[10px] text-gray-300 capitalize flex-shrink-0">{r.type}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-400">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
