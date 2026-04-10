import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/tickets/TicketList';
import TicketCreate from './pages/tickets/TicketCreate';
import TicketDetail from './pages/tickets/TicketDetail';
import AssetList from './pages/assets/AssetList';
import AssetDetail from './pages/assets/AssetDetail';
import AssetCreate from './pages/assets/AssetCreate';
import UserList from './pages/users/UserList';
import UserProfile from './pages/users/UserProfile';
import MetricsDashboard from './pages/metrics/MetricsDashboard';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Tickets */}
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/new" element={<TicketCreate />} />
          <Route path="tickets/:id" element={<TicketDetail />} />

          {/* Assets */}
          <Route
            path="assets"
            element={
              <RequireRole roles={['ADMIN', 'IT_AGENT']}>
                <AssetList />
              </RequireRole>
            }
          />
          <Route
            path="assets/new"
            element={
              <RequireRole roles={['ADMIN', 'IT_AGENT']}>
                <AssetCreate />
              </RequireRole>
            }
          />
          <Route
            path="assets/:id"
            element={
              <RequireRole roles={['ADMIN', 'IT_AGENT']}>
                <AssetDetail />
              </RequireRole>
            }
          />

          {/* Users */}
          <Route
            path="users"
            element={
              <RequireRole roles={['ADMIN', 'IT_AGENT']}>
                <UserList />
              </RequireRole>
            }
          />
          <Route path="users/:id" element={<UserProfile />} />

          {/* Metrics */}
          <Route
            path="metrics"
            element={
              <RequireRole roles={['ADMIN', 'IT_AGENT']}>
                <MetricsDashboard />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
