import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Shield, ChevronsRight, Calendar } from 'lucide-react';
import LoadingSpinner from '../components/shared/LoadingSpinner';

// Role badge: colour-coded by role type
const RoleBadge = ({ role }) => {
  const map = {
    admin:   'bg-red-100 text-red-700 border-red-200',
    manager: 'bg-purple-100 text-purple-700 border-purple-200',
    owner:   'bg-amber-100 text-amber-700 border-amber-200',
    sme:     'bg-cyan-100 text-cyan-700 border-cyan-200',
    member:  'bg-green-100 text-green-700 border-green-200',
    viewer:  'bg-gray-100 text-gray-600 border-gray-200',
  };
  const key = (role || '').toLowerCase();
  const cls = map[key] || map.viewer;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {role || 'Member'}
    </span>
  );
};

const TeamSelection = () => {
  const navigate = useNavigate();
  const { teams, loading, selectTeam, createTeam } = useTeam();
  const { user, isSystemAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSelectTeam = async (teamId) => {
    try {
      await selectTeam(teamId);
      navigate(`/teams/${teamId}`);
    } catch (error) {
      console.error('Error selecting team:', error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      setCreating(true);
      const team = await createTeam({ name: newTeamName, description: newTeamDescription });
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      navigate(`/teams/${team._id}`);
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading teams..." />;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Welcome header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">WorkTracker</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-gray-500 mt-1">Select a workspace to continue, or create a new one.</p>
        </div>

        {/* Team grid */}
        {teams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {teams.map((team) => (
              <button
                key={team._id}
                onClick={() => handleSelectTeam(team._id)}
                className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:border-gray-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-11 h-11 rounded-xl object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {team.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-black">{team.name}</h3>
                      <RoleBadge role={team.userRole} />
                    </div>
                  </div>
                  <ChevronsRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
                </div>

                {team.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{team.description}</p>
                )}

                <div className="flex items-center text-xs text-gray-400 gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{team.memberCount || 1} {team.memberCount === 1 ? 'member' : 'members'}</span>
                </div>
              </button>
            ))}

            {/* Create new team card */}
            {isSystemAdmin() ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-6 hover:border-gray-900 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-2 text-center group min-h-[140px]"
              >
                <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">New Workspace</p>
                  <p className="text-xs text-gray-400">Create a team to collaborate</p>
                </div>
              </button>
            ) : (
              <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[140px]">
                <div className="w-11 h-11 rounded-xl bg-gray-200 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500">Admin Only</p>
                  <p className="text-xs text-gray-400">Only admins can create teams</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {teams.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workspaces yet</h3>
            {isSystemAdmin() ? (
              <>
                <p className="text-gray-500 mb-6">Create your first team to get started.</p>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Team
                </button>
              </>
            ) : (
              <p className="text-gray-500">You haven't been assigned to any teams yet. Contact your administrator.</p>
            )}
          </div>
        )}
      </div>

      {/* Create team modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-1">New Workspace</h2>
            <p className="text-sm text-gray-500 mb-6">Give your team a name to get started.</p>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Engineering, Design, Marketing"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="What does this team work on?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewTeamName(''); setNewTeamDescription(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary" disabled={creating || !newTeamName.trim()}>
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSelection;
