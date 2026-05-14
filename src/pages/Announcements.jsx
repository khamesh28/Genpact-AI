import React, { useState, useEffect } from 'react';
import { Pin, Plus, Edit, Trash2, Megaphone, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import announcementService from '../services/announcementService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const PRIORITY_CONFIG = {
  high:   { label: 'High',   bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    icon: AlertTriangle, iconColor: 'text-red-500'   },
  medium: { label: 'Medium', bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',  icon: Info,          iconColor: 'text-blue-500'  },
  low:    { label: 'Low',    bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700', icon: CheckCircle,  iconColor: 'text-green-500' },
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

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
const AnnouncementModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: initial?.title || '',
    content: initial?.content || '',
    priority: initial?.priority || 'medium',
    isPinned: initial?.isPinned || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{initial ? 'Edit Announcement' : 'New Announcement'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Title *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="e.g. Sprint planning moved to Friday"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Content *</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-300 resize-none"
              rows={4}
              placeholder="What does the team need to know?"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Priority</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              >
                <option value="high">🔴 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer select-none pb-2.5">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Pin to top</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50">
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const Announcements = () => {
  const { currentTeam, isAdmin } = useTeam();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');

  const canManage = isAdmin();

  const load = async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const res = await announcementService.getAnnouncements(currentTeam._id);
      setAnnouncements(res.data || []);
    } catch { toast.error('Could not load announcements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentTeam?._id]);

  const handleSave = async (form) => {
    try {
      if (editing) {
        const res = await announcementService.updateAnnouncement(currentTeam._id, editing._id, form);
        setAnnouncements(prev => prev.map(a => a._id === editing._id ? res.data : a));
        toast.success('Announcement updated');
      } else {
        const res = await announcementService.createAnnouncement(currentTeam._id, form);
        setAnnouncements(prev => {
          const next = [res.data, ...prev];
          return next.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
        });
        toast.success('Announcement posted');
      }
      setShowModal(false);
      setEditing(null);
    } catch { toast.error('Failed to save announcement'); }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await announcementService.deleteAnnouncement(currentTeam._id, deleteTarget._id);
      setAnnouncements(prev => prev.filter(a => a._id !== deleteTarget._id));
      toast.success('Deleted');
      setDeleteTarget(null);
    } catch { toast.error('Delete failed'); }
    finally { setIsDeleting(false); }
  };

  const handlePin = async (ann) => {
    try {
      const res = await announcementService.pinAnnouncement(currentTeam._id, ann._id);
      setAnnouncements(prev => {
        const next = prev.map(a => a._id === ann._id ? res.data : a);
        return next.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
    } catch { toast.error('Could not update pin'); }
  };

  const filtered = filterPriority === 'all'
    ? announcements
    : announcements.filter(a => a.priority === filterPriority);

  const pinned   = filtered.filter(a => a.isPinned);
  const unpinned = filtered.filter(a => !a.isPinned);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <p className="text-sm text-gray-500">{currentTeam?.name} · {announcements.length} total</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Priority filter */}
          <div className="flex gap-1.5">
            {['all', 'high', 'medium', 'low'].map(p => (
              <button key={p} onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${filterPriority === p ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
          </div>
          {canManage && (
            <button onClick={() => { setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700">
              <Plus size={16} /> New
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-600">No announcements yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {canManage ? 'Post one to keep your team informed.' : 'Check back later.'}
          </p>
          {canManage && (
            <button onClick={() => setShowModal(true)}
              className="mt-4 px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700">
              Post Announcement
            </button>
          )}
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Pin size={10} /> Pinned
          </p>
          <div className="space-y-3">
            {pinned.map(ann => <AnnouncementCard key={ann._id} ann={ann} canManage={canManage} onEdit={() => { setEditing(ann); setShowModal(true); }} onDelete={() => setDeleteTarget(ann)} onPin={() => handlePin(ann)} />)}
          </div>
        </div>
      )}

      {/* Unpinned */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Recent</p>
          )}
          <div className="space-y-3">
            {unpinned.map(ann => <AnnouncementCard key={ann._id} ann={ann} canManage={canManage} onEdit={() => { setEditing(ann); setShowModal(true); }} onDelete={() => setDeleteTarget(ann)} onPin={() => handlePin(ann)} />)}
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <AnnouncementModal initial={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />
      )}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.title}
        itemType="announcement"
        loading={isDeleting}
      />
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
const AnnouncementCard = ({ ann, canManage, onEdit, onDelete, onPin }) => {
  const cfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.medium;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border p-5 ${cfg.bg} ${cfg.border} ${ann.isPinned ? 'ring-1 ring-gray-300' : ''}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Icon size={18} className={`${cfg.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-gray-900 text-sm">{ann.title}</h3>
              {ann.isPinned && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  <Pin size={9} /> Pinned
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
              <span className="font-medium text-gray-600">{ann.createdBy?.name}</span>
              <span>·</span>
              <span>{timeAgo(ann.createdAt)}</span>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onPin} title={ann.isPinned ? 'Unpin' : 'Pin'}
              className={`p-2 rounded-lg transition-colors ${ann.isPinned ? 'text-gray-700 bg-white/60 hover:bg-white' : 'text-gray-400 hover:text-gray-700 hover:bg-white/60'}`}>
              <Pin size={15} />
            </button>
            <button onClick={onEdit} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white/60 transition-colors">
              <Edit size={15} />
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white/60 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
