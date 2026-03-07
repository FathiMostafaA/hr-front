import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import ActivatePage from './pages/auth/ActivatePage';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeProfile from './pages/employees/EmployeeProfile';
import DepartmentList from './pages/departments/DepartmentList';
import AttendancePage from './pages/attendance/AttendancePage';
import LeavePage from './pages/leaves/LeavePage';
import PayrollPage from './pages/payroll/PayrollPage';
import MyPayroll from './pages/payroll/MyPayroll';
import RecruitmentPage from './pages/recruitment/RecruitmentPage';
import PerformancePage from './pages/performance/PerformancePage';
import DocumentPage from './pages/documents/DocumentPage';
import SettingsPage from './pages/settings/SettingsPage';
import FeedPage from './pages/feed/FeedPage';
import UserManagement from './pages/admin/UserManagement';
import OrgChartPage from './pages/org/OrgChartPage';
import TrainingPage from './pages/training/TrainingPage';
import SanctionsPage from './pages/sanctions/SanctionsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import ReportsPage from './pages/reports/ReportsPage';
import CareersPage from './pages/careers/CareersPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  const userRoles = user?.roles || [];
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activate" element={<ActivatePage />} />

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
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager']}>
              <EmployeeList />
            </RoleProtectedRoute>
          } />
          <Route path="employees/:id" element={<EmployeeProfile />} />
          <Route path="departments" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager']}>
              <DepartmentList />
            </RoleProtectedRoute>
          } />

          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<LeavePage />} />

          <Route path="payroll" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager']}>
              <PayrollPage />
            </RoleProtectedRoute>
          } />
          <Route path="my-payroll" element={<MyPayroll />} />

          <Route path="recruitment" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager']}>
              <RecruitmentPage />
            </RoleProtectedRoute>
          } />

          <Route path="performance" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'Manager', 'Employee']}>
              <PerformancePage />
            </RoleProtectedRoute>
          } />

          <Route path="documents" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager']}>
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
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'Manager', 'Employee']}>
              <TrainingPage />
            </RoleProtectedRoute>
          } />

          <Route path="sanctions" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager', 'Manager', 'Employee']}>
              <SanctionsPage />
            </RoleProtectedRoute>
          } />

          <Route path="audit" element={
            <RoleProtectedRoute allowedRoles={['Admin']}>
              <AuditLogsPage />
            </RoleProtectedRoute>
          } />

          <Route path="reports" element={
            <RoleProtectedRoute allowedRoles={['Admin', 'HRManager']}>
              <ReportsPage />
            </RoleProtectedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
