import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, List, Edit, Trash2, ShieldCheck,
  ChevronsLeft, ChevronsRight, Users, CheckSquare, Zap, TrendingUp,
} from 'lucide-react';
import { toast } from 'react-toastify';
import activityService from '../services/activityService';
import reportService from '../services/reportService';
import projectService from '../services/projectService';
import { useTeam } from '../context/TeamContext';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import DownloadReportButton from '../components/shared/DownloadReportButton';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ActivityEntryModal from '../components/dashboard/ActivityEntryModal';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import WeeklyChart from '../components/dashboard/WeeklyChart';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatUIDuration = (mins) => {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}hr ${m}m` : `${m}m`;
};

const toDateInput = (d) => {
  const y = d.getFullYear();
  const mo = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${mo}-${day}`;
};

const formatDateDisplay = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

// ─── summary stat card ───────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── main component ──────────────────────────────────────────────────────────

const Dashboard = () => {
  const { currentTeam } = useTeam();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activity, setActivity] = useState({
    date: new Date().toISOString().split('T')[0],
    meetings: [], tasks: [], extraActivities: [],
    mood: 'neutral', productivity: 5, notes: '',
  });
  const [modal, setModal] = useState({ isOpen: false, type: '', index: null, data: {} });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', index: null, item: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => { fetchData(); }, [selectedDate]);

  useEffect(() => {
    if (currentTeam?._id) {
      projectService.getProjects(currentTeam._id)
        .then((res) => setProjects(res.data || []))
        .catch(() => {});
    }
  }, [currentTeam?._id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await activityService.getActivityByDate(selectedDate);
      setActivity(
        response.data ?? {
          date: selectedDate, meetings: [], tasks: [], extraActivities: [],
          notes: '', mood: 'neutral', productivity: 5,
        }
      );
    } catch {
      toast.error('Error fetching data');
      setActivity({
        date: selectedDate, meetings: [], tasks: [], extraActivities: [],
        notes: '', mood: 'neutral', productivity: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithBackend = async (updatedActivity) => {
    try {
      if (updatedActivity._id) {
        await activityService.updateActivity(updatedActivity._id, updatedActivity);
      } else {
        const res = await activityService.createActivity(updatedActivity);
        setActivity((prev) => ({ ...prev, _id: res.data._id }));
      }
    } catch {
      toast.error('Sync failed');
    }
  };

  const openModal = (type, index = null) => {
    let data = {
      title: '', durationValue: '30', summary: '', description: '',
      status: 'pending', priority: 'medium', category: 'development',
      type: 'break', project: '',
    };
    if (index !== null) {
      const list = type === 'extra' ? 'extraActivities' : `${type}s`;
      const item = activity[list][index];
      const dur = type === 'task' ? item.timeSpent : item.duration;
      data = {
        ...item,
        status: item?.status === 'inprogress' ? 'in-progress' : item?.status,
        durationValue: dur?.toString() || '30',
      };
    }
    setModal({ isOpen: true, type, index, data });
  };

  const handleModalSave = async () => {
    const listName = modal.type === 'extra' ? 'extraActivities' : `${modal.type}s`;
    const durationKey = modal.type === 'task' ? 'timeSpent' : 'duration';
    const mins = parseInt(modal.data.durationValue);
    const entryDate = new Date(selectedDate + 'T00:00:00');
    const normalizedStatus =
      modal.type === 'task' && modal.data?.status === 'inprogress' ? 'in-progress' : modal.data?.status;

    const entry = {
      ...modal.data, status: normalizedStatus, [durationKey]: mins,
      isConfidential: true, startTime: entryDate,
      endTime: new Date(entryDate.getTime() + mins * 60000),
      createdAt: modal.index !== null ? modal.data.createdAt : new Date(),
    };

    const newList = [...activity[listName]];
    if (modal.index !== null) newList[modal.index] = entry; else newList.push(entry);

    const updated = { ...activity, [listName]: newList, date: selectedDate };
    setActivity(updated);
    setModal({ isOpen: false, type: '', index: null, data: {} });
    await syncWithBackend(updated);
  };

  const openDeleteModal = (type, index) => {
    const listName = type === 'extra' ? 'extraActivities' : `${type}s`;
    setDeleteModal({ isOpen: true, type, index, item: activity[listName][index] });
  };

  const handleDelete = async () => {
    const { type, index } = deleteModal;
    setIsDeleting(true);
    try {
      const listName = type === 'extra' ? 'extraActivities' : `${type}s`;
      const newList = activity[listName].filter((_, i) => i !== index);
      const updated = { ...activity, [listName]: newList };
      setActivity(updated);
      await syncWithBackend(updated);
      toast.success('Entry deleted successfully');
      setDeleteModal({ isOpen: false, type: '', index: null, item: null });
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  const changeDate = (offset) => {
    const base = new Date(`${selectedDate}T00:00:00`);
    base.setDate(base.getDate() + offset);
    setSelectedDate(toDateInput(base));
  };

  // Computed totals
  const meetMins  = activity.meetings.reduce((a, i) => a + (i.duration || 0), 0);
  const taskMins  = activity.tasks.reduce((a, i) => a + (i.timeSpent || 0), 0);
  const extraMins = activity.extraActivities.reduce((a, i) => a + (i.duration || 0), 0);
  const totalHoursNum = (meetMins + taskMins + extraMins) / 60;
  const todayDate = toDateInput(new Date());

  // Download helpers
  const makeDownloadOption = (key, label, description, getRange) => ({
    key, label, description,
    action: async () => {
      setDownloading(true);
      try { await reportService.downloadMyActivity(currentTeam._id, getRange()); }
      finally { setDownloading(false); }
    },
  });

  const downloadOptions = currentTeam ? [
    makeDownloadOption('today', 'Current Day', `Activity for ${new Date(selectedDate).toLocaleDateString()}`,
      () => ({ startDate: selectedDate, endDate: selectedDate })),
    makeDownloadOption('week', 'This Week', 'Activity for the current week', () => {
      const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - t.getDay());
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return { startDate: toDateInput(s), endDate: toDateInput(e) };
    }),
    makeDownloadOption('month', 'This Month', 'Activity for the current month', () => {
      const t = new Date();
      return {
        startDate: toDateInput(new Date(t.getFullYear(), t.getMonth(), 1)),
        endDate: toDateInput(new Date(t.getFullYear(), t.getMonth() + 1, 0)),
      };
    }),
    makeDownloadOption('year', 'This Year', 'Activity for the current year', () => {
      const t = new Date();
      return { startDate: toDateInput(new Date(t.getFullYear(), 0, 1)), endDate: toDateInput(t) };
    }),
  ] : [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 bg-gray-50 min-h-screen">

      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Viewing Activities For</label>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-800">{formatDateDisplay(selectedDate)}</span>
              <input
                type="date"
                className="text-sm border border-gray-200 rounded-lg px-3 py-1 cursor-pointer text-gray-600 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDate}
                onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={() => changeDate(-1)}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg flex gap-2">
            <ChevronsLeft className="h-5 w-5" /> Previous
          </button>
          <button onClick={() => setSelectedDate(todayDate)}
            className="px-4 py-2 text-sm font-medium bg-black text-white hover:bg-gray-800 rounded-lg">
            Today
          </button>
          <button onClick={() => changeDate(1)}
            className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg flex gap-2">
            Next <ChevronsRight className="h-5 w-5" />
          </button>

          {currentTeam && (
            <div className="ml-2 border-l border-gray-200 pl-2">
              <DownloadReportButton
                label="Download" variant="secondary" disabled={downloading} options={downloadOptions}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock}       label="Total Hours"  value={totalHoursNum.toFixed(1)} sub="logged today"      color="bg-gray-900" />
        <StatCard icon={Users}       label="Meetings"     value={activity.meetings.length}  sub={formatUIDuration(meetMins)}  color="bg-indigo-500" />
        <StatCard icon={CheckSquare} label="Tasks"        value={activity.tasks.length}     sub={formatUIDuration(taskMins)}  color="bg-emerald-500" />
        <StatCard icon={TrendingUp}  label="Productivity" value={`${activity.productivity}/10`} sub="self-assessed" color="bg-orange-500" />
      </div>

      {/* ── Weekly chart ── */}
      <div className="mb-6">
        <WeeklyChart />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── Activity tables (left 3 cols) ── */}
          <div className="lg:col-span-3 space-y-6">
            {['meeting', 'task', 'extra'].map((type) => {
              const list = type === 'extra' ? activity.extraActivities : activity[`${type}s`];
              const durationKey = type === 'task' ? 'timeSpent' : 'duration';
              return (
                <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 capitalize flex items-center gap-2">
                      <List size={18} /> {type === 'extra' ? 'Extra Activities' : `${type}s`}
                    </h3>
                    <button onClick={() => openModal(type)}
                      className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700">
                      + Add {type}
                    </button>
                  </div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-100">
                      {list.length > 0 ? list.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 group">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              {item.title}
                              {item.isConfidential && <ShieldCheck size={12} className="text-blue-500" />}
                            </div>
                            {item.project && (
                              <div className="text-xs text-blue-600 font-medium mt-0.5">
                                {projects.find((p) => p._id === (item.project?._id || item.project))?.name || ''}
                              </div>
                            )}
                            <div className="text-sm text-gray-500 mt-1">
                              {item.summary || item.description || (
                                <span className="italic text-gray-300">No details provided</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                            {formatUIDuration(item[durationKey])}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openModal(type, idx)}
                                className="p-2 text-gray-400 hover:text-blue-600"><Edit size={18} /></button>
                              <button onClick={() => openDeleteModal(type, idx)}
                                className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-400 italic">
                            No {type === 'extra' ? 'extra activities' : `${type}s`} added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* ── Right sidebar ── */}
          <DashboardSidebar
            activity={activity}
            meetMins={meetMins}
            taskMins={taskMins}
            extraMins={extraMins}
            totalHoursNum={totalHoursNum}
            selectedDate={selectedDate}
            onActivityChange={setActivity}
            onSync={syncWithBackend}
          />
        </div>
      )}

      {/* ── Modals ── */}
      <ActivityEntryModal modal={modal} setModal={setModal} projects={projects} onSave={handleModalSave} />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: '', index: null, item: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.item?.title || 'this entry'}
        itemType={deleteModal.type === 'extra' ? 'activity' : deleteModal.type}
        loading={isDeleting}
      />
    </div>
  );
};

export default Dashboard;
