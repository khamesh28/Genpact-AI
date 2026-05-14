import React from 'react';
import { PieChart, Smile, FileText } from 'lucide-react';

const formatUIDuration = (mins) => {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}hr ${m}m` : `${m}m`;
};

const getSummaryColor = (hrs) => {
  if (hrs >= 7) return 'bg-green-50 text-green-700 border-green-100';
  if (hrs >= 4) return 'bg-yellow-50 text-yellow-700 border-yellow-100';
  return 'bg-red-50 text-red-700 border-red-100';
};

const DashboardSidebar = ({ activity, meetMins, taskMins, extraMins, totalHoursNum, selectedDate, onActivityChange, onSync }) => {
  return (
    <div className="space-y-6">
      {/* Time Summary */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700">
          <PieChart size={20} className="text-blue-500" /> Time Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-gray-500">Meetings</span>
            <span className="text-gray-800">{formatUIDuration(meetMins)}</span>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-gray-500">Tasks</span>
            <span className="text-gray-800">{formatUIDuration(taskMins)}</span>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-gray-500">Extras</span>
            <span className="text-gray-800">{formatUIDuration(extraMins)}</span>
          </div>
          <div className={`mt-4 text-center py-4 rounded-xl border-2 ${getSummaryColor(totalHoursNum)}`}>
            <p className="text-3xl font-black">{totalHoursNum.toFixed(1)}</p>
            <p className="text-[10px] font-bold uppercase">Total Hours</p>
          </div>
        </div>
      </div>

      {/* Mood & Focus */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700">
          <Smile size={20} className="text-orange-500" /> Mood & Focus
        </h3>
        <select
          className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm mb-4 outline-none"
          value={activity.mood}
          onChange={(e) => {
            const updated = { ...activity, mood: e.target.value, date: selectedDate };
            onActivityChange(updated);
            onSync(updated);
          }}
        >
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="neutral">Neutral</option>
          <option value="tired">Tired</option>
          <option value="stressed">Stressed</option>
        </select>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Productivity</label>
          <span className="text-xs font-bold text-blue-600">{activity.productivity}/10</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          className="w-full h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer"
          value={activity.productivity}
          onChange={(e) => onActivityChange({ ...activity, productivity: parseInt(e.target.value) })}
          onMouseUp={() => onSync({ ...activity, date: selectedDate })}
        />
      </div>

      {/* Daily Notes */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700">
          <FileText size={20} className="text-gray-400" /> Daily Notes
        </h3>
        <textarea
          className="w-full border-none bg-gray-50 rounded-xl p-3 text-sm h-32 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          placeholder="Enter daily notes..."
          value={activity.notes}
          onChange={(e) => onActivityChange({ ...activity, notes: e.target.value })}
          onBlur={() => onSync({ ...activity, date: selectedDate })}
        />
      </div>
    </div>
  );
};

export default DashboardSidebar;
