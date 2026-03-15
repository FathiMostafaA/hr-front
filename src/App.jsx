import React from 'react';
import { Loader2 } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const ActivatePage = React.lazy(() => import('./pages/auth/ActivatePage'));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const EmployeeList = React.lazy(() => import('./pages/employees/EmployeeList'));
const EmployeeProfile = React.lazy(() => import('./pages/employees/EmployeeProfile'));
const DepartmentList = React.lazy(() => import('./pages/departments/DepartmentList'));
const AttendancePage = React.lazy(() => import('./pages/attendance/AttendancePage'));
const LeavePage = React.lazy(() => import('./pages/leaves/LeavePage'));
const PayrollPage = React.lazy(() => import('./pages/payroll/PayrollPage'));
const MyPayroll = React.lazy(() => import('./pages/payroll/MyPayroll'));
const RecruitmentPage = React.lazy(() => import('./pages/recruitment/RecruitmentPage'));
const PerformancePage = React.lazy(() => import('./pages/performance/PerformancePage'));
const DocumentPage = React.lazy(() => import('./pages/documents/DocumentPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const FeedPage = React.lazy(() => import('./pages/feed/FeedPage'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const OrgChartPage = React.lazy(() => import('./pages/org/OrgChartPage'));
const TrainingPage = React.lazy(() => import('./pages/training/TrainingPage'));
const SanctionsPage = React.lazy(() => import('./pages/sanctions/SanctionsPage'));
const AuditLogsPage = React.lazy(() => import('./pages/admin/AuditLogsPage'));
const ReportsPage = React.lazy(() => import('./pages/reports/ReportsPage'));
const CareersPage = React.lazy(() => import('./pages/careers/CareersPage'));
const AccessDeniedPage = React.lazy(() => import('./pages/errors/AccessDeniedPage'));
const HolidaysPage = React.lazy(() => import('./pages/admin/HolidaysPage'));
const CalendarPage = React.lazy(() => import('./pages/calendar/CalendarPage'));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <Loader2 className="w-8 h-8 text-accent animate-spin" />
    </div>
  );

  const userRoles = user?.roles || [];
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/access-denied" replace state={{ requiredRoles: allowedRoles }} />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-slate-50">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate" element={<ActivatePage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

        {/* Public Careers Routes */}
        <Route path="/careers" element={<CareersPage />} />

        {/* App Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Admin & HR Restricted Routes */}
          <Route path="employees" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR']}>
              <EmployeeList />
            </RoleProtectedRoute>
          } />
          <Route path="employees/:id" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR', 'Manager', 'Employee']}>
              <EmployeeProfile />
            </RoleProtectedRoute>
          } />
          <Route path="departments" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR']}>
              <DepartmentList />
            </RoleProtectedRoute>
          } />

          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<LeavePage />} />

          <Route path="payroll" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR']}>
              <PayrollPage />
            </RoleProtectedRoute>
          } />
          <Route path="my-payroll" element={<MyPayroll />} />

          <Route path="recruitment" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR']}>
              <RecruitmentPage />
            </RoleProtectedRoute>
          } />

          <Route path="performance" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR', 'Manager', 'Employee']}>
              <PerformancePage />
            </RoleProtectedRoute>
          } />

          <Route path="documents" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR', 'Employee']}>
              <DocumentPage />
            </RoleProtectedRoute>
          } />

          <Route path="feed" element={<FeedPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="users" element={
            <RoleProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </RoleProtectedRoute>
          } />

          <Route path="org-chart" element={<OrgChartPage />} />

          <Route path="training" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR', 'Manager', 'Employee']}>
              <TrainingPage />
            </RoleProtectedRoute>
          } />

          <Route path="company-calendar" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR', 'Manager', 'Employee']}>
              <CalendarPage />
            </RoleProtectedRoute>
          } />

          <Route path="sanctions" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR', 'Manager', 'Employee']}>
              <SanctionsPage />
            </RoleProtectedRoute>
          } />

          <Route path="audit" element={
            <RoleProtectedRoute allowedRoles={['Admin']}>
              <AuditLogsPage />
            </RoleProtectedRoute>
          } />

          <Route path="reports" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR']}>
              <ReportsPage />
            </RoleProtectedRoute>
          } />

          <Route path="holidays" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'HR']}>
              <HolidaysPage />
            </RoleProtectedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </AuthProvider>
  );
}

export default App;
