import React from 'react';

const formatUIDuration = (mins) => {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}hr ${m}m` : `${m}m`;
};

const ActivityEntryModal = ({ modal, setModal, projects, onSave }) => {
  if (!modal.isOpen) return null;

  const update = (field, value) =>
    setModal((prev) => ({ ...prev, data: { ...prev.data, [field]: value } }));

  const close = () => setModal({ isOpen: false, type: '', index: null, data: {} });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 capitalize">
            {modal.index !== null ? 'Edit' : 'Add'}{' '}
            {modal.type === 'extra' ? 'Extra Activity' : modal.type}
          </h2>
          <button onClick={close} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Title</label>
            <input
              className="w-full border-gray-100 bg-gray-50 rounded-lg p-3 font-semibold outline-none focus:ring-1 focus:ring-blue-500"
              value={modal.data.title}
              onChange={(e) => update('title', e.target.value)}
            />
          </div>

          {/* Project selector (meetings + tasks) */}
          {(modal.type === 'task' || modal.type === 'meeting') && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Project</label>
              <select
                className="w-full border-gray-100 bg-gray-50 rounded-lg p-3 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                value={modal.data.project || ''}
                onChange={(e) => update('project', e.target.value)}
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
              {modal.type === 'task' ? 'Time Spent' : 'Duration'}
            </label>
            <select
              className="w-full border-gray-100 bg-gray-50 rounded-lg p-3 outline-none focus:ring-1 focus:ring-blue-500"
              value={modal.data.durationValue}
              onChange={(e) => update('durationValue', e.target.value)}
            >
              {[5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480].map((m) => (
                <option key={m} value={m}>
                  {m} minutes {m >= 60 && `(${formatUIDuration(m)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Task-specific fields */}
          {modal.type === 'task' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Status</label>
                  <select
                    className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm outline-none"
                    value={modal.data.status}
                    onChange={(e) => update('status', e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Priority</label>
                  <select
                    className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm outline-none"
                    value={modal.data.priority}
                    onChange={(e) => update('priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
                <select
                  className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm outline-none"
                  value={modal.data.category}
                  onChange={(e) => update('category', e.target.value)}
                >
                  <option value="development">Development</option>
                  <option value="testing">Testing</option>
                  <option value="deployment">Deployment</option>
                  <option value="documentation">Documentation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          {/* Extra-activity type */}
          {modal.type === 'extra' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Activity Type</label>
              <select
                className="w-full border-gray-100 bg-gray-50 rounded-lg p-2 text-sm outline-none"
                value={modal.data.type}
                onChange={(e) => update('type', e.target.value)}
              >
                <option value="break">Break</option>
                <option value="training">Training</option>
                <option value="learning">Learning</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Description</label>
            <textarea
              className="w-full border-gray-100 bg-gray-50 rounded-lg p-3 h-24 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              value={modal.data.summary || modal.data.description || ''}
              onChange={(e) => {
                const field = modal.type === 'meeting' ? 'summary' : 'description';
                update(field, e.target.value);
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={close} className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700">
            Cancel
          </button>
          <button
            onClick={onSave}
            className="bg-blue-600 text-white font-bold px-8 py-2 rounded-xl shadow-lg hover:bg-blue-700"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityEntryModal;
