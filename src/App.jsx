import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider, useTeam } from './context/TeamContext';
import { SprintProvider } from './context/SprintContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/shared/LoadingSpinner';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Each page is only downloaded when a user actually navigates to that route,
// reducing the initial JS bundle size significantly.

const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const History            = lazy(() => import('./pages/History'));
const Statistics         = lazy(() => import('./pages/Statistics'));
const Profile            = lazy(() => import('./pages/Profile'));
const Projects           = lazy(() => import('./pages/Projects'));
const TeamSelection      = lazy(() => import('./pages/TeamSelection'));
const TeamSettings       = lazy(() => import('./pages/TeamSettings'));
const TeamMembers        = lazy(() => import('./pages/TeamMembers'));
const SprintList         = lazy(() => import('./pages/SprintList'));
const SprintBoard        = lazy(() => import('./pages/SprintBoard'));
const Backlog            = lazy(() => import('./pages/Backlog'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const BandwidthReports   = lazy(() => import('./pages/BandwidthReports'));
const CreateBandwidthReport = lazy(() => import('./pages/CreateBandwidthReport'));
const TeamAnalytics      = lazy(() => import('./components/admin/TeamAnalytics'));
const TeamActivity       = lazy(() => import('./pages/TeamActivity'));
const ResetPassword      = lazy(() => import('./pages/ResetPassword'));
const TaskCreatePage     = lazy(() => import('./pages/TaskCreatePage'));
const TaskDetailPage     = lazy(() => import('./pages/TaskDetailPage'));
const TaskCompletionPage = lazy(() => import('./pages/TaskCompletionPage'));
const Newsletters        = lazy(() => import('./pages/Newsletters'));
const NewsletterDetail   = lazy(() => import('./pages/NewsletterDetail'));
const NewsletterFormPage = lazy(() => import('./pages/NewsletterFormPage'));
const ResourceManagement = lazy(() => import('./pages/ResourceManagement'));
const ProjectCatalog     = lazy(() => import('./pages/ProjectCatalog'));
const CatalogDetailPage  = lazy(() => import('./pages/CatalogDetailPage'));
const CatalogFormPage    = lazy(() => import('./pages/CatalogFormPage'));
const ProjectIntakeForm  = lazy(() => import('./pages/ProjectIntakeForm'));
const CloudCost          = lazy(() => import('./pages/CloudCost'));
const Collaboration      = lazy(() => import('./pages/Collaboration'));
const ResourceAllocation = lazy(() => import('./pages/ResourceAllocation'));
const Connectors         = lazy(() => import('./pages/Connectors'));
const Announcements      = lazy(() => import('./pages/Announcements'));
const MoodDashboard      = lazy(() => import('./pages/MoodDashboard'));
const Leaderboard        = lazy(() => import('./pages/Leaderboard'));
const NotificationCentre = lazy(() => import('./pages/NotificationCentre'));
const StandupBot         = lazy(() => import('./pages/StandupBot'));
const TeamStatusBoard    = lazy(() => import('./pages/TeamStatusBoard'));
const TodaysPriorities   = lazy(() => import('./pages/TodaysPriorities'));
const OKRTracker         = lazy(() => import('./pages/OKRTracker'));

// ─── Shared fallback for all Suspense boundaries ──────────────────────────────
const PageLoader = () => <LoadingSpinner fullScreen />;

// ─── Auth-aware redirect from "/" ─────────────────────────────────────────────
const AuthRedirect = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  if (authLoading || teamLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentTeam) return <Navigate to={`/teams/${currentTeam._id}`} replace />;
  return <Navigate to="/teams" replace />;
};

// ─── Shared protected wrapper ─────────────────────────────────────────────────
const ProtectedLayout = ({ children }) => (
  <PrivateRoute>
    <Layout>{children}</Layout>
  </PrivateRoute>
);

// ─── Route tree ───────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <>
    <ToastContainer
      position="top-right" autoClose={3000} hideProgressBar={false}
      newestOnTop closeOnClick rtl={false}
      pauseOnFocusLoss draggable pauseOnHover theme="light"
    />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/login"                    element={<Login />} />
        <Route path="/register"                 element={<Register />} />
        <Route path="/reset-password/:token"    element={<ResetPassword />} />
        <Route path="/"                         element={<AuthRedirect />} />

        {/* Team selection (no sidebar) */}
        <Route path="/teams" element={<PrivateRoute><TeamSelection /></PrivateRoute>} />

        {/* Protected with sidebar */}
        <Route path="/teams/:teamId"             element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/teams/:teamId/settings"    element={<ProtectedLayout><TeamSettings /></ProtectedLayout>} />
        <Route path="/teams/:teamId/members"     element={<ProtectedLayout><TeamMembers /></ProtectedLayout>} />

        <Route path="/history"    element={<ProtectedLayout><History /></ProtectedLayout>} />
        <Route path="/statistics" element={<ProtectedLayout><Statistics /></ProtectedLayout>} />
        <Route path="/profile"    element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        <Route path="/projects"   element={<ProtectedLayout><Projects /></ProtectedLayout>} />

        <Route path="/teams/:teamId/projects"              element={<ProtectedLayout><Projects /></ProtectedLayout>} />
        <Route path="/teams/:teamId/projects/:projectId"   element={<ProtectedLayout><Projects /></ProtectedLayout>} />

        {/* Sprint */}
        <Route path="/teams/:teamId/projects/:projectId/sprints"              element={<ProtectedLayout><SprintList /></ProtectedLayout>} />
        <Route path="/teams/:teamId/projects/:projectId/sprints/:sprintId"    element={<ProtectedLayout><SprintBoard /></ProtectedLayout>} />

        {/* Tasks */}
        <Route path="/teams/:teamId/projects/:projectId/tasks/new"            element={<ProtectedLayout><TaskCreatePage /></ProtectedLayout>} />
        <Route path="/teams/:teamId/projects/:projectId/tasks/:taskId/complete" element={<ProtectedLayout><TaskCompletionPage /></ProtectedLayout>} />
        <Route path="/teams/:teamId/projects/:projectId/tasks/:taskId"        element={<ProtectedLayout><TaskDetailPage /></ProtectedLayout>} />
        <Route path="/teams/:teamId/projects/:projectId/backlog"              element={<ProtectedLayout><Backlog /></ProtectedLayout>} />

        {/* Admin */}
        <Route path="/teams/:teamId/admin" element={<ProtectedLayout><AdminDashboard /></ProtectedLayout>} />
        <Route
          path="/teams/:teamId/admin/analytics"
          element={
            <ProtectedLayout>
              <div className="py-8">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                  <TeamAnalytics />
                </div>
              </div>
            </ProtectedLayout>
          }
        />
        <Route path="/teams/:teamId/team-activity" element={<ProtectedLayout><TeamActivity /></ProtectedLayout>} />

        {/* Bandwidth */}
        <Route path="/teams/:teamId/bandwidth"     element={<ProtectedLayout><BandwidthReports /></ProtectedLayout>} />
        <Route path="/teams/:teamId/bandwidth/new" element={<ProtectedLayout><CreateBandwidthReport /></ProtectedLayout>} />

        {/* Newsletters */}
        <Route path="/teams/:teamId/newsletters"                          element={<ProtectedLayout><Newsletters /></ProtectedLayout>} />
        <Route path="/teams/:teamId/newsletters/new"                      element={<ProtectedLayout><NewsletterFormPage /></ProtectedLayout>} />
        <Route path="/teams/:teamId/newsletters/:newsletterId/edit"       element={<ProtectedLayout><NewsletterFormPage /></ProtectedLayout>} />
        <Route path="/teams/:teamId/newsletters/:newsletterId"            element={<ProtectedLayout><NewsletterDetail /></ProtectedLayout>} />

        {/* Resources & intake */}
        <Route path="/teams/:teamId/resources"      element={<ProtectedLayout><ResourceManagement /></ProtectedLayout>} />
        <Route path="/teams/:teamId/project-intake" element={<ProtectedLayout><ProjectIntakeForm /></ProtectedLayout>} />

        {/* Project catalog */}
        <Route path="/teams/:teamId/catalog"                          element={<ProtectedLayout><ProjectCatalog /></ProtectedLayout>} />
        <Route path="/teams/:teamId/catalog/new"                      element={<ProtectedLayout><CatalogFormPage /></ProtectedLayout>} />
        <Route path="/teams/:teamId/catalog/:catalogId/edit"          element={<ProtectedLayout><CatalogFormPage /></ProtectedLayout>} />
        <Route path="/teams/:teamId/catalog/:catalogId"               element={<ProtectedLayout><CatalogDetailPage /></ProtectedLayout>} />

        {/* Insights */}
        <Route path="/teams/:teamId/cloud-cost"           element={<ProtectedLayout><CloudCost /></ProtectedLayout>} />
        <Route path="/teams/:teamId/collaboration"        element={<ProtectedLayout><Collaboration /></ProtectedLayout>} />
        <Route path="/teams/:teamId/resource-allocation"  element={<ProtectedLayout><ResourceAllocation /></ProtectedLayout>} />
        <Route path="/teams/:teamId/connectors"           element={<ProtectedLayout><Connectors /></ProtectedLayout>} />
        <Route path="/teams/:teamId/announcements"         element={<ProtectedLayout><Announcements /></ProtectedLayout>} />
        <Route path="/teams/:teamId/mood"                 element={<ProtectedLayout><MoodDashboard /></ProtectedLayout>} />
        <Route path="/teams/:teamId/leaderboard"          element={<ProtectedLayout><Leaderboard /></ProtectedLayout>} />
        <Route path="/teams/:teamId/notifications-centre" element={<ProtectedLayout><NotificationCentre /></ProtectedLayout>} />
        <Route path="/teams/:teamId/standup"              element={<ProtectedLayout><StandupBot /></ProtectedLayout>} />
        <Route path="/teams/:teamId/team-status"          element={<ProtectedLayout><TeamStatusBoard /></ProtectedLayout>} />
        <Route path="/teams/:teamId/priorities"           element={<ProtectedLayout><TodaysPriorities /></ProtectedLayout>} />
        <Route path="/teams/:teamId/okr"                  element={<ProtectedLayout><OKRTracker /></ProtectedLayout>} />

        {/* Catch-all */}
        <Route path="*" element={<AuthRedirect />} />
      </Routes>
    </Suspense>
  </>
);

// ─── Root ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <SprintProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SprintProvider>
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;
