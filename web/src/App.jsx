import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingLayout } from './layouts/LandingLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ROLES } from './config/constants';
import { Toaster } from 'react-hot-toast';

// Lazy load views for optimization splits
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          {/* Notifications container popup */}
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'font-semibold text-sm rounded-xl border border-border-light shadow-card bg-card-white text-text-primary',
              success: {
                iconTheme: { primary: '#4CAF50', secondary: '#fff' }
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#fff' }
              }
            }} 
          />

          <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-russian-white">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <Routes>
              {/* Marketing landing views */}
              <Route element={<LandingLayout />}>
                <Route path="/" element={<LandingPage />} />
              </Route>

              {/* Console Authentication */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected console platform slots */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  
                  {/* Restricted Admin Route */}
                  <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPERADMIN, ROLES.ADMIN]} />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                </Route>
              </Route>

              {/* Fallback route handles */}
              <Route path="/unauthorized" element={
                <div className="flex h-screen flex-col items-center justify-center bg-russian-white gap-4">
                  <h2 className="text-xl font-bold font-display text-text-primary">Unauthorized access</h2>
                  <p className="text-sm text-text-secondary">Your profile roles lack permission to browse this panel.</p>
                  <Navigate to="/dashboard" replace />
                </div>
              } />
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
